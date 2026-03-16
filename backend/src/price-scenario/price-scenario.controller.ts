import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PriceScenarioService } from './price-scenario.service';
import { PriceScenario } from '../entities/price-scenario.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('price-scenarios')
@UseGuards(JwtAuthGuard)
export class PriceScenarioController {
  constructor(private readonly priceScenarioService: PriceScenarioService) {}

  @Get()
  findAll() {
    return this.priceScenarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.priceScenarioService.findOne(+id);
  }

  @Post()
  create(@Body() data: Partial<PriceScenario>) {
    return this.priceScenarioService.create(data);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.priceScenarioService.duplicate(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<PriceScenario>) {
    return this.priceScenarioService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.priceScenarioService.remove(+id);
  }
}
