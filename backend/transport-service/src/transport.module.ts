import { Injectable, Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { TransportGateway } from './transport.gateway';
import { LiveStore } from './live-store';
import { Bus, Route, University } from './entities/transport.entities';

/** Seeds Tunisian universities + routes the first time the service starts. */
@Injectable()
export class TransportSeeder implements OnApplicationBootstrap {
  private readonly log = new Logger(TransportSeeder.name);

  constructor(private readonly transport: TransportService) {}

  async onApplicationBootstrap() {
    try {
      await this.transport.seedDemoData();
    } catch (err) {
      this.log.warn(`Seed skipped: ${(err as Error).message}`);
    }
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([University, Route, Bus]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
    }),
  ],
  controllers: [TransportController],
  providers: [TransportService, TransportGateway, LiveStore, TransportSeeder],
})
export class TransportModule {}
