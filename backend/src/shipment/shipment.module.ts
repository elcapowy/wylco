import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentService } from './shipment.service';
import { ShipmentController } from './shipment.controller';
import { ShipmentGateway } from './shipment.gateway';
import { Shipment, ShipmentItem, AuditLog } from '../entities';
import { InventoryModule } from '../inventory/inventory.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, ShipmentItem]),
    InventoryModule,
    AuthModule,
  ],
  controllers: [ShipmentController],
  providers: [ShipmentService, ShipmentGateway],
  exports: [ShipmentService],
})
export class ShipmentModule {}
