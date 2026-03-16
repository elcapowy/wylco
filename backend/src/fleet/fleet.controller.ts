import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('fleet')
@UseGuards(JwtAuthGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get('vehicles')
  async getVehicles() {
    return this.fleetService.findAllVehicles();
  }

  @Post('vehicles')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async createVehicle(@Body() data: any) {
    return this.fleetService.createVehicle(data);
  }

  @Patch('vehicles/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async updateVehicle(@Param('id') id: string, @Body() data: any) {
    return this.fleetService.updateVehicle(+id, data);
  }

  @Delete('vehicles/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async deleteVehicle(@Param('id') id: string) {
    return this.fleetService.deleteVehicle(+id);
  }

  @Post('assign')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @UseGuards(RolesGuard)
  async assign(@Body() data: { shipmentId: number, vehicleId: number }) {
    return this.fleetService.assignShipmentToVehicle(data.shipmentId, data.vehicleId);
  }
}
