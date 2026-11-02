import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { collectDefaultMetrics } from 'prom-client';
import { AppModule } from './app.module';

async function bootstrap() {
  collectDefaultMetrics({ prefix: 'emergency_' });

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`emergency-service listening on :${port}`, 'Bootstrap');
}

bootstrap();
