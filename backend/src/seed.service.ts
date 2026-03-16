import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Inventory, WarehouseLocation } from './entities/inventory.entity';
import { Shipment, ShipmentStatus } from './entities/shipment.entity';
import { ShipmentItem } from './entities/shipment-item.entity';
import { PricingRule, PricingRuleType } from './entities/pricing-rule.entity';
import { PriceScenario } from './entities/price-scenario.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(ShipmentItem)
    private shipmentItemRepository: Repository<ShipmentItem>,
    @InjectRepository(PricingRule)
    private pricingRepository: Repository<PricingRule>,
    @InjectRepository(PriceScenario)
    private scenarioRepository: Repository<PriceScenario>,
  ) {}

  async onModuleInit() {
    console.log('--- Checking for Initial Data ---');
    
    // 1. Create Admin User if not exists
    const adminEmail = 'admin@wylco.com';
    const existingAdmin = await this.userRepository.findOne({ where: { email: adminEmail } });
    
    if (!existingAdmin) {
      const admin = this.userRepository.create({
        email: adminEmail,
        passwordHash: await bcrypt.hash('admin123', 10),
        role: UserRole.ADMIN,
        portOverride: true,
        logsAccess: true,
        financialView: true,
      });
      await this.userRepository.save(admin);
      console.log('Created Admin: admin@wylco.com / admin123');
    }

    const productsData = [
      { 
        sku: 'TFK11-S-10ML', 
        name: 'Tapa Fugas', 
        description: 'TAPA FUGAS K11 SERINGA 10ml 3TR (Pack of 192)', 
        basePrice: 6.30,
        purchasePrice: 6.30, 
        replacementPrice: 6.50, 
        salePriceMin: 15.75, 
        salePriceMax: 16.85, 
        isPromotion: false 
      },
      { 
        sku: 'TFK11-S-CON', 
        name: 'Tapa Fugas + Conector', 
        description: 'TAPA FUGAS K11 SERINGA + Adapter (Pack of 192)', 
        basePrice: 7.80,
        purchasePrice: 7.80, 
        replacementPrice: 8.00, 
        salePriceMin: 19.40, 
        salePriceMax: 20.80, 
        isPromotion: true 
      },
      { 
        sku: 'K11-21-S-11ML', 
        name: 'Tapa Fugas 2:1', 
        description: 'K11 2:1 SYRINGE 11ML (Pack of 192)', 
        basePrice: 7.80,
        purchasePrice: 7.80, 
        replacementPrice: 7.80, 
        salePriceMin: 19.60, 
        salePriceMax: 21.00, 
        isPromotion: false 
      },
      { 
        sku: '20002', 
        name: 'Coupler 1/4"', 
        description: 'COUPLER (Pack of 400)', 
        basePrice: 1.50,
        purchasePrice: 1.50, 
        replacementPrice: 1.60, 
        salePriceMin: 1.50, 
        salePriceMax: 1.80, 
        isPromotion: false 
      },
      { 
        sku: 'SPK11-B35', 
        name: 'Sella Plus K11', 
        description: 'SELLA PLUS K11 35ML BOTTLE (Pack of 48)', 
        basePrice: 5.00,
        purchasePrice: 5.00, 
        replacementPrice: 5.25, 
        salePriceMin: 8.75, 
        salePriceMax: 9.35, 
        isPromotion: true 
      },
    ];

    for (const p of productsData) {
      const existingProduct = await this.productRepository.findOne({ where: { sku: p.sku } });
      if (!existingProduct) {
        const product = await this.productRepository.save(this.productRepository.create(p));
        
        // 3. Create initial inventory
        await this.inventoryRepository.save(this.inventoryRepository.create({
          product,
          quantity: 1000,
          lowStockThreshold: 100,
          warehouse: WarehouseLocation.SOUTH,
        }));
        console.log(`Created Product: ${p.sku}`);
      } else {
        // Update existing with new data
        Object.assign(existingProduct, p);
        await this.productRepository.save(existingProduct);
      }
    }

    // 4. Create sample shipment if not exists
    const existingShipment = await this.shipmentRepository.findOne({ where: { containerNumber: 'WYLW-123456-9' } });
    if (!existingShipment) {
      const product = await this.productRepository.findOne({ where: { sku: 'TFK11-S-10ML' } });
      if (product) {
        const shipment = await this.shipmentRepository.save(this.shipmentRepository.create({
          containerNumber: 'WYLW-123456-9',
          status: ShipmentStatus.IN_TRANSIT,
          eta: new Date(Date.now() + 86400000 * 5), // In 5 days
        }));

        await this.shipmentItemRepository.save(this.shipmentItemRepository.create({
          shipment,
          product,
          quantity: 50,
        }));
        console.log('Created Seed Shipment: WYLW-123456-9');
      }
    }

    // 5. Create default Pricing Rules
    const existingRules = await this.pricingRepository.count();
    if (existingRules === 0) {
      const defaultRules = [
        { name: 'Standard Tier (Standard)', type: PricingRuleType.QTY_DISCOUNT, value: 0.15, threshold: 0 },
        { name: 'Silver Tier (Bulk 100+)', type: PricingRuleType.QTY_DISCOUNT, value: 0.10, threshold: 100 },
        { name: 'Gold Tier (Bulk 500+)', type: PricingRuleType.QTY_DISCOUNT, value: 0.05, threshold: 500 },
      ];
      for (const r of defaultRules) {
        await this.pricingRepository.save(this.pricingRepository.create(r));
      }
      console.log('Created Default Pricing Rules');
    }

    // 6. Create default Price Scenarios
    const existingScenarios = await this.scenarioRepository.count();
    if (existingScenarios === 0) {
      const scenario = this.scenarioRepository.create({
        name: 'Standard Widget v2',
        baseCost: 45.00,
        currency: 'USD',
        stages: [
          {
            actor: 'IMPORTER (EXW)',
            components: [
              { label: 'Freight & Duties', value: 12.50, type: 'COST' },
              { label: 'Port Fees', value: 0.70, type: 'TAX' }
            ]
          },
          {
            actor: 'DISTRIBUTOR (WH)',
            components: [
              { label: 'Local Logistics', value: 5.00, type: 'COST' },
              { label: 'Inventory Holding', value: 2.00, type: 'COST' },
              { label: 'Margin Importer', value: 17.50, type: 'MARGIN' }
            ]
          },
          {
            actor: 'FINAL CLIENT (MSRP)',
            components: [
              { label: 'Retail Taxes', value: 15.00, type: 'TAX' },
              { label: 'Retailer Margin', value: 20.00, type: 'MARGIN' }
            ]
          }
        ]
      });
      await this.scenarioRepository.save(scenario);
      console.log('Created Seed Price Scenario: Standard Widget v2');
    }

    console.log('--- Seeding Check Complete ---');
  }
}
