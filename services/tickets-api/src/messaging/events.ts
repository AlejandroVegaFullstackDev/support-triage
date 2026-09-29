export const EXCHANGE = 'tickets';
export const DEAD_LETTER_EXCHANGE = 'tickets.dlx';
export const TICKET_CREATED = 'ticket.created';
export const TICKET_TRIAGED = 'ticket.triaged';
export const TICKET_TRIAGED_QUEUE = 'tickets-api.ticket-triaged';

export interface TicketCreatedEvent {
  eventId: string;
  ticketId: string;
  subject: string;
  body: string;
  occurredAt: string;
}
