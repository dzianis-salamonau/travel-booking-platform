import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CheckAvailabilityDto {
  @IsUUID()
  packageId!: string;
}

export class CreateBookingDto {
  @IsUUID()
  packageId!: string;

  @IsString()
  @MinLength(1)
  guestFirstName!: string;

  @IsString()
  @MinLength(1)
  guestLastName!: string;

  @IsEmail()
  guestEmail!: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsBoolean()
  payFullAmount?: boolean;
}
