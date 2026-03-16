import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  userEmail: string;

  @Column()
  action: string;

  @Column()
  details: string;

  @Column({ nullable: true })
  entityId: string;
}
