import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum PricingRuleType {
  MARKUP = 'MARKUP',
  DISCOUNT = 'DISCOUNT',
  PROMOTION = 'PROMOTION',
  QTY_DISCOUNT = 'QTY_DISCOUNT'
}

@Entity()
export class PricingRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PricingRuleType,
    default: PricingRuleType.MARKUP
  })
  type: PricingRuleType;

  @Column({ type: 'float' })
  value: number; // e.g., 0.15 for 15%

  @Column({ type: 'integer', default: 0 })
  threshold: number; // for QTY_DISCOUNT (e.g., 100 units)

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  productId: number; // optional: rule for specific product

  @Column({ nullable: true })
  clientEmail: string; // optional: rule for a specific recurring client

  @CreateDateColumn()
  createdAt: Date;
}
