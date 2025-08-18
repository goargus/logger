import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from '../../roles/roles.controller';
import { RolesService } from '../../roles/roles.service';
import { Role } from '../../roles/role.entity';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const now = new Date();
  const role: Role = {
    id: 'uuid-1',
    name: 'Admin',
    description: 'Rol administrador',
    created_at: now,
    updated_at: now,
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: mockService }],
    }).compile();

    controller = module.get(RolesController);
    service = module.get(RolesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('create delega al service', async () => {
    mockService.create.mockResolvedValue(role);
    const result = await controller.create({ name: 'Admin', description: 'Rol administrador' });
    expect(service.create).toHaveBeenCalledWith({
      name: 'Admin',
      description: 'Rol administrador',
    });
    expect(result).toEqual(role);
  });

  it('findAll delega al service', async () => {
    mockService.findAll.mockResolvedValue([role]);
    const result = await controller.findAll();
    expect(result).toEqual([role]);
  });

  it('findOne delega al service', async () => {
    mockService.findOne.mockResolvedValue(role);
    const result = await controller.findOne('uuid-1');
    expect(service.findOne).toHaveBeenCalledWith('uuid-1');
    expect(result).toEqual(role);
  });

  it('update delega al service', async () => {
    const updated = { ...role, name: 'Supervisor' };
    mockService.update.mockResolvedValue(updated);
    const result = await controller.update('uuid-1', { name: 'Supervisor' });
    expect(service.update).toHaveBeenCalledWith('uuid-1', { name: 'Supervisor' });
    expect(result).toEqual(updated);
  });

  it('remove delega al service', async () => {
    mockService.remove.mockResolvedValue({ deleted: true });
    const result = await controller.remove('uuid-1');
    expect(service.remove).toHaveBeenCalledWith('uuid-1');
    expect(result).toEqual({ deleted: true });
  });
});
