import { Controller, Post, Body, UseGuards, Request, Get, Param, Delete, Patch } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('orders')
  @Roles(UserRole.ADMIN)
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.salesService.createOrder(req.user, dto);
  }

  @Get('orders')
  async getOrders() {
    return this.salesService.getOrders();
  }

  @Get('analytics')
  async getAnalytics() {
    return this.salesService.getAnalytics();
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.salesService.getOrderById(+id);
  }

  @Post('orders/:id/dispatch')
  async dispatchOrder(@Param('id') id: string, @Body() dto: any) {
    return this.salesService.dispatchOrder(+id, dto);
  }

  @Post('orders/:id/pack')
  async packOrder(@Param('id') id: string) {
    return this.salesService.packOrder(+id);
  }

  @Patch('orders/:id')
  @Roles(UserRole.ADMIN)
  async updateOrder(@Param('id') id: string, @Body() dto: any) {
    return this.salesService.updateOrder(+id, dto);
  }

  @Delete('orders/:id')
  @Roles(UserRole.ADMIN)
  async deleteOrder(@Request() req, @Param('id') id: string) {
    return this.salesService.deleteOrder(req.user, +id);
  }
}
