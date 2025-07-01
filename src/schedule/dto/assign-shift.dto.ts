import { IsNotEmpty, IsString, IsDateString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class AssignShiftDto {
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsOptional()
  @IsString()
  shiftType?: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'FULL_DAY';

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  notes?: string;
} 