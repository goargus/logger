import { Test, TestingModule } from '@nestjs/testing';
import { ActivityController } from '../activity.controller';
import { ActivityService } from '../activity.service';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { UpdateActivityDto } from '../dto/update-activity.dto';

describe('ActivityController', () => {
  let controller: ActivityController;
  let service: jest.Mocked<ActivityService>;

  const mockUser = { id: 'user-123' } as never;

  const mockActivity = {
    id: 'a1',
    date: '2025-07-21',
    description: 'Actividad prueba',
    is_locked: false,
    created_at: new Date(),
    updated_at: new Date(),
    user: mockUser,
    category: { id: 'cat-1', name: 'Estudio' },
  };

  const mockActivityService = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
      providers: [
        {
          provide: ActivityService,
          useFactory: mockActivityService,
        },
      ],
    }).compile();

    controller = module.get<ActivityController>(ActivityController);
    service = module.get(ActivityService);
  });

  describe('create()', () => {
    it('should call service.create with DTO and user', async () => {
      const dto: CreateActivityDto = {
        category_id: 'cat-1',
        date: '2025-07-21',
        description: 'Visita',
      };

      service.create.mockResolvedValue(mockActivity);

      const result = await controller.create(dto, mockUser);
      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockActivity);
    });
  });

  describe('findAll()', () => {
    it('should call service.findAll with filters and user', async () => {
      const query = { category_id: 'cat-1', start: '2025-07-01', end: '2025-07-31' };
      service.findAll.mockResolvedValue([mockActivity]);

      const result = await controller.findAll(query.category_id, query.start, query.end, mockUser);
      expect(service.findAll).toHaveBeenCalledWith(mockUser, query);
      expect(result).toEqual([mockActivity]);
    });
  });

  describe('update()', () => {
    it('should call service.update with id, dto and user', async () => {
      const updateDto: UpdateActivityDto = { description: 'Actualizado' };
      service.update.mockResolvedValue({ ...mockActivity, description: 'Actualizado' });

      const result = await controller.update('a1', updateDto, mockUser);
      expect(service.update).toHaveBeenCalledWith('a1', updateDto, mockUser);
      expect(result.description).toBe('Actualizado');
    });
  });

  describe('remove()', () => {
    it('should call service.remove with id and user', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove('a1', mockUser);
      expect(service.remove).toHaveBeenCalledWith('a1', mockUser);
      expect(result).toBeUndefined();
    });
  });
});
