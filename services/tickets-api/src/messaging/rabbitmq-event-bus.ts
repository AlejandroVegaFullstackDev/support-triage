import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { connect } from 'amqplib';
import type { Channel, ChannelModel, ConsumeMessage, RecoveringChannelModel } from 'amqplib';
import { APP_CONFIG } from '../config/app-config.js';
import type { AppConfig } from '../config/app-config.js';
import type { EventBus, MessageHandler } from './event-bus.js';
import { InvalidMessageError } from './event-bus.js';
import { DEAD_LETTER_EXCHANGE, EXCHANGE } from './events.js';

interface Subscription {
  queue: string;
  routingKey: string;
  handler: MessageHandler;
}

@Injectable()
export class RabbitMqEventBus implements EventBus, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqEventBus.name);
  private readonly subscriptions: Subscription[] = [];
  private connection?: RecoveringChannelModel;
  private channel?: Channel;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async connect(): Promise<void> {
    this.connection = await connect(this.config.rabbitmqUrl, {
      recovery: { maxDelay: 10_000, setup: (model: ChannelModel) => this.setup(model) },
    });
  }

  async publish(routingKey: string, payload: object): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not ready');
    }
    this.channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
      contentType: 'application/json',
      persistent: true,
    });
  }

  async subscribe(queue: string, routingKey: string, handler: MessageHandler): Promise<void> {
    const subscription = { queue, routingKey, handler };
    this.subscriptions.push(subscription);
    if (this.channel) {
      await this.consume(this.channel, subscription);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.close();
  }

  private async setup(model: ChannelModel): Promise<void> {
    const channel = await model.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertExchange(DEAD_LETTER_EXCHANGE, 'topic', { durable: true });
    await channel.prefetch(10);
    for (const subscription of this.subscriptions) {
      await this.consume(channel, subscription);
    }
    this.channel = channel;
    this.logger.log('Connected to RabbitMQ');
  }

  private async consume(channel: Channel, { queue, routingKey, handler }: Subscription): Promise<void> {
    const deadLetterQueue = `${queue}.dead-letter`;
    await channel.assertQueue(deadLetterQueue, { durable: true });
    await channel.bindQueue(deadLetterQueue, DEAD_LETTER_EXCHANGE, routingKey);
    await channel.assertQueue(queue, {
      durable: true,
      arguments: { 'x-dead-letter-exchange': DEAD_LETTER_EXCHANGE },
    });
    await channel.bindQueue(queue, EXCHANGE, routingKey);
    await channel.consume(queue, (message) => {
      if (message) {
        void this.handle(channel, message, handler);
      }
    });
  }

  private async handle(channel: Channel, message: ConsumeMessage, handler: MessageHandler): Promise<void> {
    try {
      await handler(JSON.parse(message.content.toString('utf8')));
      channel.ack(message);
    } catch (error) {
      const permanent = error instanceof SyntaxError || error instanceof InvalidMessageError;
      this.logger.warn(`Message on ${message.fields.routingKey} failed (${permanent ? 'dead-lettered' : 'requeued'})`);
      channel.nack(message, false, !permanent && !message.fields.redelivered);
    }
  }
}
