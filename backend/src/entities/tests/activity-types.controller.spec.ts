import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ActivityTypesController } from '../../activities-type/activity-types.controller';
import { ActivityTypesService } from '../../activities-type/activity-types.service';
import { RolesGuard } from '../../auth/roles.guard';
import { IdentityResolutionService } from '../../auth/identity-resolution.service';
import { PermissionsService } from '../../auth/permissions/permissions.service';

const serviceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const identityServiceMock = {
  resolveUserBySubAndIssuer: jest.fn(),
};

describe('ActivityTypesController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityTypesController],
      providers: [
        { provide: ActivityTypesService, useValue: serviceMock },
        { provide: IdentityResolutionService, useValue: identityServiceMock },
        {
          provide: PermissionsService,
          useValue: {
            userHasPermission: jest.fn().mockResolvedValue(true),
          },
        },
        RolesGuard,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /activity-types calls service.findAll', async () => {
    serviceMock.findAll.mockResolvedValueOnce({
      data: ['x'],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    const controller = app.get(ActivityTypesController);
    const result = await controller.list();
    expect(serviceMock.findAll).toHaveBeenCalled();
    expect(result).toEqual({
      data: ['x'],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  it('GET /activity-types/:id calls service.findOne', async () => {
    serviceMock.findOne.mockResolvedValueOnce({ id: 'id-1' });
    const controller = app.get(ActivityTypesController);
    const result = await controller.getOne('id-1');
    expect(serviceMock.findOne).toHaveBeenCalledWith('id-1');
    expect(result).toEqual({ id: 'id-1' });
  });

  it('POST /activity-types (admin) calls service.create', async () => {
    const dto = {
      name: 'Bible Study',
      description: 'Group Bible study',
      role_ids: ['11111111-1111-1111-1111-111111111111'],
    };
    serviceMock.create.mockResolvedValueOnce({ id: 'new-id', ...dto });

    const controller = app.get(ActivityTypesController);
    const result = await controller.create(dto as any);

    expect(serviceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 'new-id', ...dto });
  });

  it('PUT /activity-types/:id (admin) calls service.update', async () => {
    const dto = { name: 'New Name' };
    serviceMock.update.mockResolvedValueOnce({ id: 'id-1', ...dto });

    const controller = app.get(ActivityTypesController);
    const result = await controller.update('id-1', dto as any);

    expect(serviceMock.update).toHaveBeenCalledWith('id-1', dto);
    expect(result).toEqual({ id: 'id-1', ...dto });
  });

  it('DELETE /activity-types/:id (admin) calls service.remove', async () => {
    serviceMock.remove.mockResolvedValueOnce(undefined);

    const controller = app.get(ActivityTypesController);
    const result = await controller.remove('id-1');

    expect(serviceMock.remove).toHaveBeenCalledWith('id-1');
    expect(result).toEqual({ message: 'Activity type deleted.' });
  });
});
