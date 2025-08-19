import { Test, TestingModule } from '@nestjs/testing';
import { EntitiesController } from '../entities.controller';
import { EntitiesService } from '../entities.service';
import { EntityType, Entity } from '../entity.entity';
import { ConflictException } from '@nestjs/common';
import { CreateEntityDto } from '../dto/create-entity.dto';
import { UpdateEntityDto } from '../dto/update-entity.dto';

describe('EntitiesController', () => {
  let controller: EntitiesController;
  let service: jest.Mocked<EntitiesService>;

  const mockEntity: Entity = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Unión Hondureña',
    type: EntityType.UNION,
    code: 'UH',
    description: 'Cobertura nacional',
    location: 'Honduras',
    is_active: true,
    created_at: new Date('2025-08-12T17:34:14.503Z') as never,
    updated_at: new Date('2025-08-12T17:34:14.503Z') as never,
    users: [],
  };

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<EntitiesService>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntitiesController],
      providers: [
        {
          provide: EntitiesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EntitiesController>(EntitiesController);
    service = module.get(EntitiesService) as jest.Mocked<EntitiesService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAny', () => {
    it('forces type from route param and calls service.create', async () => {
      const dto: CreateEntityDto = {
        name: 'Unión Hondureña',
        type: EntityType.ASSOCIATION,
        code: 'UH',
        description: 'Cobertura nacional',
        location: 'Honduras',
        is_active: true,
      } as never;

      service.create.mockResolvedValue(mockEntity);

      const result = await controller.createAny('union', dto);
      expect(service.create).toHaveBeenCalledWith({
        ...dto,
        type: EntityType.UNION,
      });
      expect(result).toEqual(mockEntity);
    });

    it('maps unique violation (23505) to ConflictException', async () => {
      const dto: CreateEntityDto = { name: 'Unión Hondureña', type: EntityType.UNION } as never;
      const pgError = Object.assign(new Error('duplicate key'), { code: '23505' });
      service.create.mockRejectedValue(pgError);

      await expect(controller.createAny('union', dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns all entities', async () => {
      service.findAll.mockResolvedValue([mockEntity]);
      await expect(controller.findAll()).resolves.toEqual([mockEntity]);
    });
  });

  describe('findOne', () => {
    it('returns one entity by id', async () => {
      service.findOne.mockResolvedValue(mockEntity);
      await expect(controller.findOne('11111111-1111-1111-1111-111111111111')).resolves.toEqual(
        mockEntity,
      );
    });
  });

  describe('update', () => {
    it('updates an entity', async () => {
      const patch: UpdateEntityDto = { name: 'Unión HN' } as never;
      const updated = { ...mockEntity, name: 'Unión HN' };
      service.update.mockResolvedValue(updated);
      await expect(
        controller.update('11111111-1111-1111-1111-111111111111', patch),
      ).resolves.toEqual(updated);
    });
  });

  describe('remove', () => {
    it('removes an entity', async () => {
      service.remove.mockResolvedValue({ affected: 1 } as never);
      await expect(controller.remove('11111111-1111-1111-1111-111111111111')).resolves.toEqual({
        affected: 1,
      });
    });
  });
});
