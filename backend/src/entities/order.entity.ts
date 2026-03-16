import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  IN_PROCESS = 'IN_PROCESS',
  PACKED = 'PACKED',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'float', default: 0 })
  subtotal: number;

  @Column({ type: 'float', default: 0 })
  markupTotal: number;

  @Column({ type: 'float', default: 0 })
  taxAmount: number;

  @Column({ type: 'float', default: 0 })
  freightCost: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  clientName: string;

  @Column({ nullable: true })
  clientAddress: string;

  @Column({ nullable: true })
  clientAttention: string;

  @Column({ nullable: true })
  paymentTerms: string;

  @Column({ nullable: true })
  transportType: string;

  @Column({ nullable: true })
  shippingAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];
}
