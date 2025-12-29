import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HierarchyBreakdownCalculator } from './hierarchy-breakdown.calculator';
import { User } from '../../users/user.entity';
import { Entity, EntityType } from '../../entities/entity.entity';
import { Activity } from '../../activity/activity.entity';
import { UserStatus } from '../../users/user-status.enum';

describe('HierarchyBreakdownCalculator', () => {
  let calculator: HierarchyBreakdownCalculator;
  let userRepo: jest.Mocked<Repository<User>>;
  let entityRepo: jest.Mocked<Repository<Entity>>;

  // Test data
  const entity1: Partial<Entity> = {
    id: 'entity-1',
    name: 'Association 1',
    type: EntityType.ASSOCIATION,
    parent_id: 'union-1',
  };

  const entity2: Partial<Entity> = {
    id: 'entity-2',
    name: 'Association 2',
    type: EntityType.ASSOCIATION,
    parent_id: 'union-1',
  };

  const entity3: Partial<Entity> = {
    id: 'entity-3',
    name: 'Field 1',
    type: EntityType.FIELD,
    parent_id: 'entity-1',
  };

  const user1: Partial<User> = {
    id: 'user-1',
    entity_id: 'entity-1',
    status: UserStatus.ACTIVE,
  };

  const user2: Partial<User> = {
    id: 'user-2',
    entity_id: 'entity-1',
    status: UserStatus.ACTIVE,
  };

  const user3: Partial<User> = {
    id: 'user-3',
    entity_id: 'entity-2',
    status: UserStatus.ACTIVE,
  };

  const createActivity = (
    id: string,
    userId: string,
    entityId: string,
    expenseAmount?: string,
  ): Partial<Activity> => ({
    id,
    userId,
    expenseAmount,
    user: { id: userId, entity_id: entityId } as any,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HierarchyBreakdownCalculator,
        {
          provide: getRepositoryToken(User),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
            }),
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(Entity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    calculator = module.get<HierarchyBreakdownCalculator>(HierarchyBreakdownCalculator);
    userRepo = module.get(getRepositoryToken(User));
    entityRepo = module.get(getRepositoryToken(Entity));
  });

  describe('calculate', () => {
    it('should group activities by entity', async () => {
      // Setup: Activities from 3 different entities
      const activities = [
        createActivity('a1', 'user-1', 'entity-1'),
        createActivity('a2', 'user-1', 'entity-1'),
        createActivity('a3', 'user-2', 'entity-1'),
        createActivity('a4', 'user-3', 'entity-2'),
        createActivity('a5', 'user-3', 'entity-2'),
      ] as Activity[];

      entityRepo.find = jest.fn().mockResolvedValue([entity1, entity2]);

      const qbMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { entityId: 'entity-1', count: '2' },
          { entityId: 'entity-2', count: '1' },
        ]),
      };
      userRepo.createQueryBuilder = jest.fn().mockReturnValue(qbMock);

      const result = await calculator.calculate(activities, ['entity-1', 'entity-2']);

      // Should have 2 breakdown entries (one per entity with activities)
      expect(result.length).toBe(2);
      expect(result.map((r) => r.entityId)).toContain('entity-1');
      expect(result.map((r) => r.entityId)).toContain('entity-2');
    });

    it('should calculate compliance rate per entity', async () => {
      // Setup: Entity with 2 users, 1 submitted (50% compliance)
      const activities = [
        createActivity('a1', 'user-1', 'entity-1'),
      ] as Activity[];

      entityRepo.find = jest.fn().mockResolvedValue([entity1]);

      const qbMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { entityId: 'entity-1', count: '2' }, // 2 users expected
        ]),
      };
      userRepo.createQueryBuilder = jest.fn().mockReturnValue(qbMock);

      const result = await calculator.calculate(activities, ['entity-1']);

      expect(result.length).toBe(1);
      expect(result[0].entityId).toBe('entity-1');
      expect(result[0].usersExpected).toBe(2);
      expect(result[0].usersSubmitted).toBe(1);
      expect(result[0].complianceRate).toBe(0.5);
    });

    it('should sum expenses per entity', async () => {
      // Setup: Multiple activities with expenses in same entity
      const activities = [
        createActivity('a1', 'user-1', 'entity-1', '50.00'),
        createActivity('a2', 'user-1', 'entity-1', '30.50'),
        createActivity('a3', 'user-2', 'entity-1', '19.50'),
      ] as Activity[];

      entityRepo.find = jest.fn().mockResolvedValue([entity1]);

      const qbMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { entityId: 'entity-1', count: '2' },
        ]),
      };
      userRepo.createQueryBuilder = jest.fn().mockReturnValue(qbMock);

      const result = await calculator.calculate(activities, ['entity-1']);

      expect(result.length).toBe(1);
      expect(result[0].expenses).toBe(100); // 50 + 30.5 + 19.5
    });

    it('should include entity hierarchy info (parentId, type)', async () => {
      const activities = [
        createActivity('a1', 'user-1', 'entity-1'),
      ] as Activity[];

      entityRepo.find = jest.fn().mockResolvedValue([entity1]);

      const qbMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { entityId: 'entity-1', count: '1' },
        ]),
      };
      userRepo.createQueryBuilder = jest.fn().mockReturnValue(qbMock);

      const result = await calculator.calculate(activities, ['entity-1']);

      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('parentId', 'union-1');
      expect(result[0]).toHaveProperty('entityType', EntityType.ASSOCIATION);
    });

    it('should return empty array when no activities', async () => {
      const result = await calculator.calculate([], ['entity-1']);
      expect(result).toEqual([]);
    });

    it('should handle activities without expenses', async () => {
      const activities = [
        createActivity('a1', 'user-1', 'entity-1'), // No expense
        createActivity('a2', 'user-1', 'entity-1', '25.00'),
      ] as Activity[];

      entityRepo.find = jest.fn().mockResolvedValue([entity1]);

      const qbMock = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { entityId: 'entity-1', count: '1' },
        ]),
      };
      userRepo.createQueryBuilder = jest.fn().mockReturnValue(qbMock);

      const result = await calculator.calculate(activities, ['entity-1']);

      expect(result[0].expenses).toBe(25);
    });
  });
});
