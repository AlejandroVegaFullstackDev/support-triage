import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EVENT_BUS } from '../messaging/event-bus.js';
import type { EventBus } from '../messaging/event-bus.js';
import { TICKET_CREATED } from '../messaging/events.js';
import type { TicketCreatedEvent } from '../messaging/events.js';
import type { CreateTicketDto } from './dto/create-ticket.dto.js';
import type { TicketTriagedEvent } from './dto/ticket-triaged.event.js';
import type { Ticket } from './ticket.entity.js';
import { TICKET_REPOSITORY } from './ticket.repository.js';
import type { TicketRepository } from './ticket.repository.js';

export const RECENT_TICKETS_LIMIT = 50;

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository,
    @Inject(EVENT_BUS) private readonly events: EventBus,
  ) {}

  async create(dto: CreateTicketDto): Promise<Ticket> {
    const ticket = await this.tickets.create(dto);
    const event: TicketCreatedEvent = {
      eventId: randomUUID(),
      ticketId: ticket.id,
      subject: ticket.subject,
      body: ticket.body,
      occurredAt: new Date().toISOString(),
    };
    try {
      await this.events.publish(TICKET_CREATED, event);
    } catch {
      // Ticket is persisted; it stays pending_triage. See docs/adr/0003-publish-after-commit.md.
      this.logger.error(`Could not publish ${TICKET_CREATED} for ticket ${ticket.id}`);
    }
    return ticket;
  }

  listRecent(): Promise<Ticket[]> {
    return this.tickets.findRecent(RECENT_TICKETS_LIMIT);
  }

  async getById(id: string): Promise<Ticket> {
    const ticket = await this.tickets.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async applyTriage(event: TicketTriagedEvent): Promise<void> {
    const applied = await this.tickets.applyTriage(event.ticketId, {
      category: event.category,
      priority: event.priority,
      suggestedReply: event.suggestedReply,
      provider: event.provider,
      triagedAt: new Date(event.occurredAt),
    });
    if (!applied) {
      this.logger.warn(`Triage received for unknown ticket ${event.ticketId}`);
    }
  }
}
