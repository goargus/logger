import { Test, TestingModule } from '@nestjs/testing';
import { UnionsController } from './unions.controller';
import { UnionsService } from './unions.service';
import { CreateUnionDto } from './dto/create-union.dto';
import { UpdateUnionDto } from './dto/update-union.dto';

describe('UnionsController', () => {
  let controller: UnionsController;
  let service: UnionsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnionsController],
      providers: [
        {
          provide: UnionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UnionsController>(UnionsController);
    service = module.get<UnionsService>(UnionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a union', async () => {
    const dto: CreateUnionDto = { name: 'Union A' };
    const result = { id: '1', ...dto };
    mockService.create.mockResolvedValue(result);

    const response = await controller.create(dto);
    expect(response).toEqual(result);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should return all unions', async () => {
    const unions = [
      { id: '1', name: 'Union A' },
      { id: '2', name: 'Union B' },
    ];
    mockService.findAll.mockResolvedValue(unions);

    const result = await controller.findAll();
    expect(result).toEqual(unions);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return one union', async () => {
    const union = { id: '1', name: 'Union A' };
    mockService.findOne.mockResolvedValue(union);

    const result = await controller.findOne('1');
    expect(result).toEqual(union);
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('should update a union', async () => {
    const dto: UpdateUnionDto = { name: 'Updated Union' };
    const updatedUnion = { id: '1', ...dto };
    mockService.update.mockResolvedValue(updatedUnion);

    const result = await controller.update('1', dto);
    expect(result).toEqual(updatedUnion);
    expect(service.update).toHaveBeenCalledWith('1', dto);
  });

  it('should delete a union', async () => {
    const deleted = { affected: 1 };
    mockService.remove.mockResolvedValue(deleted);

    const result = await controller.remove('1');
    expect(result).toEqual(deleted);
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
