import { Test, TestingModule } from '@nestjs/testing';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RoleAssignmentService } from '../role-assignment.service';
import { UserRoleAssignment } from '../user-role-assignment.entity';
import { User } from '../../users/user.entity';
import { Role } from '../role.entity';
import { Entity as OrgEntity } from '../../entities/entity.entity';
import { UserStatus } from '../../users/user-status.enum';
import { AssignRoleDto } from '../dto/assign-role.dto';

describe('RoleAssignmentService - Historical Tracking', () => {
  let service: RoleAssignmentService;
  let uraRepo: jest.Mocked<Repository<UserRoleAssignment>>;
  let usersRepo: jest.Mocked<Repository<User>>;
  let rolesRepo: jest.Mocked<Repository<Role>>;
  let entitiesRepo: jest.Mocked<Repository<OrgEntity>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockUser: User = {
    id: 'user-id',
    username: 'testuser',
    email: 'test@example.com',
    status: UserStatus.ACTIVE,
  } as User;

  const mockRole: Role = {
    id: 'role-id',
    name: 'MISSIONARY',
    description: 'Missionary role',
  } as Role;

  const mockEntity: OrgEntity = {
    id: 'entity-id',
    name: 'Test Entity',
    is_active: true,
    term_length_years: 5,
  } as OrgEntity;

  beforeEach(async () => {
    const mockUsersRepo = {
      findOne: jest.fn(),
    };

    const mockRolesRepo = {
      findOne: jest.fn(),
    };

    const mockEntitiesRepo = {
      findOne: jest.fn(),
    };

    const mockUraRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleAssignmentService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepo,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRolesRepo,
        },
        {
          provide: getRepositoryToken(OrgEntity),
          useValue: mockEntitiesRepo,
        },
        {
          provide: getRepositoryToken(UserRoleAssignment),
          useValue: mockUraRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RoleAssignmentService>(RoleAssignmentService);
    usersRepo = module.get(getRepositoryToken(User));
    rolesRepo = module.get(getRepositoryToken(Role));
    entitiesRepo = module.get(getRepositoryToken(OrgEntity));
    uraRepo = module.get(getRepositoryToken(UserRoleAssignment));
    dataSource = module.get(DataSource);
  });

  describe('assign - automatic end_date calculation', () => {
    it('should set start_date to today and calculate end_date when not provided', async () => {
      const dto: AssignRoleDto = {
        userId: 'user-id',
        roleId: 'role-id',
        entityId: 'entity-id',
      };

      const today = new Date().toISOString().split('T')[0];

      usersRepo.findOne.mockResolvedValue(mockUser);
      rolesRepo.findOne.mockResolvedValue(mockRole);
      entitiesRepo.findOne.mockResolvedValue(mockEntity);

      // Mock query builder for overlap check
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      uraRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder as any);

      let capturedAssignment: any = null;

      dataSource.transaction.mockImplementation(async (callback: any) => {
        const manager = {
          create: jest.fn().mockImplementation((_, data) => data),
          save: jest.fn().mockImplementation((data) => {
            capturedAssignment = data;
            return Promise.resolve(data);
          }),
        };
        return await callback(manager);
      });

      const result = await service.assign(dto);

      expect(capturedAssignment.start_date).toBe(today);
      expect(capturedAssignment.end_date).toBeDefined();
      // Verify end_date is 5 years - 1 day from start_date (default term length)
      const startDate = new Date(capturedAssignment.start_date);
      const endDate = new Date(capturedAssignment.end_date);
      const diffInDays = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffInDays).toBeGreaterThanOrEqual(1824); // ~5 years - 1 day
      expect(diffInDays).toBeLessThanOrEqual(1826); // Account for leap years
    });

    it('should use provided start_date and calculate correct end_date', async () => {
      const dto: AssignRoleDto = {
        userId: 'user-id',
        roleId: 'role-id',
        entityId: 'entity-id',
        startDate: '2025-01-01',
      };

      usersRepo.findOne.mockResolvedValue(mockUser);
      rolesRepo.findOne.mockResolvedValue(mockRole);
      entitiesRepo.findOne.mockResolvedValue(mockEntity);

      // Mock query builder for overlap check
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      uraRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder as any);

      let capturedAssignment: any = null;

      dataSource.transaction.mockImplementation(async (callback: any) => {
        const manager = {
          create: jest.fn().mockImplementation((_, data) => data),
          save: jest.fn().mockImplementation((data) => {
            capturedAssignment = data;
            return Promise.resolve(data);
          }),
        };
        return await callback(manager);
      });

      await service.assign(dto);

      expect(capturedAssignment.start_date).toBe('2025-01-01');
      expect(capturedAssignment.end_date).toBe('2029-12-31');
    });
  });

  describe('listAssignments - with filters', () => {
    it('should return all assignments when no filters provided', async () => {
      const assignments = [
        { id: 'assign-1', end_date: '2029-12-31' },
        { id: 'assign-2', end_date: '2023-12-31' },
      ] as any[];

      uraRepo.find.mockResolvedValue(assignments);

      const result = await service.listAssignments();

      expect(result).toHaveLength(2);
      expect(uraRepo.find).toHaveBeenCalledWith({ where: {} });
    });

    it('should filter by entityId', async () => {
      const assignments = [{ id: 'assign-1' }] as any[];

      uraRepo.find.mockResolvedValue(assignments);

      await service.listAssignments('entity-id');

      expect(uraRepo.find).toHaveBeenCalledWith({
        where: { entity: { id: 'entity-id' } },
      });
    });

    it('should filter by userId', async () => {
      const assignments = [{ id: 'assign-1' }] as any[];

      uraRepo.find.mockResolvedValue(assignments);

      await service.listAssignments(undefined, 'user-id');

      expect(uraRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-id' } },
      });
    });

    it('should filter by active status - return only active', async () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const futureDate = future.toISOString().split('T')[0];

      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      const pastDate = past.toISOString().split('T')[0];

      const assignments = [
        { id: 'assign-1', end_date: futureDate },
        { id: 'assign-2', end_date: pastDate },
      ] as any[];

      uraRepo.find.mockResolvedValue(assignments);

      const result = await service.listAssignments(undefined, undefined, true);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('assign-1');
    });

    it('should filter by active status - return only inactive', async () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const futureDate = future.toISOString().split('T')[0];

      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      const pastDate = past.toISOString().split('T')[0];

      const assignments = [
        { id: 'assign-1', end_date: futureDate },
        { id: 'assign-2', end_date: pastDate },
      ] as any[];

      uraRepo.find.mockResolvedValue(assignments);

      const result = await service.listAssignments(undefined, undefined, false);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('assign-2');
    });
  });

  describe('getAssignment', () => {
    it('should return assignment by id', async () => {
      const assignment = { id: 'assign-1' } as any;

      uraRepo.findOne.mockResolvedValue(assignment);

      const result = await service.getAssignment('assign-1');

      expect(result).toEqual(assignment);
      expect(uraRepo.findOne).toHaveBeenCalledWith({ where: { id: 'assign-1' } });
    });

    it('should throw NotFoundException when assignment not found', async () => {
      uraRepo.findOne.mockResolvedValue(null);

      await expect(service.getAssignment('invalid-id')).rejects.toThrow(
        new NotFoundException('Assignment not found'),
      );
    });
  });

  describe('updateAssignment', () => {
    it('should update end_date successfully', async () => {
      const assignment = {
        id: 'assign-1',
        user: mockUser,
        role: mockRole,
        entity: mockEntity,
        start_date: '2024-01-01',
        end_date: '2029-12-31',
        updated_by: undefined,
      } as any;

      uraRepo.findOne.mockResolvedValue(assignment);

      // Mock query builder for overlap check
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      uraRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder as any);

      uraRepo.save.mockResolvedValue({ ...assignment, end_date: '2027-12-31' });

      const result = await service.updateAssignment('assign-1', '2027-12-31', 'admin-id');

      expect(result.end_date).toBe('2027-12-31');
      expect(uraRepo.save).toHaveBeenCalledWith({
        ...assignment,
        end_date: '2027-12-31',
        updated_by: 'admin-id',
      });
    });

    it('should throw BadRequestException when end_date is before start_date', async () => {
      const assignment = {
        id: 'assign-1',
        user: mockUser,
        role: mockRole,
        entity: mockEntity,
        start_date: '2024-01-01',
        end_date: '2029-12-31',
      } as any;

      uraRepo.findOne.mockResolvedValue(assignment);

      await expect(service.updateAssignment('assign-1', '2023-12-31')).rejects.toThrow(
        new BadRequestException('End date cannot be before start date'),
      );
    });

    it('should throw NotFoundException when assignment not found', async () => {
      uraRepo.findOne.mockResolvedValue(null);

      await expect(service.updateAssignment('invalid-id', '2027-12-31')).rejects.toThrow(
        new NotFoundException('Assignment not found'),
      );
    });

    it('should verify start_date immutability', async () => {
      const assignment = {
        id: 'assign-1',
        user: mockUser,
        role: mockRole,
        entity: mockEntity,
        start_date: '2024-01-01',
        end_date: '2029-12-31',
      } as any;

      uraRepo.findOne.mockResolvedValue(assignment);

      // Mock query builder for overlap check
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      uraRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder as any);

      uraRepo.save.mockResolvedValue({ ...assignment, end_date: '2027-12-31' });

      await service.updateAssignment('assign-1', '2027-12-31');

      // Verify start_date remains unchanged
      expect(uraRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          start_date: '2024-01-01',
        }),
      );
    });
  });

  describe('deleteAssignment', () => {
    it('should delete assignment successfully', async () => {
      const assignment = { id: 'assign-1' } as any;

      uraRepo.findOne.mockResolvedValue(assignment);
      uraRepo.remove.mockResolvedValue(assignment);

      const result = await service.deleteAssignment('assign-1');

      expect(result).toEqual({ deleted: true });
      expect(uraRepo.remove).toHaveBeenCalledWith(assignment);
    });

    it('should throw NotFoundException when assignment not found', async () => {
      uraRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteAssignment('invalid-id')).rejects.toThrow(
        new NotFoundException('Assignment not found'),
      );
    });
  });

  describe('UserRoleAssignment entity - isActive method', () => {
    it('should return true when end_date is in the future', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const futureDate = future.toISOString().split('T')[0];

      const assignment = new UserRoleAssignment();
      assignment.end_date = futureDate;

      expect(assignment.isActive()).toBe(true);
    });

    it('should return true when end_date is today', () => {
      const today = new Date().toISOString().split('T')[0];

      const assignment = new UserRoleAssignment();
      assignment.end_date = today;

      expect(assignment.isActive()).toBe(true);
    });

    it('should return false when end_date is in the past', () => {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      const pastDate = past.toISOString().split('T')[0];

      const assignment = new UserRoleAssignment();
      assignment.end_date = pastDate;

      expect(assignment.isActive()).toBe(false);
    });
  });
});
