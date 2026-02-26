import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivitiesService } from '../activities.service';
import { Activity } from '../activity.entity';
import { ActivityType } from '../../activities-type/activity-type.entity';
import { UserRoleAssignment } from '../../roles/user-role-assignment.entity';
import { ActivityStatus } from '../activity-status.enum';
import { User } from '../../users/user.entity';
import { LockService } from '../../periods/lock.service';

describe('ActivitiesService - Filters', () => {
  let service: ActivitiesService;
  let activityRepo: jest.Mocked<Repository<Activity>>;
  let qb: any;

  beforeEach(async () => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    const mockActivityRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: getRepositoryToken(Activity),
          useValue: mockActivityRepo,
        },
        {
          provide: getRepositoryToken(ActivityType),
          useValue: {},
        },
        {
          provide: getRepositoryToken(UserRoleAssignment),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: LockService,
          useValue: { isDateAvailableForUser: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    activityRepo = module.get(getRepositoryToken(Activity));
  });

  it('applies base user and status filters', async () => {
    await service.findMine('user-id', 1, 20);

    expect(activityRepo.createQueryBuilder).toHaveBeenCalledWith('activity');
    expect(qb.where).toHaveBeenCalledWith('activity.userId = :userId', { userId: 'user-id' });
    expect(qb.andWhere).toHaveBeenCalledWith('activity.status = :status', {
      status: ActivityStatus.ACTIVE,
    });
  });

  it('applies date range filters when provided', async () => {
    await service.findMine('user-id', 1, 20, {
      startDate: '2024-03-01',
      endDate: '2024-03-31',
    });

    expect(qb.andWhere).toHaveBeenCalledWith('activity.activityDate >= :startDate', {
      startDate: '2024-03-01',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('activity.activityDate <= :endDate', {
      endDate: '2024-03-31',
    });
  });

  it('combines activity type and expense filters', async () => {
    await service.findMine('user-id', 1, 20, {
      activityTypeId: 'type-id',
      hasExpense: true,
    });

    expect(qb.andWhere).toHaveBeenCalledWith('activity.activityTypeId = :activityTypeId', {
      activityTypeId: 'type-id',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('activity.hasExpense = :hasExpense', {
      hasExpense: true,
    });
  });

  it('includes hasExpense=false filters', async () => {
    await service.findMine('user-id', 1, 20, {
      hasExpense: false,
    });

    expect(qb.andWhere).toHaveBeenCalledWith('activity.hasExpense = :hasExpense', {
      hasExpense: false,
    });
  });

  it('combines all filters without conflicts', async () => {
    await service.findMine('user-id', 2, 10, {
      startDate: '2024-01-01',
      endDate: '2024-03-15',
      activityTypeId: 'type-id',
      hasExpense: true,
    });

    expect(qb.andWhere).toHaveBeenCalledWith('activity.activityDate >= :startDate', {
      startDate: '2024-01-01',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('activity.activityDate <= :endDate', {
      endDate: '2024-03-15',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('activity.activityTypeId = :activityTypeId', {
      activityTypeId: 'type-id',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('activity.hasExpense = :hasExpense', {
      hasExpense: true,
    });
  });
});
