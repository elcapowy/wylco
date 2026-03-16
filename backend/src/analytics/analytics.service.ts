import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';
import { Inventory } from '../entities/inventory.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getStockForecast() {
    // 1. Get consumption rate for last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const orders = await this.orderRepository.find({
      where: { 
        createdAt: MoreThan(fourteenDaysAgo),
        status: OrderStatus.DISPATCHED 
      },
      relations: ['items', 'items.product'],
    });

    const products = await this.productRepository.find({
      relations: ['inventories'],
    });

    const activeShipments = await this.shipmentRepository.find({
      where: [
        { status: ShipmentStatus.IN_TRANSIT },
        { status: ShipmentStatus.CUSTOMS_MIAMI },
        { status: ShipmentStatus.DEPARTED },
      ],
      relations: ['items', 'items.product'],
    });

    // Calculate average daily burn per product
    const burnRateMap = new Map<number, number>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const rate = burnRateMap.get(item.product.id) || 0;
        burnRateMap.set(item.product.id, rate + (item.quantity / 14));
      });
    });

    // Forecast for next 7 days
    const forecast: any[] = [];
    const today = new Date();

    for (let i = 0; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayLabel = date.toISOString().split('T')[0];

        let totalProjectedStock = 0;
        let totalIncoming = 0;

        products.forEach(product => {
            const currentStock = product.inventories?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
            const burnRate = burnRateMap.get(product.id) || 0;
            
            // Expected stock on this day: current - (burn * days) + incoming (if eta <= date)
            let projected = currentStock - (burnRate * i);
            
            activeShipments.forEach(ship => {
                if (ship.eta && new Date(ship.eta) <= date) {
                  const item = ship.items.find(si => si.product.id === product.id);
                  if (item) {
                    projected += item.quantity;
                    if (new Date(ship.eta).toDateString() === date.toDateString()) {
                        totalIncoming += item.quantity;
                    }
                  }
                }
            });

            totalProjectedStock += Math.max(0, projected);
        });

        forecast.push({
            date: dayLabel,
            stock: Math.round(totalProjectedStock),
            incoming: totalIncoming,
        });
    }

    return forecast;
  }

  async getProductReplenishment(productId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['inventories'],
    });
    if (!product) return null;

    const currentStock = product.inventories?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
    
    // Get burn rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await this.orderRepository.find({
      where: { 
        createdAt: MoreThan(thirtyDaysAgo),
        status: OrderStatus.DISPATCHED 
      },
      relations: ['items', 'items.product'],
    });

    let totalSold = 0;
    orders.forEach(o => {
      const item = o.items.find(i => i.product.id === productId);
      if (item) totalSold += item.quantity;
    });

    const dailyBurn = totalSold / 30;
    const daysUntilStockout = dailyBurn > 0 ? Math.floor(currentStock / dailyBurn) : 999;
    
    // Recommended Min Stock: 14 days of burn + 25% safety buffer
    const recommendedMin = Math.ceil((dailyBurn * 14) * 1.25);

    return {
      productId,
      productName: product.name,
      currentStock,
      dailyBurn: dailyBurn.toFixed(2),
      daysUntilStockout,
      recommendedMin,
      reorderPoint: product.reorderPoint || 0,
      status: daysUntilStockout < 7 ? 'CRITICAL' : (daysUntilStockout < 21 ? 'WARNING' : 'STABLE')
    };
  }
}
