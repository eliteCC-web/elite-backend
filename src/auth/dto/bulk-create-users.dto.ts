import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RegisterDto } from './register.dto';

export class BulkCreateUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegisterDto)
  users: RegisterDto[];
}