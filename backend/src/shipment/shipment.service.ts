import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Shipment, ShipmentStatus, ShipmentType } from '../entities/shipment.entity';
import { ShipmentItem } from '../entities/shipment-item.entity';
import { Inventory, WarehouseLocation } from '../entities/inventory.entity';
import { Product } from '../entities/product.entity';
import { AuditService } from '../audit/audit.service';
import { validateISO6346 } from '../common/utils/iso6346.util';
import { ShipmentGateway } from './shipment.gateway';

@Injectable()
export class ShipmentService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(ShipmentItem)
    private shipmentItemRepository: Repository<ShipmentItem>,
    private dataSource: DataSource,
    private shipmentGateway: ShipmentGateway,
    private auditService: AuditService,
  ) {}

  /**
   * Confirms the arrival of a shipment and updates inventory accordingly.
   * @param shipmentId The ID of the shipment to confirm.
   */
  async handleArrivalConfirmation(shipmentId: number): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({ 
      where: { id: shipmentId },
      relations: ['items', 'items.product']
    });

    if (!shipment) throw new NotFoundException('Shipment not found');

    if (shipment.status === ShipmentStatus.ARRIVED) {
      throw new BadRequestException('Shipment has already arrived');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      shipment.status = ShipmentStatus.ARRIVED;
      shipment.updatedAt = new Date();
      await queryRunner.manager.save(Shipment, shipment);

      for (const item of shipment.items || []) {
        let inventory = await queryRunner.manager.findOne(Inventory, {
          where: { product: { id: item.product.id }, warehouse: WarehouseLocation.SOUTH },
        });

        if (!inventory) {
          inventory = queryRunner.manager.create(Inventory, {
            product: item.product,
            warehouse: WarehouseLocation.SOUTH,
            quantity: item.quantity,
          });
        } else {
          inventory.quantity += item.quantity;
        }
        await queryRunner.manager.save(Inventory, inventory);
      }
      
      await queryRunner.commitTransaction();

      this.shipmentGateway.server.emit('shipmentStatusChanged', {
        id: shipment.id,
        containerNumber: shipment.containerNumber,
        status: shipment.status,
      });

      return shipment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: number) {
    const shipment = await this.shipmentRepository.findOne({ where: { id }, relations: ['items', 'items.product'] });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async calculateLandedCost(id: number) {
    const shipment = await this.findOne(id);
    let totalItemsValue = 0;
    
    // Calculate real value based on items
    shipment.items?.forEach(item => {
      const price = item.unitPurchasePrice || item.product.purchasePrice || 10;
      totalItemsValue += item.quantity * price;
    });

    const freight = 2500;
    const customsDuty = 0.05 * totalItemsValue;
    
    // Liability Insurance (2% of total items value if enabled and not expired)
    const isInsuranceActive = shipment.hasLiabilityInsurance && 
                             (!shipment.insuranceExpiryDate || new Date(shipment.insuranceExpiryDate) > new Date());
    const insuranceCost = isInsuranceActive ? 0.02 * totalItemsValue : 0;
    
    const landedCost = totalItemsValue + freight + customsDuty + insuranceCost;

    await this.auditService.log('system', 'CALCULATE_LANDED_COST', `Landed cost for ${shipment.containerNumber}: $${landedCost.toFixed(2)} (Insurance: $${insuranceCost.toFixed(2)})`, shipment.id.toString());
    
    return {
      container: shipment.containerNumber,
      totalItemsValue,
      freight,
      customsDuty,
      insuranceCost,
      landedCost,
      isInsuranceActive,
      policyNumber: shipment.insurancePolicyNumber,
      expiryDate: shipment.insuranceExpiryDate
    };
  }

  async toggleInsurance(id: number) {
    const shipment = await this.shipmentRepository.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    
    shipment.hasLiabilityInsurance = !shipment.hasLiabilityInsurance;
    shipment.updatedAt = new Date();
    const saved = await this.shipmentRepository.save(shipment);
    
    await this.auditService.log('system', 'TOGGLE_INSURANCE', `Insurance for ${shipment.containerNumber} is now ${saved.hasLiabilityInsurance ? 'ENABLED' : 'DISABLED'}`, shipment.id.toString());
    
    return saved;
  }

  async updatePurchaseDetails(id: number, details: any) {
    const shipment = await this.findOne(id);
    
    if (details.supplierName) shipment.supplierName = details.supplierName;
    if (details.paymentTerms) shipment.paymentTerms = details.paymentTerms;
    if (details.incoterms) shipment.incoterms = details.incoterms;
    if (details.purchaseDate) shipment.purchaseDate = new Date(details.purchaseDate);
    if (details.insurancePolicyNumber) shipment.insurancePolicyNumber = details.insurancePolicyNumber;
    if (details.insuranceExpiryDate) shipment.insuranceExpiryDate = new Date(details.insuranceExpiryDate);
    
    if (details.items && Array.isArray(details.items)) {
      for (const itemUpdate of details.items) {
        const item = shipment.items.find(i => i.id === itemUpdate.id);
        if (item) {
          if (itemUpdate.unitPurchasePrice !== undefined) item.unitPurchasePrice = itemUpdate.unitPurchasePrice;
          if (itemUpdate.quantity !== undefined) item.quantity = itemUpdate.quantity;
          await this.shipmentItemRepository.save(item);
        }
      }
    }
    
    shipment.updatedAt = new Date();
    const saved = await this.shipmentRepository.save(shipment);
    
    await this.auditService.log('system', 'UPDATE_PURCHASE_DETAILS', `Updated purchase details for ${shipment.containerNumber}`, shipment.id.toString());
    
    return this.findOne(id);
  }

  /**
   * Registers a new local purchase and prepares for arrival.
   */
  async createLocalPurchase(data: any): Promise<Shipment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const shipment = this.shipmentRepository.create({
        containerNumber: `LOCAL-${Date.now()}`,
        type: ShipmentType.LOCAL,
        status: ShipmentStatus.IN_TRANSIT,
        supplierName: data.supplierName,
        paymentTerms: data.paymentTerms,
        purchaseDate: new Date(),
        insurancePolicyNumber: data.insurancePolicyNumber,
        insuranceExpiryDate: data.insuranceExpiryDate ? new Date(data.insuranceExpiryDate) : undefined,
        eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });

      const savedShipment = await queryRunner.manager.save(Shipment, shipment);

      if (data.items && Array.isArray(data.items)) {
        for (const itemData of data.items) {
          const product = await queryRunner.manager.findOne(Product, { where: { id: itemData.productId } });
          if (product) {
            const item = this.shipmentItemRepository.create({
              shipment: savedShipment,
              product,
              quantity: itemData.quantity,
              unitPurchasePrice: itemData.unitPurchasePrice || product.purchasePrice,
            });
            await queryRunner.manager.save(ShipmentItem, item);
          }
        }
      }

      await queryRunner.commitTransaction();
      await this.auditService.log('system', 'CREATE_LOCAL_PURCHASE', `Created local purchase ${savedShipment.containerNumber}`);
      
      return this.findOne(savedShipment.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return this.shipmentRepository.find({ relations: ['items', 'items.product'] });
  }

  async remove(id: number) {
    const shipment = await this.findOne(id);
    
    // Delete items first to maintain referential integrity
    await this.shipmentItemRepository.delete({ shipment: { id } });
    await this.shipmentRepository.remove(shipment);
    
    await this.auditService.log('system', 'DELETE_SHIPMENT', `Deleted shipment ${shipment.containerNumber}`, id.toString());
    
    return { success: true };
  }

  async postpone(id: number) {
    const shipment = await this.shipmentRepository.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    
    shipment.status = ShipmentStatus.POSTPONED;
    shipment.updatedAt = new Date();
    const saved = await this.shipmentRepository.save(shipment);
    
    await this.auditService.log('system', 'POSTPONE_SHIPMENT', `Shipment ${shipment.containerNumber} is now POSTPONED`, id.toString());
    
    return saved;
  }

  /**
   * Manually creates a shipment with detailed tracking information.
   */
  async create(data: any): Promise<Shipment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const shipment = this.shipmentRepository.create({
        containerNumber: data.containerNumber || `MANUAL-${Date.now()}`,
        type: data.type || ShipmentType.IMPORT,
        status: data.status || ShipmentStatus.IN_TRANSIT,
        supplierName: data.supplierName,
        paymentTerms: data.paymentTerms,
        incoterms: data.incoterms,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
        insurancePolicyNumber: data.insurancePolicyNumber,
        insuranceExpiryDate: data.insuranceExpiryDate ? new Date(data.insuranceExpiryDate) : undefined,
        eta: data.eta ? new Date(data.eta) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

      const savedShipment = await queryRunner.manager.save(Shipment, shipment);

      if (data.items && Array.isArray(data.items)) {
        for (const itemData of data.items) {
          const product = await queryRunner.manager.findOne(Product, { where: { id: itemData.productId } });
          if (product) {
            const item = this.shipmentItemRepository.create({
              shipment: savedShipment,
              product,
              quantity: itemData.quantity,
              unitPurchasePrice: itemData.unitPurchasePrice || product.purchasePrice,
            });
            await queryRunner.manager.save(ShipmentItem, item);
          }
        }
      }

      await queryRunner.commitTransaction();
      await this.auditService.log('system', 'CREATE_SHIPMENT', `Created manual shipment ${savedShipment.containerNumber}`);
      
      return this.findOne(savedShipment.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
