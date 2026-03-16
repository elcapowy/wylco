import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const productCount = await this.productRepo.count();
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      database: {
        type: process.env.DB_TYPE || 'sqlite',
        active: true,
        productCount: productCount
      },
      network: {
        port: 3001,
        interface: 'localhost',
        stack: 'Stable',
      }
    };
  }
}
