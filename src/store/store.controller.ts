import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationDto } from '../common/interfaces/pagination.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { Store } from './entities/store.entity';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createStoreDto: CreateStoreDto): Promise<Store> {
    console.log('BODY RECEIVED', createStoreDto);
    console.log(createStoreDto.description)
    return this.storeService.create(createStoreDto);
  }

  @Get()
  @Public()
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<Store>> {
    return this.storeService.findAll(paginationDto);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string): Promise<Store> {
    return this.storeService.findOne(+id);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto): Promise<Store> {
    return this.storeService.update(+id, updateStoreDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string): Promise<void> {
    return this.storeService.remove(+id);
  }
}