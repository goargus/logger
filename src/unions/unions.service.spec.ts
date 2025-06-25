import { Test, TestingModule } from '@nestjs/testing';
import { UnionsService } from './unions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Union } from './entities/union.entity';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { CreateUnionDto } from './dto/create-union.dto';
import { UpdateUnionDto } from './dto/update-union.dto';

describe('UnionsService', () => {
  let service: UnionsService;
  let repo: jest.Mocked<Repository<Union>>;

  const mockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnionsService,
        {
          provide: getRepositoryToken(Union),
          useFactory: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UnionsService>(UnionsService);
    repo = module.get(getRepositoryToken(Union));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a union', async () => {
    const dto: CreateUnionDto = { name: 'Union A' };
    const entity = { id: '1', name: dto.name };

    repo.create.mockReturnValue(entity as Union);
    repo.save.mockResolvedValue(entity as Union);

    const result = await service.create(dto);
    expect(result).toEqual(entity);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(entity);
  });

  it('should return all unions', async () => {
    const unions = [{ id: '1', name: 'Union A' }];
    repo.find.mockResolvedValue(unions as Union[]);

    const result = await service.findAll();
    expect(result).toEqual(unions);
    expect(repo.find).toHaveBeenCalled();
  });

  it('should return one union with relations', async () => {
    const union = { id: '1', name: 'Union A', associations: [] };
    repo.findOne.mockResolvedValue(union as unknown as Union);

    const result = await service.findOne('1');
    expect(result).toEqual(union);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
      relations: ['associations'],
    });
  });

  it('should update a union and return the updated entity', async () => {
    const id = '1';
    const dto: UpdateUnionDto = { name: 'Updated Union' };
    const updatedUnion = { id, name: dto.name };

    const updateResult: UpdateResult = {
      affected: 1,
      raw: [],
      generatedMaps: [],
    };
    repo.update.mockResolvedValue(updateResult);
    repo.findOne.mockResolvedValue(updatedUnion as Union);

    const result = await service.update(id, dto);
    expect(repo.update).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(updatedUnion);
  });

  it('should delete a union', async () => {
    const deleteResult: DeleteResult = { affected: 1, raw: [] };
    repo.delete.mockResolvedValue(deleteResult);

    const result = await service.remove('1');
    expect(result).toEqual(deleteResult);
    expect(repo.delete).toHaveBeenCalledWith('1');
  });
});
