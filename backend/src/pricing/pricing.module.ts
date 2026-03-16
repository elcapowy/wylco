import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingRule } from '../entities/pricing-rule.entity';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

import { Product } from '../entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PricingRule, Product])],
  providers: [PricingService],
  controllers: [PricingController],
  exports: [PricingService],
})
export class PricingModule {}
