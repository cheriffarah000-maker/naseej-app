import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthSeeder } from './auth.seeder';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
      signOptions: { expiresIn: process.env.JWT_ACCESS_TTL || '1h' },
    }),
  ],
  providers: [AuthService, AuthSeeder],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
