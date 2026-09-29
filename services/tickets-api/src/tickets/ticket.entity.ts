import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { TicketCategory, TicketPriority, TicketStatus } from './ticket.types.js';

@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  subject!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'customer_email', type: 'varchar', length: 254 })
  customerEmail!: string;

  @Column({ type: 'varchar', length: 20, default: 'pending_triage' })
  status!: TicketStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  category!: TicketCategory | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  priority!: TicketPriority | null;

  @Column({ name: 'suggested_reply', type: 'text', nullable: true })
  suggestedReply!: string | null;

  @Column({ name: 'triage_provider', type: 'varchar', length: 20, nullable: true })
  triageProvider!: string | null;

  @Column({ name: 'triaged_at', type: 'timestamptz', nullable: true })
  triagedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
