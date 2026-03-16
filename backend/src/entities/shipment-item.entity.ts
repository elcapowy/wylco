import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Shipment } from './shipment.entity';
import { Product } from './product.entity';

@Entity()
export class ShipmentItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Shipment, (shipment) => shipment.items)
  shipment: Shipment;

  @ManyToOne(() => Product)
  product: Product;

  @Column()
  quantity: number;

  @Column({ type: 'float', nullable: true })
  unitPurchasePrice: number;
}
