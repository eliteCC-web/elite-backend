import { Controller, Post, Body, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterInternalDto } from './dto/register-internal.dto';
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
  @Post('register-internal')
  @HttpCode(HttpStatus.CREATED)
  async registerInternal(@Body() registerInternalDto: RegisterInternalDto) {
    return this.authService.registerInternal(registerInternalDto);
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

  @Public()
  @Post('test-email')
  @HttpCode(HttpStatus.OK)
  async testEmail(@Body() body: { email: string; name: string }) {
    return this.authService.testEmailConfiguration(body.email, body.name);
  }

  @Post('pending-registrations')
  @HttpCode(HttpStatus.OK)
  async getPendingRegistrations() {
    return this.authService.getPendingRegistrations();
  }

  @Post('registration-history')
  @HttpCode(HttpStatus.OK)
  async getRegistrationHistory() {
    return this.authService.getRegistrationHistory();
  }

  @Post('approve-registration/:id')
  @HttpCode(HttpStatus.OK)
  async approveRegistration(@Param('id') id: string) {
    return this.authService.approveRegistration(+id);
  }

  @Post('reject-registration/:id')
  @HttpCode(HttpStatus.OK)
  async rejectRegistration(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.authService.rejectRegistration(+id, body.reason);
  }
}