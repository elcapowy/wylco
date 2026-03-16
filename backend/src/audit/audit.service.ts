import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { EventsGateway } from '../common/events.gateway';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private eventsGateway: EventsGateway,
  ) {}

  async log(userEmail: string, action: string, details: string, entityId?: string) {
    const entry = this.auditRepository.create({
      userEmail,
      action,
      details,
      entityId,
    });
    const saved = await this.auditRepository.save(entry);
    
    // Broadcast real-time event
    this.eventsGateway.broadcast('system_event', {
      id: saved.id,
      action: saved.action,
      details: saved.details,
      userEmail: saved.userEmail,
      timestamp: saved.timestamp
    });

    return saved;
  }

  async findAll() {
    return this.auditRepository.find({ order: { timestamp: 'DESC' } });
  }
}
