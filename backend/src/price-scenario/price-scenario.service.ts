import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceScenario } from '../entities/price-scenario.entity';

@Injectable()
export class PriceScenarioService {
  constructor(
    @InjectRepository(PriceScenario)
    private scenarioRepository: Repository<PriceScenario>,
  ) {}

  async findAll() {
    return this.scenarioRepository.find({
      relations: ['product'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const scenario = await this.scenarioRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!scenario) throw new NotFoundException('Scenario not found');
    return scenario;
  }

  async create(data: Partial<PriceScenario>) {
    const scenario = this.scenarioRepository.create(data);
    return this.scenarioRepository.save(scenario);
  }

  async update(id: number, data: Partial<PriceScenario>) {
    await this.scenarioRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.scenarioRepository.delete(id);
    return { deleted: true };
  }

  async duplicate(id: number) {
    const original = await this.findOne(id);
    const copy = this.scenarioRepository.create({
      ...original,
      id: undefined,
      name: `${original.name} (Copy)`,
      createdAt: undefined,
      updatedAt: undefined,
    });
    return this.scenarioRepository.save(copy);
  }
}
