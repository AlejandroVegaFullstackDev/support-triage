import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Ticket } from './ticket.entity.js';
import type { NewTicket, TicketRepository, TriageResult } from './ticket.repository.js';

@Injectable()
export class TypeOrmTicketRepository implements TicketRepository {
  constructor(@InjectRepository(Ticket) private readonly tickets: Repository<Ticket>) {}

  create(data: NewTicket): Promise<Ticket> {
    return this.tickets.save(this.tickets.create({ ...data, status: 'pending_triage' }));
  }

  findById(id: string): Promise<Ticket | null> {
    return this.tickets.findOneBy({ id });
  }

  findRecent(limit: number): Promise<Ticket[]> {
    return this.tickets.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async applyTriage(id: string, result: TriageResult): Promise<boolean> {
    const update = await this.tickets.update(
      { id },
      {
        status: 'triaged',
        category: result.category,
        priority: result.priority,
        suggestedReply: result.suggestedReply,
        triageProvider: result.provider,
        triagedAt: result.triagedAt,
      },
    );
    return (update.affected ?? 0) > 0;
  }
}
