
// create-store.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}