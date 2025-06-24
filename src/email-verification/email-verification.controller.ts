import { Controller, Get, Post, Body, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { EmailVerificationService } from './services/email-verification.service';
import { Public } from '../auth/decorators/public.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Extender el tipo Request para incluir la propiedad user
interface RequestWithUser extends ExpressRequest {
  user?: any;
}

@Controller('email-verification')
@UseGuards(RolesGuard)
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Public()
  @Post('send')
  async sendVerificationEmail(
    @Body('userId') userId: number,
    @Body('email') email: string
  ): Promise<{ message: string }> {
    await this.emailVerificationService.sendVerificationEmail(userId, email);
    return { message: 'Verification email sent successfully' };
  }

  @Public()
  @Post('verify')
  async verifyEmail(@Body('token') token: string): Promise<{ success: boolean; message: string }> {
    return this.emailVerificationService.verifyEmail(token);
  }

  @Public()
  @Post('resend')
  async resendVerificationEmail(@Body('email') email: string): Promise<{ message: string }> {
    await this.emailVerificationService.resendVerificationEmail(email);
    return { message: 'Verification email resent successfully' };
  }

  @Roles('ADMIN')
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getUserVerificationStatus(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser
  ): Promise<{ verified: boolean; email?: string }> {
    console.log("Usuario autenticado:", req.user);
    // Aquí podrías implementar una función en el service para obtener el estado
    // Por ahora retornamos un placeholder
    return { verified: false };
  }

  @Public()
  @Get('status/:email')
  async getEmailVerificationStatus(
    @Param('email') email: string
  ): Promise<{ verified: boolean; email: string; message: string }> {
    const user = await this.emailVerificationService.getUserByEmail(email);
    
    if (!user) {
      return { verified: false, email, message: 'User not found' };
    }
    
    return { 
      verified: user.emailVerified, 
      email, 
      message: user.emailVerified ? 'Email is verified' : 'Email is not verified' 
    };
  }
} 