import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../src/app.setup.js';
import { EVENT_BUS, InvalidMessageError } from '../src/messaging/event-bus.js';
import { TICKET_CREATED } from '../src/messaging/events.js';
import { TICKET_REPOSITORY } from '../src/tickets/ticket.repository.js';
import { TicketTriagedConsumer } from '../src/tickets/ticket-triaged.consumer.js';
import { TicketsController } from '../src/tickets/tickets.controller.js';
import { TicketsService } from '../src/tickets/tickets.service.js';
import { FakeEventBus, InMemoryTicketRepository } from './fakes.js';

const validTicket = {
  subject: 'Me cobraron dos veces',
  body: 'El pago de este mes aparece duplicado en mi tarjeta.',
  customerEmail: 'cliente@example.com',
};

describe('tickets', () => {
  let app: INestApplication;
  let repository: InMemoryTicketRepository;
  let bus: FakeEventBus;
  let consumer: TicketTriagedConsumer;

  before(async () => {
    repository = new InMemoryTicketRepository();
    bus = new FakeEventBus();
    const moduleRef = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        TicketsService,
        TicketTriagedConsumer,
        { provide: TICKET_REPOSITORY, useValue: repository },
        { provide: EVENT_BUS, useValue: bus },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app, 'http://localhost:5173');
    await app.init();
    consumer = moduleRef.get(TicketTriagedConsumer);
  });

  beforeEach(() => {
    repository.items.clear();
    bus.published.length = 0;
    bus.failPublish = false;
  });

  after(() => app.close());

  describe('POST /tickets', () => {
    it('creates the ticket and publishes ticket.created without customer email', async () => {
      const response = await request(app.getHttpServer()).post('/tickets').send(validTicket);

      assert.equal(response.status, 201);
      assert.equal(response.body.status, 'pending_triage');
      assert.equal(bus.published.length, 1);
      const [{ routingKey, payload }] = bus.published;
      assert.equal(routingKey, TICKET_CREATED);
      assert.equal((payload as { ticketId: string }).ticketId, response.body.id);
      assert.equal('customerEmail' in payload, false);
    });

    it('rejects invalid input', async () => {
      const response = await request(app.getHttpServer())
        .post('/tickets')
        .send({ ...validTicket, customerEmail: 'not-an-email', body: 'short' });

      assert.equal(response.status, 400);
      assert.equal(repository.items.size, 0);
    });

    it('rejects unknown fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/tickets')
        .send({ ...validTicket, status: 'triaged' });

      assert.equal(response.status, 400);
    });

    it('keeps the ticket when the broker is down', async () => {
      bus.failPublish = true;

      const response = await request(app.getHttpServer()).post('/tickets').send(validTicket);

      assert.equal(response.status, 201);
      assert.equal(repository.items.size, 1);
    });
  });

  describe('GET /tickets/:id', () => {
    it('returns 400 for a malformed id and 404 for an unknown one', async () => {
      await request(app.getHttpServer()).get('/tickets/abc').expect(400);
      await request(app.getHttpServer()).get(`/tickets/${randomUUID()}`).expect(404);
    });
  });

  describe('ticket.triaged consumer', () => {
    it('applies a valid triage result', async () => {
      const ticket = await repository.create(validTicket);

      await consumer.handle({
        eventId: randomUUID(),
        ticketId: ticket.id,
        category: 'billing',
        priority: 'high',
        suggestedReply: 'Revisaremos el cobro duplicado.',
        provider: 'local',
        occurredAt: new Date().toISOString(),
      });

      const response = await request(app.getHttpServer()).get(`/tickets/${ticket.id}`);
      assert.equal(response.body.status, 'triaged');
      assert.equal(response.body.category, 'billing');
      assert.equal(response.body.priority, 'high');
    });

    it('rejects a payload with an unknown category', async () => {
      const ticket = await repository.create(validTicket);

      await assert.rejects(
        consumer.handle({
          eventId: randomUUID(),
          ticketId: ticket.id,
          category: 'refunds',
          priority: 'high',
          suggestedReply: 'x',
          provider: 'local',
          occurredAt: new Date().toISOString(),
        }),
        InvalidMessageError,
      );
      assert.equal(ticket.status, 'pending_triage');
    });
  });
});
