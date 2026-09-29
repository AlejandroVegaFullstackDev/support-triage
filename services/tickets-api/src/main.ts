import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { APP_CONFIG } from './config/app-config.js';
import type { AppConfig } from './config/app-config.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);
  configureApp(app, config.corsOrigin);
  await app.listen(config.port, '0.0.0.0');
}

void bootstrap();
