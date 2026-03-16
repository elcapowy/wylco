import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

export interface PriceComponent {
  label: string;
  value: number;
  type: 'COST' | 'MARGIN' | 'TAX' | 'DISCOUNT';
}

export interface ValueChainStage {
  actor: string;
  components: PriceComponent[];
  observations?: string;
}

@Entity()
export class PriceScenario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Product, { nullable: true })
  product: Product;

  @Column({ type: 'float' })
  baseCost: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb' })
  stages: ValueChainStage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
