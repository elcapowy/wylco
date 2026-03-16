import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory, WarehouseLocation } from '../entities/inventory.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async updateStock(productId: number, warehouse: WarehouseLocation, quantityDelta: number): Promise<Inventory> {
    let inventory = await this.inventoryRepository.findOne({
      where: { product: { id: productId }, warehouse },
    });

    if (!inventory) {
      if (quantityDelta < 0) {
        throw new BadRequestException('Cannot decrement stock for non-existent inventory record');
      }
      const product = await this.productsRepository.findOne({ where: { id: productId } });
      if (!product) throw new NotFoundException('Product not found');
      
      inventory = this.inventoryRepository.create({
        product,
        warehouse,
        quantity: quantityDelta,
      });
    } else {
      inventory.quantity += quantityDelta;
      if (inventory.quantity < 0) {
        throw new BadRequestException(`Insufficient stock in ${warehouse} warehouse`);
      }
    }

    return this.inventoryRepository.save(inventory);
  }

  async checkLowStock(warehouse?: WarehouseLocation): Promise<Inventory[]> {
    const query = this.inventoryRepository.createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.quantity <= inventory.lowStockThreshold');
    
    if (warehouse) {
      query.andWhere('inventory.warehouse = :warehouse', { warehouse });
    }

    return query.getMany();
  }

  async findByProduct(productId: number): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      where: { product: { id: productId } },
    });
  }

  async findAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      relations: ['product'],
    });
  }

  calculateVolumePrice(unitPrice: number, quantity: number): number {
    if (quantity >= 50) return unitPrice * 0.85; // 15% discount
    if (quantity >= 20) return unitPrice * 0.92; // 8% discount
    return unitPrice;
  }
}
