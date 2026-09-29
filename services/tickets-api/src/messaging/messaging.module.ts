import { Global, Module } from '@nestjs/common';
import { EVENT_BUS } from './event-bus.js';
import { RabbitMqEventBus } from './rabbitmq-event-bus.js';

@Global()
@Module({
  providers: [
    RabbitMqEventBus,
    {
      provide: EVENT_BUS,
      useFactory: async (bus: RabbitMqEventBus) => {
        await bus.connect();
        return bus;
      },
      inject: [RabbitMqEventBus],
    },
  ],
  exports: [EVENT_BUS],
})
export class MessagingModule {}
