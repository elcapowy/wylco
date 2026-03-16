import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { WarehouseLocation } from '../entities/inventory.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll() {
    return this.inventoryService.findAll();
  }

  @Patch('stock')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  async updateStock(
    @Body('productId') productId: number,
    @Body('warehouse') warehouse: WarehouseLocation,
    @Body('quantityDelta') quantityDelta: number,
  ) {
    return this.inventoryService.updateStock(productId, warehouse, quantityDelta);
  }

  @Get('low-stock')
  async checkLowStock(@Query('warehouse') warehouse?: WarehouseLocation) {
    return this.inventoryService.checkLowStock(warehouse);
  }
}
