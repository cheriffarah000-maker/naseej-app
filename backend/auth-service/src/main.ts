import 'reflect-metadata';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { collectDefaultMetrics } from 'prom-client';

/**
 * auth-service entry point.
 * Stateless: everything the service needs is in the request (JWT) or the environment.
 */
async function bootstrap() {
  collectDefaultMetrics({ prefix: 'auth_' });

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Kubernetes sends SIGTERM: let Nest close DB pools cleanly before exit.
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`auth-service listening on :${port}`, 'Bootstrap');
}

bootstrap();
