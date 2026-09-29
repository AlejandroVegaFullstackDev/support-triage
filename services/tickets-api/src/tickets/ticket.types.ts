export const TICKET_STATUSES = ['pending_triage', 'triaged'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_CATEGORIES = ['billing', 'technical', 'account', 'shipping', 'other'] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
