import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { EntitiesService } from '../entities.service';
import { HierarchyValidationService } from '../hierarchy-validation.service';
import { Entity, EntityType } from '../entity.entity';

type MockRepo<T extends ObjectLiteral = never> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function createRepoMock<T extends ObjectLiteral>(): MockRepo<T> {
  return {
    exist: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    query: jest.fn(),
  };
}

describe('EntitiesService - Hierarchy Methods', () => {
  let service: EntitiesService;
  let repo: MockRepo<Entity>;
  let hierarchyValidation: jest.Mocked<HierarchyValidationService>;

  // Test entities for hierarchy: Union -> 2 Associations -> 2 Fields each
  const unionEntity: Entity = {
    id: 'union-1',
    name: 'Test Union',
    type: EntityType.UNION,
    code: 'TU',
    description: 'Test union',
    location: 'Location',
    is_active: true,
    term_length_years: 5,
    parent_id: 'platform-1',
    created_at: new Date() as never,
    updated_at: new Date() as never,
    users: [],
    children: [],
  };

  const association1: Entity = {
    id: 'assoc-1',
    name: 'Association 1',
    type: EntityType.ASSOCIATION,
    code: 'A1',
    description: 'Test association 1',
    location: 'Location',
    is_active: true,
    term_length_years: 5,
    parent_id: 'union-1',
    created_at: new Date() as never,
    updated_at: new Date() as never,
    users: [],
    children: [],
  };

  const association2: Entity = {
    id: 'assoc-2',
    name: 'Association 2',
    type: EntityType.ASSOCIATION,
    code: 'A2',
    description: 'Test association 2',
    location: 'Location',
    is_active: true,
    term_length_years: 5,
    parent_id: 'union-1',
    created_at: new Date() as never,
    updated_at: new Date() as never,
    users: [],
    children: [],
  };

  const inactiveAssociation: Entity = {
    id: 'assoc-3',
    name: 'Inactive Association',
    type: EntityType.ASSOCIATION,
    code: 'A3',
    description: 'Inactive association',
    location: 'Location',
    is_active: false,
    term_length_years: 5,
    parent_id: 'union-1',
    created_at: new Date() as never,
    updated_at: new Date() as never,
    users: [],
    children: [],
  };

  const field1a: Entity = {
    id: 'field-1a',
    name: 'Field 1A',
    type: EntityType.FIELD,
    code: 'F1A',
    description: 'Test field 1A',
    location: 'Location',
    is_active: true,
    term_length_years: 5,
    parent_id: 'assoc-1',
    created_at: new Date() as never,
    updated_at: new Date() as never,
    users: [],
    children: [],
  };

  const field1b: Entity = {
    id: 'field-1b',
    name: 'Field 1B',
    type: EntityType.FIELD,
    code: 'F1B',
    description: 'Test field 1B',
    location: 'Location',
    is_active: true,
    term_length_years: 5,
    parent_id: 'assoc-1',
    created_at: new Date() as never,
    updated_at: new Date() as never,
    users: [],
    children: [],
  };

  const field2a: Entity = {
    id: 'field-2a',
    name: 'Field 2A',
    type: EntityType.FIELD,
    code: 'F2A',
    description: 'Test field 2A',
    location: 'Location',
    is_active: true,
    term_length_years: 5,
    parent_id: 'assoc-2',
    created_at: new Date() as never,
    updated_at: new Date() as never,
    users: [],
    children: [],
  };

  beforeEach(async () => {
    repo = createRepoMock<Entity>();
    hierarchyValidation = {
      validateHierarchy: jest.fn(),
      getAllowedParentTypes: jest.fn(),
      getAllowedChildTypes: jest.fn(),
      canHaveChildren: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitiesService,
        {
          provide: getRepositoryToken(Entity),
          useValue: repo,
        },
        {
          provide: HierarchyValidationService,
          useValue: hierarchyValidation,
        },
      ],
    }).compile();

    service = module.get<EntitiesService>(EntitiesService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('findDescendants', () => {
    it('should return all descendants recursively using a CTE', async () => {
      // Setup: Union -> 2 Associations -> 3 Fields total
      repo.query?.mockResolvedValue([
        unionEntity,
        association1,
        association2,
        field1a,
        field1b,
        field2a,
      ]);

      const result = await service.findDescendants('union-1');

      expect(repo.query).toHaveBeenCalled();
      expect(repo.query?.mock.calls[0][0]).toContain('WITH RECURSIVE entity_tree AS');

      // Should return 2 associations + 3 fields = 5 descendants
      expect(result).toHaveLength(5);
      expect(result.map((e) => e.id)).toContain('assoc-1');
      expect(result.map((e) => e.id)).toContain('assoc-2');
      expect(result.map((e) => e.id)).toContain('field-1a');
      expect(result.map((e) => e.id)).toContain('field-1b');
      expect(result.map((e) => e.id)).toContain('field-2a');
    });

    it('should return empty array for leaf entity (Field)', async () => {
      repo.query?.mockResolvedValue([field1a]);

      const result = await service.findDescendants('field-1a');

      expect(result).toHaveLength(0);
    });

    it('should only return active entities', async () => {
      repo.query?.mockResolvedValue([
        unionEntity,
        association1,
        association2,
        field1a,
        field1b,
        field2a,
      ]);

      const result = await service.findDescendants('union-1');

      expect(repo.query).toHaveBeenCalled();
      expect(repo.query?.mock.calls[0][0]).toContain('WHERE e.is_active = true');

      // Should NOT include inactive association
      expect(result.map((e) => e.id)).not.toContain('assoc-3');
      expect(result.every((e) => e.is_active)).toBe(true);
    });

    it('should throw NotFoundException for invalid entity ID', async () => {
      repo.query?.mockResolvedValue([]);

      await expect(service.findDescendants('invalid-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should handle single level of children', async () => {
      repo.query?.mockResolvedValue([association1, field1a, field1b]);

      const result = await service.findDescendants('assoc-1');

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id)).toEqual(['field-1a', 'field-1b']);
    });
  });

  describe('getHierarchyTree', () => {
    it('should return nested tree structure', async () => {
      repo.findOne?.mockResolvedValue(unionEntity);
      repo.find?.mockImplementation(async ({ where }: any) => {
        const parentId = where?.parent_id;
        if (parentId === 'union-1') {
          return [association1];
        }
        if (parentId === 'assoc-1') {
          return [field1a];
        }
        return [];
      });

      const result = await service.getHierarchyTree('union-1');

      // Root should have children
      expect(result.children).toBeDefined();
      expect(result.children.length).toBeGreaterThan(0);

      // First child (association) should have its own children (fields)
      expect(result.children[0].children).toBeDefined();
    });

    it('should include entity metadata (id, name, type, code)', async () => {
      repo.findOne?.mockResolvedValue(unionEntity);
      repo.find?.mockResolvedValue([]);

      const result = await service.getHierarchyTree('union-1');

      expect(result).toHaveProperty('id', 'union-1');
      expect(result).toHaveProperty('name', 'Test Union');
      expect(result).toHaveProperty('type', EntityType.UNION);
      expect(result).toHaveProperty('code', 'TU');
      expect(result).toHaveProperty('is_active', true);
      expect(result).toHaveProperty('children');
    });

    it('should return empty children array for leaf nodes', async () => {
      repo.findOne?.mockResolvedValue(field1a);
      repo.find?.mockResolvedValue([]);

      const result = await service.getHierarchyTree('field-1a');

      expect(result.children).toEqual([]);
    });

    it('should throw NotFoundException for invalid entity ID', async () => {
      repo.findOne?.mockResolvedValue(null);

      await expect(service.getHierarchyTree('invalid-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should build correct tree structure for multi-level hierarchy', async () => {
      repo.findOne?.mockResolvedValue(unionEntity);
      repo.find?.mockImplementation(async ({ where }: any) => {
        const parentId = where?.parent_id;
        if (parentId === 'union-1') {
          return [association1, association2];
        }
        if (parentId === 'assoc-1') {
          return [field1a, field1b];
        }
        if (parentId === 'assoc-2') {
          return [field2a];
        }
        return [];
      });

      const result = await service.getHierarchyTree('union-1');

      // Verify structure
      expect(result.id).toBe('union-1');
      expect(result.children).toHaveLength(2);

      // Find association1 in children
      const assoc1Node = result.children.find((c) => c.id === 'assoc-1');
      expect(assoc1Node).toBeDefined();
      expect(assoc1Node?.children).toHaveLength(2);

      // Find association2 in children
      const assoc2Node = result.children.find((c) => c.id === 'assoc-2');
      expect(assoc2Node).toBeDefined();
      expect(assoc2Node?.children).toHaveLength(1);
    });
  });
});
