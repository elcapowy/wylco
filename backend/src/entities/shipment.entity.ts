import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { ShipmentItem } from './shipment-item.entity';
import { Vehicle } from './vehicle.entity';

export enum ShipmentStatus {
  IN_TRANSIT = 'IN_TRANSIT',
  CUSTOMS_MIAMI = 'CUSTOMS_MIAMI',
  ARRIVED = 'ARRIVED',
  DEPARTED = 'DEPARTED',
  POSTPONED = 'POSTPONED',
}

export enum ShipmentType {
  IMPORT = 'IMPORT',
  LOCAL = 'LOCAL',
}

@Entity()
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  containerNumber: string;

  @Column({
    default: ShipmentStatus.IN_TRANSIT,
  })
  status: ShipmentStatus;

  @Column({
    type: 'enum',
    enum: ShipmentType,
    default: ShipmentType.IMPORT,
  })
  type: ShipmentType;

  @Column({ nullable: true })
  supplierName: string;

  @Column({ nullable: true })
  paymentTerms: string;

  @Column({ nullable: true })
  purchaseDate: Date;

  @Column({ nullable: true })
  incoterms: string;

  @Column({ nullable: true })
  eta: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ default: false })
  hasLiabilityInsurance: boolean;

  @Column({ nullable: true })
  insurancePolicyNumber: string;

  @Column({ nullable: true })
  insuranceExpiryDate: Date;

  @OneToMany(() => ShipmentItem, (item) => item.shipment)
  items: ShipmentItem[];

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.shipments, { nullable: true })
  vehicle: Vehicle;
}
