import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Product, Inventory, Shipment, ShipmentItem, Order, OrderItem, AuditLog, PricingRule, Vehicle, PriceScenario } from '../entities';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const type = (process.env.DB_TYPE || 'sqlite') as 'postgres' | 'sqlite';

  if (type === 'postgres') {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'climacore',
      entities: [User, Product, Inventory, Shipment, ShipmentItem, Order, OrderItem, AuditLog, PricingRule, Vehicle, PriceScenario],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
      synchronize: true,
      extra: {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        keepAlive: true,
      },
      retryAttempts: 10,
      retryDelay: 3000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    type: 'sqlite',
    database: process.env.DB_DATABASE || 'database.sqlite',
    entities: [User, Product, Inventory, Shipment, ShipmentItem, Order, OrderItem, AuditLog, PricingRule, Vehicle, PriceScenario],
    migrations: ['dist/migrations/*.js'],
    migrationsRun: true,
    synchronize: process.env.NODE_ENV !== 'production',
  };
});
