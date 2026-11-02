import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProviderType } from '../entities/provider.entity';
import { RequestStatus } from '../entities/help-request.entity';

const normalizeTunisianPhone = (value: string) => {
  const digits = String(value ?? '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+216')) return digits;
  if (digits.startsWith('216')) return `+${digits}`;
  return `+216${digits}`;
};

export class CreateProviderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @Transform(({ value }) => normalizeTunisianPhone(value))
  @Matches(/^\+216[0-9]{8}$/, { message: 'auth.errors.phone' })
  phone: string;

  @IsEnum(ProviderType)
  type: ProviderType;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  serviceArea?: string;

  @IsNumber() @Min(-90) @Max(90) lat: number;
  @IsNumber() @Min(-180) @Max(180) lng: number;
}

export class ProviderLocationDto {
  @IsNumber() @Min(-90) @Max(90) lat: number;
  @IsNumber() @Min(-180) @Max(180) lng: number;
}

export class AvailabilityDto {
  @IsBoolean() isAvailable: boolean;
}

export class CreateHelpRequestDto {
  @IsNumber() @Min(-90) @Max(90) lat: number;
  @IsNumber() @Min(-180) @Max(180) lng: number;

  @IsOptional() @IsString() @MaxLength(280) note?: string;

  @IsString() @IsNotEmpty() contactName: string;

  @Transform(({ value }) => normalizeTunisianPhone(value))
  @Matches(/^\+216[0-9]{8}$/)
  contactPhone: string;
}

const ALLOWED_TRANSITIONS = [
  RequestStatus.ACCEPTED,
  RequestStatus.DECLINED,
  RequestStatus.COMPLETED,
  RequestStatus.CANCELLED,
];

export class UpdateRequestStatusDto {
  @IsIn(ALLOWED_TRANSITIONS)
  status: RequestStatus;
}
