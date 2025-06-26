// create-store.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsUrl, IsNumber, IsObject, IsArray } from 'class-validator';

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

  @IsObject()
  @IsOptional()
  schedule?: any;

  @IsNumber()
  @IsOptional()
  ownerId?: number;
}