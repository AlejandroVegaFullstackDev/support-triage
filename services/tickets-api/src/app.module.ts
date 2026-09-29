import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_CONFIG } from './config/app-config.js';
import type { AppConfig } from './config/app-config.js';
import { ConfigModule } from './config/config.module.js';
import { CreateTickets1727600000000 } from './database/migrations/1727600000000-create-tickets.js';
import { HealthController } from './health/health.controller.js';
import { MessagingModule } from './messaging/messaging.module.js';
import { Ticket } from './tickets/ticket.entity.js';
import { TicketsModule } from './tickets/tickets.module.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: ({ database }: AppConfig) => ({
        type: 'postgres',
        host: database.host,
        port: database.port,
        database: database.name,
        username: database.user,
        password: database.password,
        entities: [Ticket],
        migrations: [CreateTickets1727600000000],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
    MessagingModule,
    TicketsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
