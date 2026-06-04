import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BoardType } from '@travel/shared-types';

export class PackageSearchQueryDto {
  @IsOptional()
  @IsString()
  destinationSlug?: string;

  @IsOptional()
  @IsString()
  departureAirport?: string;

  @IsOptional()
  @IsString()
  departureDateFrom?: string;

  @IsOptional()
  @IsString()
  departureDateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  durationMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  durationMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  hotelRatingMin?: number;

  @IsOptional()
  @IsEnum(BoardType)
  boardType?: BoardType;

  @IsOptional()
  @IsString()
  providerSlug?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  availableOnly?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: 'price' | 'date' | 'rating';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
