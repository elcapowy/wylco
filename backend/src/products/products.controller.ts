import { Controller, Get, Post, Body, Param, UseGuards, Patch, Query, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../entities/product.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() data: Partial<Product>): Promise<Product> {
    return this.productsService.create(data);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(@Query('includeInactive') includeInactive: string): Promise<Product[]> {
    return this.productsService.findAll(includeInactive === 'true');
  }

  @Get('public-view')
  async findAllPublic(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(+id);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleStatus(@Param('id') id: string): Promise<Product> {
    return this.productsService.toggleStatus(+id);
  }

  @Patch(':id/reorder-point')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateReorderPoint(@Param('id') id: string, @Body('reorderPoint') reorderPoint: number): Promise<Product> {
    return this.productsService.updateReorderPoint(+id, reorderPoint);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() data: Partial<Product>): Promise<Product> {
    return this.productsService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.productsService.delete(+id);
  }
}
