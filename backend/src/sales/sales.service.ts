import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditService } from '../audit/audit.service';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { Inventory, WarehouseLocation } from '../entities/inventory.entity';
import { InventoryService } from '../inventory/inventory.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../entities/user.entity';
import { PricingService } from '../pricing/pricing.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private inventoryService: InventoryService,
    private dataSource: DataSource,
    private auditService: AuditService,
    private pricingService: PricingService,
  ) {}

  async createOrder(user: any, dto: CreateOrderDto) {
    console.log(`[SalesService] Creating order for user: ${user?.email || 'unknown'} (ID: ${user?.id})`);
    if (!user || (!user.id && !user.userId)) {
      throw new BadRequestException('User information missing from request');
    }
    const userId = user.id || user.userId;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const item of dto.items) {
        // 1. Get Product with base price
        const product = await queryRunner.manager.findOne(Product, { where: { id: item.productId } });
        if (!product) throw new BadRequestException(`Product ID ${item.productId} not found`);

        const unitCost = product.basePrice || 0;
        
        // 2. Check Inventory (South Warehouse)
        const inventory = await queryRunner.manager.findOne(Inventory, {
          where: { product: { id: item.productId }, warehouse: WarehouseLocation.SOUTH },
        });

        if (!inventory || (inventory as any).quantity < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}`);
        }

        // 3. Prepare Order Item
        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = item.quantity;
        orderItem.unitPrice = unitCost;
        
        // Dynamic Pricing Logic based on Manageable Rules
        const pricing = await this.pricingService.calculatePricing(item.productId, unitCost, item.quantity);
        orderItem.markup = pricing.markup;
        orderItem.landedPrice = pricing.landedPrice;
        
        subtotal += item.quantity * unitCost; // subtotal is pure base cost
        orderItems.push(orderItem);
      }

      // 4. Calculate Tax (7% split)
      const taxAmount = parseFloat((subtotal * 0.07).toFixed(2));
      const totalAmount = subtotal + taxAmount;

      // 5. Save Order
      const order = this.orderRepository.create({
        user: { id: userId } as any,
        subtotal,
        taxAmount,
        totalAmount,
        clientName: dto.clientName,
        clientAddress: dto.clientAddress,
        clientAttention: dto.clientAttention,
      });

      const savedOrder = await queryRunner.manager.save(order);
      
      for (const item of orderItems) {
        item.order = savedOrder;
        await queryRunner.manager.save(item);
      }

      await queryRunner.commitTransaction();
      
      await this.auditService.log(user.email, 'CREATE_ORDER', `Created order #${savedOrder.id} - Total: $${totalAmount}`, savedOrder.id.toString());
      
      const fullOrder = await this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product']
      });
      return fullOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getOrders() {
    return this.orderRepository.find({
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getOrderById(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user']
    });
    if (!order) throw new BadRequestException(`Order #${id} not found`);
    return order;
  }

  async dispatchOrder(id: number, dto: any) {
    const order = await this.getOrderById(id);
    
    order.status = OrderStatus.DISPATCHED;
    order.markupTotal = dto.markupTotal || 0;
    order.freightCost = dto.freightCost || 0;
    order.paymentTerms = dto.paymentTerms || 'N/A';
    order.transportType = dto.transportType || 'N/A';
    order.shippingAddress = dto.shippingAddress || 'N/A';
    order.taxAmount = dto.taxAmount || order.taxAmount;
    order.totalAmount = dto.totalAmount || order.totalAmount;

    const saved = await this.orderRepository.save(order);

    // DEFERRED STOCK DEDUCTION: Now that it is "Active" (Dispatched), subtract from inventory
    for (const item of order.items) {
      await this.inventoryService.updateStock(item.product.id, WarehouseLocation.SOUTH, -item.quantity);
    }
    
    await this.auditService.log(order.user?.email || 'system', 'DISPATCH_ORDER', `Finalized and dispatched order #${id}`, id.toString());
    
    return saved;
  }

  async packOrder(id: number) {
    const order = await this.getOrderById(id);
    if (order.status === OrderStatus.DISPATCHED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Order already completed');
    }
    order.status = OrderStatus.PACKED;
    const saved = await this.orderRepository.save(order);
    await this.auditService.log(order.user?.email || 'system', 'PACK_ORDER', `Order #${id} marked as PACKED. Ready for dispatch.`, id.toString());
    return saved;
  }

  async getAnalytics() {
    const orders = await this.orderRepository.find({ relations: ['items'] });
    
    const stats = {
      totalRevenue: 0,
      activePipeline: 0,
      totalUnitsSold: 0,
      orderCount: orders.length,
      dispatchedCount: 0,
    };

    orders.forEach(o => {
      if (o.status === OrderStatus.DISPATCHED) {
        stats.totalRevenue += Number(o.totalAmount);
        stats.dispatchedCount++;
      } else {
        stats.activePipeline += Number(o.totalAmount);
      }

      o.items.forEach(item => {
        stats.totalUnitsSold += item.quantity;
      });
    });

    return stats;
  }

  async updateOrder(id: number, dto: any) {
    const order = await this.getOrderById(id);
    if (dto.clientName) order.clientName = dto.clientName;
    if (dto.clientAddress) order.clientAddress = dto.clientAddress;
    if (dto.clientAttention) order.clientAttention = dto.clientAttention;
    
    // Simplistic update for quantity if provided in items array (re-using first item pattern)
    if (dto.items && dto.items[0]) {
      const firstItem = order.items[0];
      if (firstItem) {
        firstItem.quantity = dto.items[0].quantity;
        // recalculate subtotal/total if needed, but for MVP let's keep it simple
      }
    }

    return this.orderRepository.save(order);
  }

  async deleteOrder(user: any, id: number) {
    const order = await this.getOrderById(id);
    
    // Logic for Restore Stock if DISPATCHED
    if (order.status === OrderStatus.DISPATCHED) {
      console.log(`[SalesService] Order #${id} was DISPATCHED. Restoring stock...`);
      for (const item of order.items) {
        await this.inventoryService.updateStock(item.product.id, WarehouseLocation.SOUTH, item.quantity);
      }
    }

    await this.orderRepository.remove(order);
    await this.auditService.log(user?.email || 'system', 'DELETE_ORDER', `Deleted order #${id} (Sequence Terminated)`, id.toString());
    return { success: true };
  }
}
