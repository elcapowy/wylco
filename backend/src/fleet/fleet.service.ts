import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Shipment } from '../entities/shipment.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    private auditService: AuditService,
  ) {}

  async findAllVehicles() {
    return this.vehicleRepository.find({ relations: ['shipments'] });
  }

  async createVehicle(data: any) {
    const vehicle = this.vehicleRepository.create(data);
    const saved = await this.vehicleRepository.save(vehicle) as unknown as Vehicle;
    await this.auditService.log('system', 'CREATE_VEHICLE', `Created vehicle ${saved.plate}`);
    return saved;
  }

  async updateVehicle(id: number, data: any) {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    Object.assign(vehicle, data);
    return this.vehicleRepository.save(vehicle);
  }

  async deleteVehicle(id: number) {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    await this.vehicleRepository.remove(vehicle);
  }

  async assignShipmentToVehicle(shipmentId: number, vehicleId: number) {
    const shipment = await this.shipmentRepository.findOne({ where: { id: shipmentId } });
    const vehicle = await this.vehicleRepository.findOne({ where: { id: vehicleId } });
    
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    shipment.vehicle = vehicle;
    await this.shipmentRepository.save(shipment);

    await this.auditService.log('system', 'ASSIGN_VEHICLE', `Assigned shipment ${shipment.containerNumber} to vehicle ${vehicle.plate}`);
    
    return shipment;
  }
}
