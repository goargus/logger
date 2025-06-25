import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsController } from './associations.controller';
import { AssociationsService } from './associations.service';
import { CreateAssociationDto } from './dto/create-association.dto';
import { UpdateAssociationDto } from './dto/update-association.dto';

describe('AssociationsController', () => {
  let controller: AssociationsController;
  let service: AssociationsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssociationsController],
      providers: [
        {
          provide: AssociationsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AssociationsController>(AssociationsController);
    service = module.get<AssociationsService>(AssociationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an association', async () => {
    const dto: CreateAssociationDto = { name: 'New Association', unionId: '1' };
    mockService.create.mockResolvedValue({ id: '123', ...dto });

    const result = await controller.create(dto);
    expect(result).toEqual({ id: '123', ...dto });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should return all associations', async () => {
    const associations = [
      { id: '1', name: 'Assoc A' },
      { id: '2', name: 'Assoc B' },
    ];
    mockService.findAll.mockResolvedValue(associations);

    const result = await controller.findAll();
    expect(result).toEqual(associations);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return a single association', async () => {
    const association = { id: '1', name: 'Assoc A' };
    mockService.findOne.mockResolvedValue(association);

    const result = await controller.findOne('1');
    expect(result).toEqual(association);
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('should update an association', async () => {
    const dto: UpdateAssociationDto = { name: 'Updated Name' };
    const updated = { id: '1', ...dto };
    mockService.update.mockResolvedValue(updated);

    const result = await controller.update('1', dto);
    expect(result).toEqual(updated);
    expect(service.update).toHaveBeenCalledWith('1', dto);
  });

  it('should delete an association', async () => {
    mockService.remove.mockResolvedValue({ deleted: true });

    const result = await controller.remove('1');
    expect(result).toEqual({ deleted: true });
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
