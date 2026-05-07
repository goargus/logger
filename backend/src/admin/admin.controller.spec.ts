import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { ActivitiesService } from '../activity/activities.service';
import { User } from '../users/user.entity';
import { ActivityType } from '../activities-type/activity-type.entity';
import { LockService } from '../periods/lock.service';
import { PermissionsService } from '../auth/permissions/permissions.service';
import { RolesGuard } from '../auth/roles.guard';

describe('AdminController', () => {
  let controller: AdminController;
  let activitiesService: jest.Mocked<ActivitiesService>;
  let usersRepo: { findOneByOrFail: jest.Mock };
  let typesRepo: { findOneByOrFail: jest.Mock };
  let lockService: { getAdminLock: jest.Mock; isDateLockedSync: jest.Mock };

  beforeEach(async () => {
    usersRepo = {
      findOneByOrFail: jest.fn(),
    };
    typesRepo = {
      findOneByOrFail: jest.fn(),
    };
    lockService = {
      getAdminLock: jest.fn(),
      isDateLockedSync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: {
            createForUserByAdmin: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
        {
          provide: getRepositoryToken(ActivityType),
          useValue: typesRepo,
        },
        {
          provide: LockService,
          useValue: lockService,
        },
        {
          provide: PermissionsService,
          useValue: {
            userHasPermission: jest.fn().mockResolvedValue(true),
          },
        },
        RolesGuard,
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    activitiesService = module.get(ActivitiesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createActivityForUser', () => {
    it('creates an activity for the target user and returns ActivityResponseDto shape', async () => {
      const dto = {
        targetUserId: 'user-2',
        activityTypeId: 'type-1',
        activityDate: '2027-01-15',
        description: 'Admin scheduled activity',
        hasExpense: false,
      };
      const createdAt = new Date('2026-05-07T10:00:00.000Z');
      const updatedAt = new Date('2026-05-07T10:00:00.000Z');
      const created = {
        id: 'activity-1',
        activityTypeId: dto.activityTypeId,
        activityDate: dto.activityDate,
        description: dto.description,
        hasExpense: false,
        expenseAmount: null,
        status: 'active',
        createdAt,
        updatedAt,
        userId: dto.targetUserId,
      };

      activitiesService.createForUserByAdmin.mockResolvedValue(created as any);
      usersRepo.findOneByOrFail.mockResolvedValue({
        id: dto.targetUserId,
        username: 'target-user',
        entity_id: 'entity-1',
      });
      typesRepo.findOneByOrFail.mockResolvedValue({
        id: dto.activityTypeId,
        name: 'Visita',
      });
      lockService.getAdminLock.mockResolvedValue({ lockDate: '2027-01-01' });
      lockService.isDateLockedSync.mockReturnValue(false);

      const result = await controller.createActivityForUser(
        { user: { id: 'admin-1' } } as any,
        dto as any,
      );

      expect(activitiesService.createForUserByAdmin).toHaveBeenCalledWith(dto, 'admin-1');
      expect(usersRepo.findOneByOrFail).toHaveBeenCalledWith({ id: dto.targetUserId });
      expect(typesRepo.findOneByOrFail).toHaveBeenCalledWith({ id: dto.activityTypeId });
      expect(lockService.getAdminLock).toHaveBeenCalledWith('entity-1');
      expect(result).toEqual({
        id: 'activity-1',
        activityTypeId: 'type-1',
        activityTypeName: 'Visita',
        activityDate: '2027-01-15',
        description: 'Admin scheduled activity',
        hasExpense: false,
        expenseAmount: null,
        status: 'active',
        isLocked: false,
        createdAt,
        updatedAt,
        ownerUserId: 'user-2',
        ownerUsername: 'target-user',
      });
    });
  });
});
