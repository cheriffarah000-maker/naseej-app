import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportModule } from './transport.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNC !== 'false',
      retryAttempts: 15,
      retryDelay: 3000,
    }),
    TransportModule,
    HealthModule,
  ],
})
export class AppModule {}
