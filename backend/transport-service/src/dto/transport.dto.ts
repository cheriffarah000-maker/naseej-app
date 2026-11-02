import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsHexColor,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { BusStatus } from '../entities/transport.entities';

export class StationDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(-90) @Max(90) lat: number;
  @IsNumber() @Min(-180) @Max(180) lng: number;
}

export class CreateUniversityDto {
  @IsString() @IsNotEmpty() @MaxLength(160) name: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsNumber() @Min(-90) @Max(90) lat: number;
  @IsNumber() @Min(-180) @Max(180) lng: number;
}

export class CreateRouteDto {
  @IsString() @IsNotEmpty() @MaxLength(160) name: string;
  @IsString() @IsNotEmpty() universityId: string;
  @IsOptional() @IsHexColor() color?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StationDto)
  stations: StationDto[];
}

export class CreateBusDto {
  @IsString() @IsNotEmpty() @MaxLength(40) plate: string;
  @IsString() @IsNotEmpty() routeId: string;
  @IsOptional() @IsInt() @Min(1) @Max(120) capacity?: number;
  @IsOptional() @IsString() driverId?: string;
}

export class UpdateBusStatusDto {
  @IsEnum(BusStatus)
  status: BusStatus;
}

export class UpdatePositionDto {
  @IsNumber() @Min(-90) @Max(90) lat: number;
  @IsNumber() @Min(-180) @Max(180) lng: number;
}
