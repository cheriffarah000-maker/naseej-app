import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

/** Roles a visitor is allowed to pick at sign-up (admins are created by an admin). */
export const SELF_SIGNUP_ROLES = [
  UserRole.CITIZEN,
  UserRole.STUDENT,
  UserRole.PROVIDER,
  UserRole.DRIVER,
  UserRole.VOLUNTEER,
];

/** "12 345 678" / "12345678" / "+21612345678" -> "+21612345678" */
export function normalizeTunisianPhone(value: string): string {
  const digits = String(value ?? '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+216')) return digits;
  if (digits.startsWith('216')) return `+${digits}`;
  return `+216${digits}`;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @IsEmail({}, { message: 'auth.errors.email' })
  email: string;

  @Transform(({ value }) => normalizeTunisianPhone(value))
  @Matches(/^\+216[0-9]{8}$/, { message: 'auth.errors.phone' })
  phone: string;

  @IsString()
  @MinLength(8, { message: 'auth.errors.password' })
  @MaxLength(72)
  password: string;

  @IsIn(SELF_SIGNUP_ROLES, { message: 'auth.errors.role' })
  role: UserRole = UserRole.CITIZEN;
}
