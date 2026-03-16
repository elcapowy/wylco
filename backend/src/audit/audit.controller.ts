import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.auditService.findAll();
  }

  @Post()
  async createLog(@Request() req, @Body() body: any) {
    return this.auditService.log(
      req.user.email,
      body.action,
      body.details,
      body.entityId,
    );
  }
}
