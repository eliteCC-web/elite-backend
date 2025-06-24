// src/schedule/dto/create-schedule.dto.ts
import { IsNotEmpty, IsString, IsDateString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  startTime: string; // "08:00"

  @IsNotEmpty()
  @IsString()
  endTime: string; // "17:00"

  @IsOptional()
  @IsBoolean()
  isHoliday?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  shiftType?: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'FULL_DAY';

  @IsOptional()
  @IsString()
  position?: string; // Cargo o posición del colaborador
}

export class BulkCreateScheduleDto {
  @IsNotEmpty()
  @IsDateString()
  weekStartDate: string;

  @IsNotEmpty()
  schedules: CreateScheduleDto[];
}

export class AssignRandomShiftsDto {
  @IsNotEmpty()
  @IsDateString()
  weekStartDate: string;

  @IsNotEmpty()
  @IsNumber({}, { each: true })
  userIds: number[];

  @IsOptional()
  @IsString()
  shiftPattern?: 'ROTATING' | 'FIXED' | 'CUSTOM';
}