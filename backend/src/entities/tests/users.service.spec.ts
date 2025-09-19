import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { UsersService } from '../../users/users.service';
import { User } from '../../users/user.entity';
import { Role } from '../../roles/role.entity';
import { Entity as OrgEntity } from '../../entities/entity.entity';
import { EntitiesService } from '../../entities/entities.service';
import { RolesService } from '../../roles/roles.service';
import { HierarchyValidationService } from '../../entities/hierarchy-validation.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { UserStatus } from '../../users/user-status.enum';
import { EntitiesService } from '../../entities/entities.service';
import { RolesService } from '../../roles/roles.service';

type MockRepo<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function createMockRepo<T extends ObjectLiteral>(): MockRepo<T> {
  return {
    findOne: jest.fn(),
    exist: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };
}

describe('UsersService (create & update)', () => {
  let service: UsersService;
  let usersRepo: MockRepo<User>;
  let rolesRepo: MockRepo<Role>;
  let entitiesRepo: MockRepo<OrgEntity>;
  let entitiesService: jest.Mocked<EntitiesService>;
  let rolesService: jest.Mocked<RolesService>;

  const now = new Date();

  const baseUser: User = {
    id: 'u-1',
    username: 'jdoe',
    email: 'jdoe@example.com',
    status: UserStatus.ACTIVE,
    created_at: now,
    updated_at: now,
    archived_at: null,
    full_name: 'John Doe',
    first_name: 'John',
    family_name: 'Doe',
    role_id: 'r-1',
    entity_id: 'e-1',
    role: { id: 'r-1', name: 'missionary' } as Role,
    entity: { id: 'e-1', name: 'Union A' } as OrgEntity,
  };

  beforeEach(async () => {
    usersRepo = createMockRepo<User>();
    rolesRepo = createMockRepo<Role>();
    entitiesRepo = createMockRepo<OrgEntity>();
    entitiesService = {
      findOne: jest.fn(),
    } as any;
    rolesService = {
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: EntitiesService, useValue: entitiesService },
        { provide: RolesService, useValue: rolesService }
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a user successfully', async () => {
      const dto: CreateUserDto = {
        username: 'jdoe',
        email: 'jdoe@example.com',
        role_id: 'r-1',
        entity_id: 'e-1',
        full_name: 'John Doe',
      };

      usersRepo.findOne?.mockResolvedValue(null);
      rolesService.findOne.mockResolvedValue({ id: 'r-1', name: 'missionary' } as Role);
      entitiesService.findOne.mockResolvedValue({ id: 'e-1', name: 'Union A' } as OrgEntity);

      usersRepo.create?.mockImplementation((data) => ({ ...data }) as User);
      usersRepo.save?.mockImplementation(async (u) => ({
        ...baseUser,
        ...u,
        id: 'u-1',
        created_at: now,
        updated_at: now,
      }));

      const result = await service.create(dto);

      expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(rolesService.findOne).toHaveBeenCalledWith('r-1');
      expect(entitiesService.findOne).toHaveBeenCalledWith('e-1');
      expect(usersRepo.create).toHaveBeenCalled();
      expect(usersRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('u-1');
      expect(result.status).toBe(UserStatus.ACTIVE);
    });

    it('fails if email already exists', async () => {
      const dto: CreateUserDto = {
        username: 'jdoe',
        email: 'taken@example.com',
        role_id: 'r-1',
        entity_id: 'e-1',
      };

      usersRepo.findOne?.mockResolvedValue({ id: 'u-other' } as User);

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException('A user with this email already exists.'),
      );

      expect(rolesService.findOne).not.toHaveBeenCalled();
      expect(entitiesService.findOne).not.toHaveBeenCalled();
    });

    it('fails if role_id does not exist', async () => {
      const dto: CreateUserDto = {
        username: 'jdoe',
        email: 'jdoe@example.com',
        role_id: 'r-missing',
        entity_id: 'e-1',
      };

      usersRepo.findOne?.mockResolvedValue(null);
      rolesService.findOne.mockRejectedValue(new NotFoundException('Role not found'));

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException('Invalid role_id: role does not exist.'),
      );

      expect(entitiesService.findOne).not.toHaveBeenCalled();
    });

    it('fails if entity_id does not exist', async () => {
      const dto: CreateUserDto = {
        username: 'jdoe',
        email: 'jdoe@example.com',
        role_id: 'r-1',
        entity_id: 'e-missing',
      };

      usersRepo.findOne?.mockResolvedValue(null);
      rolesService.findOne.mockResolvedValue({ id: 'r-1' } as Role);
      entitiesService.findOne.mockRejectedValue(new NotFoundException('Entity not found'));

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException('Invalid entity_id: entity does not exist.'),
      );
    });
  });

  describe('update', () => {
    it('updates simple fields (username/email/full_name)', async () => {
      usersRepo.findOne?.mockImplementation(async (opts: any) => {
        if (opts?.where?.id === 'u-1') return { ...baseUser };
        if (opts?.where?.email === 'new@example.com') return null;
        return null;
      });

      usersRepo.save?.mockImplementation(async (u) => ({
        ...baseUser,
        ...u,
        updated_at: now,
      }));

      const dto: UpdateUserDto = {
        username: 'johnny',
        email: 'new@example.com',
        full_name: 'Johnny Doe',
      };

      const updated = await service.update('u-1', dto);
      expect(updated.username).toBe('johnny');
      expect(updated.email).toBe('new@example.com');
      expect(updated.full_name).toBe('Johnny Doe');
    });

    it('fails if new email belongs to another user', async () => {
      usersRepo.findOne?.mockImplementation(async (opts: any) => {
        if (opts?.where?.id === 'u-1') return { ...baseUser };
        if (opts?.where?.email === 'taken@example.com') return { id: 'u-2' } as User;
        return null;
      });

      const dto: UpdateUserDto = { email: 'taken@example.com' };

      await expect(service.update('u-1', dto)).rejects.toThrow(
        new BadRequestException('Another user already uses this email.'),
      );
    });

    it('updates role_id if the role exists', async () => {
      usersRepo.findOne?.mockResolvedValue({ ...baseUser });
      rolesService.findOne.mockResolvedValue({ id: 'r-2', name: 'pastor' } as Role);
      usersRepo.save?.mockImplementation(async (u) => ({ ...baseUser, ...u }));

      const dto: UpdateUserDto = { role_id: 'r-2' };

      const updated = await service.update('u-1', dto);
      expect(rolesService.findOne).toHaveBeenCalledWith('r-2');
      expect(updated.role_id).toBe('r-2');
    });

    it('fails to change role_id if role does not exist', async () => {
      usersRepo.findOne?.mockResolvedValue({ ...baseUser });
      rolesService.findOne.mockRejectedValue(new NotFoundException('Role not found'));

      const dto: UpdateUserDto = { role_id: 'r-missing' };

      await expect(service.update('u-1', dto)).rejects.toThrow(
        new BadRequestException('Invalid role_id: role does not exist.'),
      );
    });

    it('updates entity_id if the entity exists', async () => {
      usersRepo.findOne?.mockResolvedValue({ ...baseUser });
      entitiesService.findOne.mockResolvedValue({ id: 'e-2' } as OrgEntity);
      usersRepo.save?.mockImplementation(async (u) => ({ ...baseUser, ...u }));

      const dto: UpdateUserDto = { entity_id: 'e-2' };

      const updated = await service.update('u-1', dto);
      expect(entitiesService.findOne).toHaveBeenCalledWith('e-2');
      expect(updated.entity_id).toBe('e-2');
    });

    it('fails to change entity_id if entity does not exist', async () => {
      usersRepo.findOne?.mockResolvedValue({ ...baseUser });
      entitiesService.findOne.mockRejectedValue(new NotFoundException('Entity not found'));

      const dto: UpdateUserDto = { entity_id: 'e-missing' };

      await expect(service.update('u-1', dto)).rejects.toThrow(
        new BadRequestException('Invalid entity_id: entity does not exist.'),
      );
    });

    it('blocks changes on an archived user (role/entity/reactivation)', async () => {
      const archivedUser: User = {
        ...baseUser,
        status: UserStatus.ARCHIVED,
        archived_at: now,
      };

      usersRepo.findOne?.mockResolvedValue(archivedUser);

      const dto: UpdateUserDto = { role_id: 'r-2' };

      await expect(service.update('u-1', dto)).rejects.toThrow(
        new ForbiddenException(
          'Archived users cannot be assigned new roles/entities or reactivated here.',
        ),
      );
    });

    it('throws NotFound if the user does not exist', async () => {
      usersRepo.findOne?.mockResolvedValue(null);

      await expect(service.update('nope', {})).rejects.toThrow(
        new NotFoundException('User not found.'),
      );
    });
  });
});
