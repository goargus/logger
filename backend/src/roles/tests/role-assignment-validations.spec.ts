import { Test, TestingModule } from '@nestjs/testing';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { RoleAssignmentService } from '../role-assignment.service';
import { UserRoleAssignment } from '../user-role-assignment.entity';
import { User } from '../../users/user.entity';
import { Role } from '../role.entity';
import { Entity as OrgEntity } from '../../entities/entity.entity';
import { UserStatus } from '../../users/user-status.enum';
import { AssignRoleDto, RoleEnum } from '../dto/assign-role.dto';

describe('RoleAssignmentService - Validations', () => {
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

  describe('Overlap validation', () => {
    it('should prevent creating overlapping assignments with exact same dates', async () => {
      const dto: AssignRoleDto = {
        userId: 'user-id',
        role: RoleEnum.MISSIONARY,
        entityId: 'entity-id',
        startDate: '2025-01-01',
      };

      const existingAssignment = {
        id: 'existing-id',
        user: mockUser,
        role: mockRole,
        entity: mockEntity,
        start_date: '2025-01-01',
        end_date: '2029-12-31',
      };

      usersRepo.findOne.mockResolvedValue(mockUser);
      rolesRepo.findOne.mockResolvedValue(mockRole);
      entitiesRepo.findOne.mockResolvedValue(mockEntity);

      // Mock query builder for overlap check
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingAssignment),
      };
      uraRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(service.assign(dto)).rejects.toThrow(
        new ConflictException(
          'An overlapping assignment already exists for this user, role, and entity from 2025-01-01 to 2029-12-31',
        ),
      );
    });

    it('should prevent creating assignment that starts during existing assignment', async () => {
      const dto: AssignRoleDto = {
        userId: 'user-id',
        role: RoleEnum.MISSIONARY,
        entityId: 'entity-id',
        startDate: '2026-06-01', // Starts during existing 2025-2029 assignment
      };

      const existingAssignment = {
        id: 'existing-id',
        user: mockUser,
        role: mockRole,
        entity: mockEntity,
        start_date: '2025-01-01',
        end_date: '2029-12-31',
      };

      usersRepo.findOne.mockResolvedValue(mockUser);
      rolesRepo.findOne.mockResolvedValue(mockRole);
      entitiesRepo.findOne.mockResolvedValue(mockEntity);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingAssignment),
      };
      uraRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(service.assign(dto)).rejects.toThrow(ConflictException);
    });

    it('should prevent creating assignment that ends during existing assignment', async () => {
      const dto: AssignRoleDto = {
        userId: 'user-id',
        role: RoleEnum.MISSIONARY,
        entityId: 'entity-id',
        startDate: '2024-01-01', // Would end 2028-12-31, overlapping with 2025-2029
      };

      const existingAssignment = {
        id: 'existing-id',
        user: mockUser,
        role: mockRole,
        entity: mockEntity,
        start_date: '2025-01-01',
        end_date: '2029-12-31',
      };

      usersRepo.findOne.mockResolvedValue(mockUser);
      rolesRepo.findOne.mockResolvedValue(mockRole);
      entitiesRepo.findOne.mockResolvedValue(mockEntity);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingAssignment),
      };
      uraRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(service.assign(dto)).rejects.toThrow(ConflictException);
    });

    it('should prevent creating assignment that completely overlaps existing assignment', async () => {
      const dto: AssignRoleDto = {
        userId: 'user-id',
        role: RoleEnum.MISSIONARY,
        entityId: 'entity-id',
        startDate: '2024-01-01', // 2024-2028 completely overlaps 2025-2027
      };

      const existingAssignment = {
        id: 'existing-id',
        user: mockUser,
        role: mockRole,
        entity: mockEntity,
        start_date: '2025-01-01',
        end_date: '2027-12-31',
      };

      usersRepo.findOne.mockResolvedValue(mockUser);
      rolesRepo.findOne.mockResolvedValue(mockRole);
      entitiesRepo.findOne.mockResolvedValue(mockEntity);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingAssignment),
      };
      uraRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(service.assign(dto)).rejects.toThrow(ConflictException);
    });

    it('should allow creating assignment that starts after existing assignment ends', async () => {
      const dto: AssignRoleDto = {
        userId: 'user-id',
        role: RoleEnum.MISSIONARY,
        entityId: 'entity-id',
        startDate: '2030-01-01', // Starts after existing ends
      };

      usersRepo.findOne.mockResolvedValue(mockUser);
      rolesRepo.findOne.mockResolvedValue(mockRole);
      entitiesRepo.findOne.mockResolvedValue(mockEntity);

      // No overlap found
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      uraRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      dataSource.transaction.mockImplementation(async (callback: any) => {
        const manager = {
          create: jest.fn().mockImplementation((_, data) => data),
          save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
        };
        return await callback(manager);
      });

      await expect(service.assign(dto)).resolves.toBeDefined();
    });

    it('should allow creating assignment that ends before existing assignment starts', async () => {
      const dto: AssignRoleDto = {
        userId: 'user-id',
        role: RoleEnum.MISSIONARY,
        entityId: 'entity-id',
        startDate: '2020-01-01', // Ends 2024-12-31, before existing starts
      };

      usersRepo.findOne.mockResolvedValue(mockUser);
      rolesRepo.findOne.mockResolvedValue(mockRole);
      entitiesRepo.findOne.mockResolvedValue(mockEntity);

      // No overlap found
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      uraRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      dataSource.transaction.mockImplementation(async (callback: any) => {
        const manager = {
          create: jest.fn().mockImplementation((_, data) => data),
          save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
        };
        return await callback(manager);
      });

      await expect(service.assign(dto)).resolves.toBeDefined();
    });

    it('should allow same user to have same role in different entities', async () => {
      const dto: AssignRoleDto = {
        userId: 'user-id',
        role: RoleEnum.MISSIONARY,
        entityId: 'different-entity-id',
        startDate: '2025-01-01',
      };

      const differentEntity = { ...mockEntity, id: 'different-entity-id' };

      usersRepo.findOne.mockResolvedValue(mockUser);
      rolesRepo.findOne.mockResolvedValue(mockRole);
      entitiesRepo.findOne.mockResolvedValue(differentEntity);

      // No overlap (different entity)
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      uraRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      dataSource.transaction.mockImplementation(async (callback: any) => {
        const manager = {
          create: jest.fn().mockImplementation((_, data) => data),
          save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
        };
        return await callback(manager);
      });

      await expect(service.assign(dto)).resolves.toBeDefined();
    });
  });

  describe('Update assignment overlap validation', () => {
    it('should prevent extending assignment into overlap with another assignment', async () => {
      const assignment = {
        id: 'assignment-1',
        user: mockUser,
        role: mockRole,
        entity: mockEntity,
        start_date: '2025-01-01',
        end_date: '2029-12-31',
      } as any;

      const overlappingAssignment = {
        id: 'assignment-2',
        user: mockUser,
        role: mockRole,
        entity: mockEntity,
        start_date: '2030-01-01',
        end_date: '2034-12-31',
      };

      uraRepo.findOne.mockResolvedValue(assignment);

      // Mock query builder to find overlap when extending to 2031
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(overlappingAssignment),
      };
      uraRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(service.updateAssignment('assignment-1', '2031-12-31')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow extending assignment when no overlap exists', async () => {
      const assignment = {
        id: 'assignment-1',
        user: mockUser,
        role: mockRole,
        entity: mockEntity,
        start_date: '2025-01-01',
        end_date: '2029-12-31',
      } as any;

      uraRepo.findOne.mockResolvedValue(assignment);

      // No overlap found
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      uraRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      uraRepo.save.mockResolvedValue({ ...assignment, end_date: '2031-12-31' });

      const result = await service.updateAssignment('assignment-1', '2031-12-31');

      expect(result.end_date).toBe('2031-12-31');
    });

    it('should allow shortening assignment (no overlap check needed)', async () => {
      const assignment = {
        id: 'assignment-1',
        user: mockUser,
        role: mockRole,
        entity: mockEntity,
        start_date: '2025-01-01',
        end_date: '2029-12-31',
      } as any;

      uraRepo.findOne.mockResolvedValue(assignment);

      // No overlap found (shortening doesn't create overlaps)
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      uraRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      uraRepo.save.mockResolvedValue({ ...assignment, end_date: '2027-12-31' });

      const result = await service.updateAssignment('assignment-1', '2027-12-31');

      expect(result.end_date).toBe('2027-12-31');
    });
  });

  describe('UserRoleAssignment entity - isActive method', () => {
    it('should return true for assignment ending today', () => {
      const today = new Date().toISOString().split('T')[0];
      const assignment = new UserRoleAssignment();
      assignment.end_date = today;

      expect(assignment.isActive()).toBe(true);
    });

    it('should return true for assignment ending tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const assignment = new UserRoleAssignment();
      assignment.end_date = tomorrowStr;

      expect(assignment.isActive()).toBe(true);
    });

    it('should return false for assignment ending yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const assignment = new UserRoleAssignment();
      assignment.end_date = yesterdayStr;

      expect(assignment.isActive()).toBe(false);
    });
  });
});
