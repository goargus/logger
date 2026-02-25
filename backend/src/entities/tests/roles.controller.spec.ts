import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from '../../roles/roles.controller';
import { RolesService } from '../../roles/roles.service';
import { RoleAssignmentService } from '../../roles/role-assignment.service';
import { CreateRoleDto } from '../../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../../roles/dto/update-role.dto';
import { AssignRoleDto } from '../../roles/dto/assign-role.dto';
import { RemoveRoleDto } from '../../roles/dto/remove-role.dto';
import { PermissionsService } from '../../auth/permissions/permissions.service';
import { RolesGuard } from '../../auth/roles.guard';

describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: jest.Mocked<RolesService>;
  let roleAssignmentService: jest.Mocked<RoleAssignmentService>;

  const mockRolesService: jest.Mocked<RolesService> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as any;

  const mockRoleAssignmentService: jest.Mocked<RoleAssignmentService> = {
    assign: jest.fn(),
    remove: jest.fn(),
    listUsersByRole: jest.fn(),
    listUsersByEntity: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        { provide: RolesService, useValue: mockRolesService },
        { provide: RoleAssignmentService, useValue: mockRoleAssignmentService },
        {
          provide: PermissionsService,
          useValue: {
            userHasPermission: jest.fn().mockResolvedValue(true),
          },
        },
        RolesGuard,
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    rolesService = module.get(RolesService);
    roleAssignmentService = module.get(RoleAssignmentService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create -> should call service and return created role', async () => {
    const dto: CreateRoleDto = { name: 'PASTOR', description: 'desc' } as any;
    const created = { id: 'uuid-1', ...dto };
    rolesService.create.mockResolvedValue(created as any);

    const res = await controller.create(dto);
    expect(rolesService.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual(created);
  });

  it('findAll -> should return list', async () => {
    const payload = {
      data: [{ id: 'uuid-1', name: 'PASTOR' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    rolesService.findAll.mockResolvedValue(payload as any);

    const res = await controller.findAll({} as any);
    expect(rolesService.findAll).toHaveBeenCalled();
    expect(res).toEqual(payload);
  });

  it('getRoleById -> should return one', async () => {
    const one = { id: 'uuid-1', name: 'PASTOR' };
    rolesService.findOne.mockResolvedValue(one as any);

    const res = await controller.getRoleById('uuid-1');
    expect(rolesService.findOne).toHaveBeenCalledWith('uuid-1');
    expect(res).toEqual(one);
  });

  it('update -> should call service and return updated', async () => {
    const dto: UpdateRoleDto = { description: 'updated' } as any;
    const updated = { id: 'uuid-1', name: 'PASTOR', description: 'updated' };
    rolesService.update.mockResolvedValue(updated as any);

    const res = await controller.update('uuid-1', dto);
    expect(rolesService.update).toHaveBeenCalledWith('uuid-1', dto);
    expect(res).toEqual(updated);
  });

  it('remove -> should call service', async () => {
    rolesService.remove.mockResolvedValue({ deleted: true } as any);
    const res = await controller.remove('uuid-1');
    expect(rolesService.remove).toHaveBeenCalledWith('uuid-1');
    expect(res).toEqual({ deleted: true });
  });

  it('usersByRole -> should return users list', async () => {
    const users = [{ id: 'u1' }, { id: 'u2' }];
    roleAssignmentService.listUsersByRole.mockResolvedValue(users as any);

    const res = await controller.usersByRole('PASTOR');
    expect(roleAssignmentService.listUsersByRole).toHaveBeenCalledWith('PASTOR');
    expect(res).toEqual(users);
  });

  it('usersByEntity -> should return users with roles for entity', async () => {
    const entityId = '11111111-1111-1111-1111-111111111111';
    const data = [{ user: { id: 'u1' }, roles: ['PASTOR'] }];
    roleAssignmentService.listUsersByEntity.mockResolvedValue(data as any);

    const res = await controller.usersByEntity(entityId);
    expect(roleAssignmentService.listUsersByEntity).toHaveBeenCalledWith(entityId);
    expect(res).toEqual(data);
  });

  it('assign -> should create assignment', async () => {
    const dto: AssignRoleDto = {
      userId: '22222222-2222-2222-2222-222222222222',
      roleId: '44444444-4444-4444-4444-444444444444',
      entityId: '33333333-3333-3333-3333-333333333333',
    };
    const created = { id: 'assign-1' };
    roleAssignmentService.assign.mockResolvedValue(created as any);

    const res = await controller.assign(dto);
    expect(roleAssignmentService.assign).toHaveBeenCalledWith(dto);
    expect(res).toEqual(created);
  });

  it('removeAssignment -> should delete assignment', async () => {
    const dto: RemoveRoleDto = { assignmentId: 'assign-1' };
    const out = { deleted: true };
    roleAssignmentService.remove.mockResolvedValue(out as any);

    const res = await controller.removeAssignment(dto);
    expect(roleAssignmentService.remove).toHaveBeenCalledWith(dto);
    expect(res).toEqual(out);
  });
});
