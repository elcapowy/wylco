import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('forecast')
  getForecast() {
    return this.analyticsService.getStockForecast();
  }

  @Get('replenishment/:productId')
  getReplenishment(@Param('productId') productId: number) {
    return this.analyticsService.getProductReplenishment(productId);
  }
}
