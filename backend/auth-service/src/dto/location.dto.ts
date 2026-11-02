import { IsBoolean, IsNumber, Max, Min } from 'class-validator';

/**
 * Location privacy: the client must send `consent: true` for us to store the
 * position. Sending `consent: false` acts as an opt-out AND wipes the stored
 * coordinates in the same request.
 */
export class UpdateLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsBoolean()
  consent: boolean;
}
