import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from '../activity.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Activity } from '../entities/activity.entity';
import { Category } from '../../src/categories/entities/category.entity';
import { Repository } from 'typeorm';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { UpdateActivityDto } from '../dto/update-activity.dto';

const mockActivityRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  createQueryBuilder: jest.fn(),
  remove: jest.fn(),
});

const mockCategoryRepo = () => ({
  findOneBy: jest.fn(),
});

describe('ActivityService', () => {
  let service: ActivityService;
  let activityRepo: jest.Mocked<Repository<Activity>>;
  let categoryRepo: jest.Mocked<Repository<Category>>;

  const mockUser = { id: 'user-1' } as never;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        { provide: getRepositoryToken(Activity), useFactory: mockActivityRepo },
        { provide: getRepositoryToken(Category), useFactory: mockCategoryRepo },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    activityRepo = module.get(getRepositoryToken(Activity));
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  describe('create', () => {
    it('should create and save an activity', async () => {
      const dto: CreateActivityDto = {
        category_id: 'cat-1',
        date: '2025-07-20',
        description: 'Visita',
      };

      const mockCategory = { id: 'cat-1' } as Category;
      categoryRepo.findOneBy.mockResolvedValue(mockCategory);

      function mockActivity(overrides: Partial<Activity> = {}): Activity {
        return {
          id: 'mock-id',
          user: mockUser,
          category: { id: 'cat-1', name: 'Evangelismo' } as Category,
          description: 'default',
          date: '2025-07-21',
          is_locked: false,
          created_at: new Date(),
          updated_at: new Date(),
          ...overrides,
        };
      }

      const createdActivity = mockActivity({ ...dto });
      activityRepo.create.mockReturnValue(createdActivity);
      activityRepo.save.mockResolvedValue(createdActivity);

      const result = await service.create(dto, mockUser);

      expect(categoryRepo.findOneBy).toHaveBeenCalledWith({ id: 'cat-1' });
      expect(activityRepo.create).toHaveBeenCalled();
      expect(activityRepo.save).toHaveBeenCalledWith(createdActivity);
      expect(result).toEqual(createdActivity);
    });
  });

  describe('update', () => {
    it('should update an unlocked activity', async () => {
      const activity = {
        id: 'a1',
        user: mockUser,
        is_locked: false,
        description: 'old',
        category: { id: 'old-cat' },
      } as never;

      const dto: UpdateActivityDto = {
        description: 'new',
      };

      activityRepo.findOne.mockResolvedValue(activity);
      activityRepo.save.mockImplementation(async (a) => a as Activity);

      const result = await service.update('a1', dto, mockUser);

      expect(result.description).toBe('new');
      expect(activityRepo.save).toHaveBeenCalled();
    });

    it('should throw if activity is locked', async () => {
      const activity = { id: 'a1', user: mockUser, is_locked: true } as never;
      activityRepo.findOne.mockResolvedValue(activity);

      await expect(service.update('a1', { description: 'x' }, mockUser)).rejects.toThrow(
        'Activity is locked',
      );
    });
  });

  describe('remove', () => {
    it('should remove an unlocked activity', async () => {
      const activity = { id: 'a1', user: mockUser, is_locked: false } as never;
      activityRepo.findOne.mockResolvedValue(activity);

      await service.remove('a1', mockUser);

      expect(activityRepo.remove).toHaveBeenCalledWith(activity);
    });

    it('should throw if activity is locked', async () => {
      const activity = { id: 'a1', user: mockUser, is_locked: true } as never;
      activityRepo.findOne.mockResolvedValue(activity);

      await expect(service.remove('a1', mockUser)).rejects.toThrow('Activity is locked');
    });
  });

  describe('findAll', () => {
    it('should return activities with old ones locked', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'a1', date: '2023-01-01', is_locked: false },
          { id: 'a2', date: new Date().toISOString().slice(0, 10), is_locked: false },
        ]),
      };

      activityRepo.createQueryBuilder.mockReturnValue(queryBuilder as never);

      const result = await service.findAll(mockUser, {});
      expect(result[0].is_locked).toBe(true);
      expect(result[1].is_locked).toBe(false);
    });
  });
});
