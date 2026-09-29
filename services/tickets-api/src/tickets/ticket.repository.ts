import type { Ticket } from './ticket.entity.js';
import type { TicketCategory, TicketPriority } from './ticket.types.js';

export interface NewTicket {
  subject: string;
  body: string;
  customerEmail: string;
}

export interface TriageResult {
  category: TicketCategory;
  priority: TicketPriority;
  suggestedReply: string;
  provider: string;
  triagedAt: Date;
}

export interface TicketRepository {
  create(data: NewTicket): Promise<Ticket>;
  findById(id: string): Promise<Ticket | null>;
  findRecent(limit: number): Promise<Ticket[]>;
  applyTriage(id: string, result: TriageResult): Promise<boolean>;
}

export const TICKET_REPOSITORY = Symbol('TICKET_REPOSITORY');
