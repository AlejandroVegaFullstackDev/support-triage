import { IsIn, IsISO8601, IsString, IsUUID, Length } from 'class-validator';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../ticket.types.js';
import type { TicketCategory, TicketPriority } from '../ticket.types.js';

export class TicketTriagedEvent {
  @IsUUID()
  eventId!: string;

  @IsUUID()
  ticketId!: string;

  @IsIn(TICKET_CATEGORIES)
  category!: TicketCategory;

  @IsIn(TICKET_PRIORITIES)
  priority!: TicketPriority;

  @IsString()
  @Length(1, 2000)
  suggestedReply!: string;

  @IsString()
  @Length(1, 20)
  provider!: string;

  @IsISO8601()
  occurredAt!: string;
}
