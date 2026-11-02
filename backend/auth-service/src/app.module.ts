import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      // Dev convenience only. In production use migrations (DB_SYNC=false).
      synchronize: process.env.DB_SYNC !== 'false',
      // Wait for Postgres to be ready instead of crashing on first boot.
      retryAttempts: 15,
      retryDelay: 3000,
    }),
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
