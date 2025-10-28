import { Test, TestingModule } from '@nestjs/testing';
import { TermsController } from './terms.controller';
import { TermsService } from './terms.service';
import { Term } from './term.entity';
import { Entity as OrganizationalEntity, EntityType } from '../entities/entity.entity';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';

describe('TermsController', () => {
  let controller: TermsController;
  let service: jest.Mocked<TermsService>;

  const mockEntity: OrganizationalEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Union',
    type: EntityType.UNION,
    is_active: true,
    created_at: new Date('2023-01-01T00:00:00Z'),
    updated_at: new Date('2023-01-01T00:00:00Z'),
    parent_id: null,
    children: [],
    users: [],
  };

  const mockTerm: Term = {
    id: '456e7890-e89b-12d3-a456-426614174001',
    entity_id: mockEntity.id,
    entity: mockEntity,
    name: '2020-2025 Administration',
    start_date: new Date('2020-01-01'),
    end_date: new Date('2025-01-01'),
    is_active: false,
    created_at: new Date('2023-01-01T00:00:00Z'),
    updated_at: new Date('2023-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const mockTermsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      activateTerm: jest.fn(),
      deactivateTerm: jest.fn(),
      getActiveTermForEntity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TermsController],
      providers: [
        {
          provide: TermsService,
          useValue: mockTermsService,
        },
      ],
    }).compile();

    controller = module.get<TermsController>(TermsController);
    service = module.get(TermsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a term', async () => {
      const createTermDto: CreateTermDto = {
        entity_id: mockEntity.id,
        name: '2020-2025 Administration',
        start_date: '2020-01-01',
        end_date: '2025-01-01',
      };

      service.create.mockResolvedValue(mockTerm);

      const result = await controller.create(createTermDto);

      expect(service.create).toHaveBeenCalledWith(createTermDto);
      expect(result).toEqual(mockTerm);
    });
  });

  describe('findAll', () => {
    it('should return all terms', async () => {
      service.findAll.mockResolvedValue([mockTerm]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockTerm]);
    });

    it('should return filtered terms by entity', async () => {
      service.findAll.mockResolvedValue([mockTerm]);

      const result = await controller.findAll(mockEntity.id);

      expect(service.findAll).toHaveBeenCalledWith(mockEntity.id);
      expect(result).toEqual([mockTerm]);
    });
  });

  describe('findOne', () => {
    it('should return a term', async () => {
      service.findOne.mockResolvedValue(mockTerm);

      const result = await controller.findOne(mockTerm.id);

      expect(service.findOne).toHaveBeenCalledWith(mockTerm.id);
      expect(result).toEqual(mockTerm);
    });
  });

  describe('update', () => {
    it('should update a term', async () => {
      const updateTermDto: UpdateTermDto = {
        name: 'Updated Administration',
        is_active: true,
      };

      const updatedTerm: Term = {
        ...mockTerm,
        name: updateTermDto.name || mockTerm.name,
        is_active:
          updateTermDto.is_active !== undefined ? updateTermDto.is_active : mockTerm.is_active,
      };
      service.update.mockResolvedValue(updatedTerm);

      const result = await controller.update(mockTerm.id, updateTermDto);

      expect(service.update).toHaveBeenCalledWith(mockTerm.id, updateTermDto);
      expect(result).toEqual(updatedTerm);
    });
  });

  describe('remove', () => {
    it('should remove a term', async () => {
      service.remove.mockResolvedValue();

      const result = await controller.remove(mockTerm.id);

      expect(service.remove).toHaveBeenCalledWith(mockTerm.id);
      expect(result).toEqual({ message: 'Term deleted successfully' });
    });
  });

  describe('activate', () => {
    it('should activate a term', async () => {
      const activatedTerm = { ...mockTerm, is_active: true };
      service.activateTerm.mockResolvedValue(activatedTerm);

      const result = await controller.activate(mockTerm.id);

      expect(service.activateTerm).toHaveBeenCalledWith(mockTerm.id);
      expect(result).toEqual(activatedTerm);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a term', async () => {
      const deactivatedTerm = { ...mockTerm, is_active: false };
      service.deactivateTerm.mockResolvedValue(deactivatedTerm);

      const result = await controller.deactivate(mockTerm.id);

      expect(service.deactivateTerm).toHaveBeenCalledWith(mockTerm.id);
      expect(result).toEqual(deactivatedTerm);
    });
  });

  describe('getActiveTerm', () => {
    it('should return active term for entity', async () => {
      const activeTerm = { ...mockTerm, is_active: true };
      service.getActiveTermForEntity.mockResolvedValue(activeTerm);

      const result = await controller.getActiveTerm(mockEntity.id);

      expect(service.getActiveTermForEntity).toHaveBeenCalledWith(mockEntity.id);
      expect(result).toEqual(activeTerm);
    });
  });
});
