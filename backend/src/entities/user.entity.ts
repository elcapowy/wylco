import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  DISPATCHER = 'DISPATCHER',
  AUDITOR = 'AUDITOR',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    default: UserRole.DISPATCHER,
  })
  role: UserRole;

  @Column({ default: false })
  portOverride: boolean;

  @Column({ default: false })
  logsAccess: boolean;

  @Column({ default: false })
  financialView: boolean;

  @Column({ default: true })
  isActive: boolean;
}
