import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TermsService } from './terms.service';
import { Term } from './term.entity';
import { Entity as OrganizationalEntity, EntityType } from '../entities/entity.entity';

describe('TermsService Integration - One Active Term Constraint', () => {
  let service: TermsService;
  let termRepository: Repository<Term>;

  const mockEntity: OrganizationalEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Union',
    type: EntityType.UNION,
    is_active: true,
    term_length_years: 5,
    created_at: new Date('2023-01-01T00:00:00Z'),
    updated_at: new Date('2023-01-01T00:00:00Z'),
    parent_id: null,
    children: [],
    users: [],
  };

  beforeEach(async () => {
    const mockTermRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockEntityRepository = {
      findOne: jest.fn().mockResolvedValue(mockEntity),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TermsService,
        {
          provide: getRepositoryToken(Term),
          useValue: mockTermRepository,
        },
        {
          provide: getRepositoryToken(OrganizationalEntity),
          useValue: mockEntityRepository,
        },
      ],
    }).compile();

    service = module.get<TermsService>(TermsService);
    termRepository = module.get(getRepositoryToken(Term));
  });

  describe('One Active Term Per Entity Constraint', () => {
    it('should ensure only one term is active per entity when activating a term', async () => {
      const mockTerm: Term = {
        id: 'term-1',
        entity_id: mockEntity.id,
        entity: mockEntity,
        name: 'First Term',
        start_date: new Date('2020-01-01'),
        end_date: new Date('2025-01-01'),
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (termRepository.findOne as jest.Mock).mockResolvedValue(mockTerm);

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      (termRepository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const activatedTerm = { ...mockTerm, is_active: true };
      (termRepository.save as jest.Mock).mockResolvedValue(activatedTerm);

      const result = await service.activateTerm('term-1');

      expect(result.is_active).toBe(true);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(Term);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ is_active: false });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('entity_id = :entityId', {
        entityId: mockEntity.id,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('id != :excludeTermId', {
        excludeTermId: 'term-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('is_active = true');
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should ensure only one term is active when updating a term to active', async () => {
      const mockTerm: Term = {
        id: 'term-1',
        entity_id: mockEntity.id,
        entity: mockEntity,
        name: 'First Term',
        start_date: new Date('2020-01-01'),
        end_date: new Date('2025-01-01'),
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (termRepository.findOne as jest.Mock).mockResolvedValue(mockTerm);

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      (termRepository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const updatedTerm = { ...mockTerm, is_active: true };
      (termRepository.save as jest.Mock).mockResolvedValue(updatedTerm);

      const result = await service.update('term-1', { is_active: true });

      expect(result.is_active).toBe(true);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(Term);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ is_active: false });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('entity_id = :entityId', {
        entityId: mockEntity.id,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('id != :excludeTermId', {
        excludeTermId: 'term-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('is_active = true');
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should not deactivate other terms when setting is_active to false', async () => {
      const mockTerm: Term = {
        id: 'term-1',
        entity_id: mockEntity.id,
        entity: mockEntity,
        name: 'First Term',
        start_date: new Date('2020-01-01'),
        end_date: new Date('2025-01-01'),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (termRepository.findOne as jest.Mock).mockResolvedValue(mockTerm);

      const deactivatedTerm = { ...mockTerm, is_active: false };
      (termRepository.save as jest.Mock).mockResolvedValue(deactivatedTerm);

      const result = await service.update('term-1', { is_active: false });

      expect(result.is_active).toBe(false);

      expect(termRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
