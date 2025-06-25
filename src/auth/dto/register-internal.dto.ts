import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsArray, IsEnum, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum RoleType {
  COLABORADOR = 'COLABORADOR',
  CLIENTE_INTERNO = 'CLIENTE_INTERNO'
}

export class StoreScheduleDto {
  @IsString()
  @IsNotEmpty()
  day: string;

  @IsString()
  @IsNotEmpty()
  openTime: string;

  @IsString()
  @IsNotEmpty()
  closeTime: string;

  @IsBoolean()
  isOpen: boolean;
}

export class StoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreScheduleDto)
  schedule: StoreScheduleDto[];

  @IsArray()
  @IsString({ each: true })
  images: string[];
}

export class RegisterInternalDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEnum(RoleType)
  roleType: RoleType;

  @IsOptional()
  @ValidateNested()
  @Type(() => StoreDto)
  store?: StoreDto;
} 