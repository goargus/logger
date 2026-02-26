import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ActivitiesService } from '../activities.service';
import { Activity } from '../activity.entity';
import { ActivityType } from '../../activities-type/activity-type.entity';
import { UserRoleAssignment } from '../../roles/user-role-assignment.entity';
import { User } from '../../users/user.entity';
import { LockService } from '../../periods/lock.service';

describe('ActivitiesService - Date Locking', () => {
  let service: ActivitiesService;
  let activityRepo: Record<string, jest.Mock>;
  let lockService: Record<string, jest.Mock>;

  beforeEach(async () => {
    activityRepo = {
      create: jest.fn((data) => ({ id: 'new-id', ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    lockService = {
      isDateAvailableForUser: jest.fn(),
      isDateLocked: jest.fn(),
    };

    const mockTypesRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'type-1', name: 'Test Type', allowed_roles: [] }),
    };
    const mockUraRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const mockUsersRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'user-1', entity_id: 'entity-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: getRepositoryToken(Activity), useValue: activityRepo },
        { provide: getRepositoryToken(ActivityType), useValue: mockTypesRepo },
        { provide: getRepositoryToken(UserRoleAssignment), useValue: mockUraRepo },
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: LockService, useValue: lockService },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = { activityTypeId: 'type-1', activityDate: '2026-03-20', hasExpense: false };

    it('allows creation when date is available', async () => {
      lockService.isDateAvailableForUser.mockResolvedValue(true);
      await service.create(dto as any, 'user-1');
      expect(activityRepo.save).toHaveBeenCalled();
    });

    it('rejects creation when date is locked', async () => {
      lockService.isDateAvailableForUser.mockResolvedValue(false);
      await expect(service.create(dto as any, 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMine', () => {
    it('rejects update when activity date is locked', async () => {
      activityRepo.findOne.mockResolvedValue({
        id: 'act-1',
        userId: 'user-1',
        activityDate: '2026-03-10',
        activityTypeId: 'type-1',
      });
      lockService.isDateAvailableForUser.mockResolvedValue(false);

      await expect(service.updateMine('act-1', {}, 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('archiveMine', () => {
    it('rejects archive when activity date is locked', async () => {
      activityRepo.findOne.mockResolvedValue({
        id: 'act-1',
        userId: 'user-1',
        activityDate: '2026-03-10',
        status: 'active',
      });
      lockService.isDateAvailableForUser.mockResolvedValue(false);

      await expect(service.archiveMine('act-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
