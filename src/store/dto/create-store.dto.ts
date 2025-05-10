
// create-store.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';

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

  @IsString()
  @IsOptional()
  imageUrl?: string;
}