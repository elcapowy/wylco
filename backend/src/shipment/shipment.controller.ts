import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('shipments')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}
  
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.shipmentService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() data: any) {
    return this.shipmentService.create(data);
  }

  @Post(':id/arrive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  async handleArrival(@Param('id') id: string) {
    return this.shipmentService.handleArrivalConfirmation(+id);
  }

  @Get(':id/landed-cost')
  @UseGuards(JwtAuthGuard)
  async getLandedCost(@Param('id') id: string) {
    return this.shipmentService.calculateLandedCost(+id);
  }

  @Post('local')
  async createLocal(@Body() data: any) {
    return this.shipmentService.createLocalPurchase(data);
  }

  @Patch(':id/purchase')
  async updatePurchase(@Param('id') id: string, @Body() details: any) {
    return this.shipmentService.updatePurchaseDetails(+id, details);
  }

  @Patch(':id/insurance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleInsurance(@Param('id') id: string) {
    return this.shipmentService.toggleInsurance(+id);
  }

  @Patch(':id/postpone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  async postpone(@Param('id') id: string) {
    return this.shipmentService.postpone(+id);
  }

  @Post(':id/delete') // Using POST for delete to simplify frontend button mapping if needed, or @Delete
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.shipmentService.remove(+id);
  }
}
