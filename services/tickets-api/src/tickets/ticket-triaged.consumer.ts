import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EVENT_BUS, InvalidMessageError } from '../messaging/event-bus.js';
import type { EventBus } from '../messaging/event-bus.js';
import { TICKET_TRIAGED, TICKET_TRIAGED_QUEUE } from '../messaging/events.js';
import { TicketTriagedEvent } from './dto/ticket-triaged.event.js';
import { TicketsService } from './tickets.service.js';

@Injectable()
export class TicketTriagedConsumer implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_BUS) private readonly events: EventBus,
    private readonly tickets: TicketsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.events.subscribe(TICKET_TRIAGED_QUEUE, TICKET_TRIAGED, (payload) => this.handle(payload));
  }

  async handle(payload: unknown): Promise<void> {
    const event = plainToInstance(TicketTriagedEvent, payload);
    const errors = await validate(event, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length > 0) {
      throw new InvalidMessageError(`Invalid ${TICKET_TRIAGED} payload`);
    }
    await this.tickets.applyTriage(event);
  }
}
