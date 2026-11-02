import { Injectable, Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './emergency.service';
import { Provider } from './entities/provider.entity';
import { HelpRequest } from './entities/help-request.entity';

/** Fills the database with demo providers the first time the service boots. */
@Injectable()
export class EmergencySeeder implements OnApplicationBootstrap {
  private readonly log = new Logger(EmergencySeeder.name);

  constructor(private readonly emergency: EmergencyService) {}

  async onApplicationBootstrap() {
    try {
      await this.emergency.seedDemoData();
    } catch (err) {
      // Seeding must never stop the service from starting.
      this.log.warn(`Seed skipped: ${(err as Error).message}`);
    }
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, HelpRequest]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
    }),
  ],
  controllers: [EmergencyController],
  providers: [EmergencyService, EmergencySeeder],
})
export class EmergencyModule {}
