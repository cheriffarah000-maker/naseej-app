import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateLocationDto } from './dto/location.dto';

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  locationConsent: boolean;
  lastLat: number | null;
  lastLng: number | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  /** Never return passwordHash to the client. */
  private toPublic(u: User): PublicUser {
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      locationConsent: u.locationConsent,
      lastLat: u.lastLat,
      lastLng: u.lastLng,
    };
  }

  private async issueTokens(user: User) {
    const base = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(
      { ...base, type: 'access' },
      { expiresIn: process.env.JWT_ACCESS_TTL || '1h' },
    );
    const refreshToken = await this.jwt.signAsync(
      { ...base, type: 'refresh' },
      { expiresIn: process.env.JWT_REFRESH_TTL || '7d' },
    );
    return { accessToken, refreshToken, user: this.toPublic(user) };
  }

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({
      where: [{ email: dto.email.toLowerCase() }, { phone: dto.phone }],
    });
    if (existing) {
      throw new ConflictException('auth.errors.alreadyRegistered');
    }

    const user = this.users.create({
      fullName: dto.fullName.trim(),
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: dto.role,
    });
    await this.users.save(user);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const user = await this.users.findOne({
      where: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });
    // Same error for "no such user" and "wrong password" — avoids leaking
    // which phone numbers are registered.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('auth.errors.invalidCredentials');
    }
    return this.issueTokens(user);
  }

  /** Exchange a valid refresh token for a new access token. */
  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('auth.errors.invalidRefresh');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('auth.errors.invalidRefresh');
    }
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('auth.errors.invalidRefresh');
    return this.issueTokens(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.toPublic(user);
  }

  /**
   * Consent-aware location update.
   * - consent=true  -> store the coordinates
   * - consent=false -> opt out and delete whatever was stored (data minimisation)
   */
  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const patch: Partial<User> = { locationConsent: dto.consent };

    if (dto.consent) {
      patch.lastLat = dto.lat;
      patch.lastLng = dto.lng;
      patch.lastPositionAt = new Date();
    } else {
      patch.lastLat = null;
      patch.lastLng = null;
      patch.lastPositionAt = null;
    }

    await this.users.update({ id: userId }, patch);
    return this.me(userId);
  }

  async listUsers(): Promise<PublicUser[]> {
    const all = await this.users.find({ order: { createdAt: 'DESC' }, take: 200 });
    return all.map((u) => this.toPublic(u));
  }
}
