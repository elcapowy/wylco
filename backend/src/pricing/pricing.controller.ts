import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingRule } from '../entities/pricing-rule.entity';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  findAll() {
    return this.pricingService.findAll();
  }

  @Post()
  create(@Body() data: Partial<PricingRule>) {
    return this.pricingService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<PricingRule>) {
    return this.pricingService.update(+id, data);
  }

  @Get('estimate')
  getEstimate(@Query('productId') productId: number, @Query('quantity') quantity: number) {
    return this.pricingService.getEstimate(+productId, +quantity);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pricingService.remove(+id);
  }
}
