import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity.js';
import { TICKET_REPOSITORY } from './ticket.repository.js';
import { TicketTriagedConsumer } from './ticket-triaged.consumer.js';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';
import { TypeOrmTicketRepository } from './typeorm-ticket.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    TicketTriagedConsumer,
    { provide: TICKET_REPOSITORY, useClass: TypeOrmTicketRepository },
  ],
})
export class TicketsModule {}
