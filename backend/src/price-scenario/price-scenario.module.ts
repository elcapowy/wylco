import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceScenario } from '../entities/price-scenario.entity';
import { PriceScenarioService } from './price-scenario.service';
import { PriceScenarioController } from './price-scenario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PriceScenario])],
  providers: [PriceScenarioService],
  controllers: [PriceScenarioController],
  exports: [PriceScenarioService],
})
export class PriceScenarioModule {}
