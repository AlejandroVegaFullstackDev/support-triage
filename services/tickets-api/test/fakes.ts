import { randomUUID } from 'node:crypto';
import type { EventBus, MessageHandler } from '../src/messaging/event-bus.js';
import type { Ticket } from '../src/tickets/ticket.entity.js';
import type { NewTicket, TicketRepository, TriageResult } from '../src/tickets/ticket.repository.js';

export class InMemoryTicketRepository implements TicketRepository {
  readonly items = new Map<string, Ticket>();

  async create(data: NewTicket): Promise<Ticket> {
    const now = new Date();
    const ticket: Ticket = {
      id: randomUUID(),
      ...data,
      status: 'pending_triage',
      category: null,
      priority: null,
      suggestedReply: null,
      triageProvider: null,
      triagedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(ticket.id, ticket);
    return ticket;
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.items.get(id) ?? null;
  }

  async findRecent(limit: number): Promise<Ticket[]> {
    return [...this.items.values()].slice(-limit).reverse();
  }

  async applyTriage(id: string, result: TriageResult): Promise<boolean> {
    const ticket = this.items.get(id);
    if (!ticket) return false;
    Object.assign(ticket, {
      status: 'triaged',
      category: result.category,
      priority: result.priority,
      suggestedReply: result.suggestedReply,
      triageProvider: result.provider,
      triagedAt: result.triagedAt,
    });
    return true;
  }
}

export class FakeEventBus implements EventBus {
  readonly published: { routingKey: string; payload: object }[] = [];
  failPublish = false;

  async publish(routingKey: string, payload: object): Promise<void> {
    if (this.failPublish) throw new Error('broker down');
    this.published.push({ routingKey, payload });
  }

  async subscribe(_queue: string, _routingKey: string, _handler: MessageHandler): Promise<void> {}
}
