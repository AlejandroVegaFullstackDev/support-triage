export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Category = 'billing' | 'technical' | 'account' | 'shipping' | 'other';

export interface Ticket {
  id: string;
  subject: string;
  body: string;
  customerEmail: string;
  status: 'pending_triage' | 'triaged';
  category: Category | null;
  priority: Priority | null;
  suggestedReply: string | null;
  triageProvider: string | null;
  triagedAt: string | null;
  createdAt: string;
}

export interface NewTicket {
  subject: string;
  body: string;
  customerEmail: string;
}
