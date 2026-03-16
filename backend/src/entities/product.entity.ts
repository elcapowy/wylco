import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Inventory } from './inventory.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'float', default: 0 })
  basePrice: number;

  @Column({ type: 'float', default: 0 })
  purchasePrice: number;

  @Column({ type: 'float', default: 0 })
  replacementPrice: number;

  @Column({ type: 'float', default: 0 })
  salePriceMin: number;

  @Column({ type: 'float', default: 0 })
  salePriceMax: number;

  @Column({ default: false })
  isPromotion: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  reorderPoint: number;

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventories: Inventory[];
}
