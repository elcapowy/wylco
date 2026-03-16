import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User, Product, Inventory, Shipment, ShipmentItem, Order, OrderItem, AuditLog, PricingRule, Vehicle, PriceScenario } from '../entities';

config();

export default new DataSource({
  type: (process.env.DB_TYPE || 'sqlite') as 'postgres' | 'sqlite',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || (process.env.DB_TYPE === 'postgres' ? 'climacore' : 'database.sqlite'),
  entities: [User, Product, Inventory, Shipment, ShipmentItem, Order, OrderItem, AuditLog, PricingRule, Vehicle, PriceScenario],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, // Always false when using migrations
});
