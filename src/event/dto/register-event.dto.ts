// src/event/dto/register-event.dto.ts
import { IsNotEmpty, IsNumber } from 'class-validator';

export class RegisterEventDto {
  @IsNumber()
  @IsNotEmpty()
  eventId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}