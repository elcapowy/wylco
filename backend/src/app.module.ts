import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeedService } from './seed.service';
import { InventoryModule } from './inventory/inventory.module';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { EventsModule } from './common/events.module';
import { ShipmentModule } from './shipment/shipment.module';
import { SalesModule } from './sales/sales.module';
import { PricingModule } from './pricing/pricing.module';
import { FleetModule } from './fleet/fleet.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PriceScenarioModule } from './price-scenario/price-scenario.module';
import { User, Product, Inventory, Shipment, ShipmentItem, Order, OrderItem, AuditLog, PricingRule, Vehicle, PriceScenario } from './entities';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get<TypeOrmModuleOptions>('database')!,
    }),
    TypeOrmModule.forFeature([User, Product, Inventory, AuditLog, Shipment, ShipmentItem, Order, OrderItem, PricingRule, Vehicle, PriceScenario]),
    InventoryModule,
    ProductsModule,
    AuthModule,
    AuditModule,
    ShipmentModule,
    SalesModule,
    EventsModule,
    PricingModule,
    FleetModule,
    AnalyticsModule,
    PriceScenarioModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
