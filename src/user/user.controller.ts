import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Request } from 'express';

// Extender el tipo Request para incluir la propiedad user
interface RequestWithUser extends Request {
  user?: any;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: RequestWithUser) {
    const userId = req.user?.id;
    return this.userService.findOne(userId);
  }

  @Post()
  @Roles('ADMIN', 'COLABORADOR', 'CLIENTE_INTERNO', 'CLIENTE_EXTERNO')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN', 'COLABORADOR', 'CLIENTE_INTERNO', 'CLIENTE_EXTERNO')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'COLABORADOR', 'CLIENTE_INTERNO', 'CLIENTE_EXTERNO')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Put(':id')
  @Roles('ADMIN', 'COLABORADOR', 'CLIENTE_INTERNO', 'CLIENTE_EXTERNO')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'COLABORADOR', 'CLIENTE_INTERNO', 'CLIENTE_EXTERNO')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}