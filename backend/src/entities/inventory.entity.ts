import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

export enum WarehouseLocation {
  SOUTH = 'SOUTH',
  NORTH = 'NORTH',
  AMAZON_FBA = 'AMAZON_FBA',
}

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @Column({ default: 0 })
  lowStockThreshold: number;

  @Column({
    default: WarehouseLocation.SOUTH,
  })
  warehouse: WarehouseLocation;

  @ManyToOne(() => Product, (product) => product.inventories)
  product: Product;
}
