import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { normalizeTunisianPhone } from './register.dto';

export class LoginDto {
  /**
   * Email or Tunisian phone. If it looks like a phone we normalise it,
   * so a user can type "12345678" and still log in.
   */
  @Transform(({ value }) =>
    String(value ?? '').includes('@') ? value : normalizeTunisianPhone(value),
  )
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @MinLength(8)
  password: string;
}
