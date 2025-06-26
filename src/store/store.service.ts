import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { PaginationDto } from '../common/interfaces/pagination.dto';

@Injectable()
export class StoreService {
  private readonly logger = new Logger('StoreService');

  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    try {
      // Verificar si ya existe una tienda con ese número
      const existingStore = await this.storeRepository.findOne({
        where: { storeNumber: createStoreDto.storeNumber }
      });

      if (existingStore) {
        throw new BadRequestException(`Store with number ${createStoreDto.storeNumber} already exists`);
      }

      const store = this.storeRepository.create(createStoreDto);
      return await this.storeRepository.save(store);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Store>> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      const [data, total] = await this.storeRepository.findAndCount({
        skip,
        take: limit,
      });

      // Calcular metadata para la paginación
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(id: number): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id }
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  async findByOwnerId(ownerId: number): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { ownerId }
    });

    if (!store) {
      throw new NotFoundException(`Store for owner ID ${ownerId} not found`);
    }

    return store;
  }

  async update(id: number, updateStoreDto: UpdateStoreDto): Promise<Store> {
    try {
      const store = await this.storeRepository.preload({
        id,
        ...updateStoreDto
      });

      if (!store) {
        throw new NotFoundException(`Store with ID ${id} not found`);
      }

      return await this.storeRepository.save(store);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async updateByOwnerId(ownerId: number, updateStoreDto: UpdateStoreDto): Promise<Store> {
    try {
      const store = await this.findByOwnerId(ownerId);
      
      const updatedStore = await this.storeRepository.preload({
        id: store.id,
        ...updateStoreDto
      });

      if (!updatedStore) {
        throw new NotFoundException(`Store with ID ${store.id} not found`);
      }

      return await this.storeRepository.save(updatedStore);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: number): Promise<void> {
    const store = await this.findOne(id);
    await this.storeRepository.remove(store);
  }

  private handleDBExceptions(error: any) {
    this.logger.error(error);
    
    if (error.code === '23505') {
      throw new BadRequestException('Duplicate entry in database');
    }
    
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    
    throw new InternalServerErrorException('Internal server error');
  }
}