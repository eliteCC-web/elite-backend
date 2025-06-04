import { Controller, Post, Body, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('bulk-create')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreateUsers(@Body() bulkCreateDto: BulkCreateUsersDto) {
    return this.authService.bulkCreateUsers(bulkCreateDto.users);
  }

  @Public()
  @Post('change-password/:id')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id') id: string,
    @Body('password') password: string
  ) {
    return this.authService.changePassword(+id, password);
  }
}