import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from '../../users/admin-users.controller';
import { UsersService } from '../../users/users.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { UserStatus } from '../../users/user-status.enum';
import { User } from '../../users/user.entity';
import { PermissionsService } from '../../auth/permissions/permissions.service';
import { RolesGuard } from '../../auth/roles.guard';

describe('AdminUsersController (create & update)', () => {
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
    archived_at: null,
    full_name: 'John Doe',
    first_name: 'John',
    family_name: 'Doe',
    role_id: 'r-1',
    entity_id: 'e-1',
    role: { id: 'r-1', name: 'missionary' },
    entity: { id: 'e-1', name: 'Union A' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
          },
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
    service = module.get(UsersService) as jest.Mocked<UsersService>;

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('returns wrapper with message and user', async () => {
      const dto: CreateUserDto = {
        username: 'jdoe',
        email: 'jdoe@example.com',
        role_id: 'r-1',
        entity_id: 'e-1',
        full_name: 'John Doe',
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
