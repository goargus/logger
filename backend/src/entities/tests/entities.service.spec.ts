import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { EntitiesService } from '../entities.service';
import { Entity, EntityType } from '../entity.entity';
import { CreateEntityDto } from '../dto/create-entity.dto';
import { UpdateEntityDto } from '../dto/update-entity.dto';

type MockRepo<T extends ObjectLiteral = never> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function createRepoMock<T extends ObjectLiteral>(): MockRepo<T> {
  return {
    exists: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
}

describe('EntitiesService', () => {
  let service: EntitiesService;
  let repo: MockRepo<Entity>;

  const baseEntity: Entity = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Unión Hondureña',
    type: EntityType.UNION,
    code: 'UH',
    description: 'Cobertura nacional',
    location: 'Honduras',
    is_active: true,
    created_at: new Date('2025-08-12T17:34:14.503Z') as never,
    updated_at: new Date('2025-08-12T17:34:14.503Z') as never,
  };

  beforeEach(async () => {
    repo = createRepoMock<Entity>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitiesService,
        {
          provide: getRepositoryToken(Entity),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<EntitiesService>(EntitiesService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('creates an entity, trimming name and enforcing uniqueness by (name,type)', async () => {
      const dto: CreateEntityDto = {
        name: '  Unión Hondureña  ',
        type: EntityType.UNION,
        code: 'UH',
        description: 'Cobertura nacional',
        location: 'Honduras',
        is_active: true,
      } as never;

      repo.exists?.mockResolvedValue(false);
      repo.create?.mockReturnValue({ ...baseEntity, name: 'Unión Hondureña' });
      repo.save?.mockResolvedValue({ ...baseEntity, name: 'Unión Hondureña' });

      const result = await service.create(dto);
      expect(repo.exists).toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalledWith({ ...dto, name: 'Unión Hondureña' });
      expect(result).toEqual({ ...baseEntity, name: 'Unión Hondureña' });
    });

    it('throws ConflictException when (name,type) already exists', async () => {
      const dto: CreateEntityDto = { name: 'Unión Hondureña', type: EntityType.UNION } as never;
      repo.exists?.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws BadRequest when name becomes empty after trim', async () => {
      const dto: CreateEntityDto = { name: '   ', type: EntityType.UNION } as never;
      await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns all entities', async () => {
      repo.find?.mockResolvedValue([baseEntity]);
      await expect(service.findAll()).resolves.toEqual([baseEntity]);
    });
  });

  describe('findOne', () => {
    it('returns one by id', async () => {
      repo.findOne?.mockResolvedValue(baseEntity);
      await expect(service.findOne(baseEntity.id)).resolves.toEqual(baseEntity);
    });

    it('throws NotFound when missing', async () => {
      repo.findOne?.mockResolvedValue(null);
      await expect(service.findOne(baseEntity.id)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates entity when no conflict and trims name if provided', async () => {
      const patch: UpdateEntityDto = { name: '  Unión HN  ' } as never;
      repo.findOne?.mockResolvedValue(baseEntity);
      repo.exists?.mockResolvedValue(false);
      const saved = { ...baseEntity, name: 'Unión HN' };
      repo.save?.mockResolvedValue(saved);

      await expect(service.update(baseEntity.id, patch)).resolves.toEqual(saved);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Unión HN' }));
    });

    it('throws ConflictException when changing to duplicate (name,type)', async () => {
      const patch: UpdateEntityDto = { name: 'Otra', type: EntityType.UNION } as never;
      repo.findOne?.mockResolvedValue(baseEntity);
      repo.exists?.mockResolvedValue(true);

      await expect(service.update(baseEntity.id, patch)).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws BadRequest when setting empty name', async () => {
      const patch: UpdateEntityDto = { name: '   ' } as never;
      repo.findOne?.mockResolvedValue(baseEntity);

      await expect(service.update(baseEntity.id, patch)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('removes by id', async () => {
      repo.delete?.mockResolvedValue({ affected: 1 });
      await expect(service.remove(baseEntity.id)).resolves.toEqual({ affected: 1 });
    });

    it('throws NotFound when nothing deleted', async () => {
      repo.delete?.mockResolvedValue({ affected: 0 });
      await expect(service.remove(baseEntity.id)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
