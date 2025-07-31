// create-store.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsArray, IsBoolean, IsNumber } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  storeNumber: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsOptional()
  videos?: string[];

  @IsOptional()
  schedule?: any;

  @IsBoolean()
  @IsOptional()
  isService?: boolean;

  @IsNumber()
  @IsOptional()
  ownerId?: number;
}