// src/schedule/dto/create-schedule.dto.ts
import { IsNotEmpty, IsDateString, IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateScheduleDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsBoolean()
  @IsOptional()
  isHoliday?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}