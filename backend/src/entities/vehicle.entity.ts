import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Shipment } from './shipment.entity';

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  plate: string;

  @Column()
  model: string;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @Column({ nullable: true })
  amazonRouteId: string;

  @OneToMany(() => Shipment, (shipment) => shipment.vehicle)
  shipments: Shipment[];
}
