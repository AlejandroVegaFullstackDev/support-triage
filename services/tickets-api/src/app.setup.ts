import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';

export function configureApp(app: INestApplication, corsOrigin: string): void {
  app.enableCors({ origin: corsOrigin.split(','), methods: ['GET', 'POST'] });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableShutdownHooks();
}
