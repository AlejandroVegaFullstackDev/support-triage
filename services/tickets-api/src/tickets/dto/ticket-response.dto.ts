import type { Ticket } from '../ticket.entity.js';

export interface TicketResponse {
  id: string;
  subject: string;
  body: string;
  customerEmail: string;
  status: Ticket['status'];
  category: Ticket['category'];
  priority: Ticket['priority'];
  suggestedReply: string | null;
  triageProvider: string | null;
  triagedAt: string | null;
  createdAt: string;
}

export function toTicketResponse(ticket: Ticket): TicketResponse {
  return {
    id: ticket.id,
    subject: ticket.subject,
    body: ticket.body,
    customerEmail: ticket.customerEmail,
    status: ticket.status,
    category: ticket.category,
    priority: ticket.priority,
    suggestedReply: ticket.suggestedReply,
    triageProvider: ticket.triageProvider,
    triagedAt: ticket.triagedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
  };
}
