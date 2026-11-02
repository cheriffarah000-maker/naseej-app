import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';

/**
 * Creates a small set of demo accounts the first time the service boots, so a
 * reviewer can open the app and try every role without a setup script.
 *
 * These accounts are obviously demo-only; in production you would create the
 * first admin with a one-off CLI command and a forced password change.
 */
@Injectable()
export class AuthSeeder implements OnApplicationBootstrap {
  private readonly log = new Logger(AuthSeeder.name);

  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async onApplicationBootstrap() {
    try {
      await this.seed();
    } catch (err) {
      this.log.warn(`Seeder skipped: ${(err as Error).message}`);
    }
  }

  private async seed() {
    if ((await this.users.count()) > 0) return;

    const demo = [
      {
        fullName: 'Administrateur Naseej',
        email: 'admin@naseej.tn',
        phone: '+21670000000',
        password: 'Admin@2026',
        role: UserRole.ADMIN,
      },
      {
        fullName: 'Sami Ben Ali',
        email: 'citizen@naseej.tn',
        phone: '+21670000001',
        password: 'Citizen@2026',
        role: UserRole.CITIZEN,
      },
      {
        fullName: 'Amine Trabelsi',
        email: 'driver@naseej.tn',
        phone: '+21670000002',
        password: 'Driver@2026',
        role: UserRole.DRIVER,
      },
      {
        fullName: 'Nour First Aid',
        email: 'volunteer@naseej.tn',
        phone: '+21670000003',
        password: 'Volunteer@2026',
        role: UserRole.VOLUNTEER,
      },
    ];

    for (const account of demo) {
      await this.users.save(
        this.users.create({
          fullName: account.fullName,
          email: account.email,
          phone: account.phone,
          passwordHash: await bcrypt.hash(account.password, 10),
          role: account.role,
        }),
      );
    }

    this.log.log(`seeded ${demo.length} demo accounts (admin@naseej.tn / Admin@2026)`);
  }
}
