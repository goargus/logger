import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from './admin-users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from './user-status.enum';
import { User } from './user.entity';
import { PermissionsService } from '../auth/permissions/permissions.service';
import { RolesGuard } from '../auth/roles.guard';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let service: jest.Mocked<UsersService>;

  const now = new Date();

  const userMock = {
    id: 'u-1',
    username: 'jdoe',
    email: 'jdoe@example.com',
    status: UserStatus.ACTIVE,
    created_at: now,
    updated_at: now,
    full_name: 'John Doe',
    first_name: 'John',
    family_name: 'Doe',
    role_id: 'r-1',
    entity_id: 'e-1',
    archived_at: null,
  };

  beforeEach(async () => {
    const mockUsersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
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

    controller = module.get<AdminUsersController>(AdminUsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('returns wrapper with message and user', async () => {
      const dto: CreateUserDto = {
        username: 'jdoe',
        email: 'jdoe@example.com',
        role_id: 'r-1',
        entity_id: 'e-1',
        full_name: 'John Doe',
        first_name: 'John',
        family_name: 'Doe',
      };

      service.create.mockResolvedValue(userMock as User);

      const res = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(res).toEqual({
        message: 'User created successfully',
        user: userMock,
      });
    });
  });

  describe('list', () => {
    it('returns all users', async () => {
      const users = [userMock];
      service.findAll.mockResolvedValue(users as User[]);

      const result = await controller.list();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('get', () => {
    it('returns a single user', async () => {
      service.findOne.mockResolvedValue(userMock as User);

      const result = await controller.get('u-1');
      expect(service.findOne).toHaveBeenCalledWith('u-1');
      expect(result).toEqual(userMock);
    });
  });

  describe('update', () => {
    it('returns wrapper with message and user', async () => {
      const dto: UpdateUserDto = { username: 'johnny' };
      const updated = { ...userMock, username: 'johnny' };

      service.update.mockResolvedValue(updated as User);

      const res = await controller.update('u-1', dto);
      expect(service.update).toHaveBeenCalledWith('u-1', dto);
      expect(res).toEqual({
        message: 'User updated successfully',
        user: updated,
      });
    });
  });
});
