import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsService } from './associations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Association } from './entities/association.entity';
import { Union } from '../unions/entities/union.entity';
import { Repository } from 'typeorm';
import { CreateAssociationDto } from './dto/create-association.dto';
import { UpdateAssociationDto } from './dto/update-association.dto';
import { UpdateResult } from 'typeorm';
import { DeleteResult } from 'typeorm';

describe('AssociationsService', () => {
  let service: AssociationsService;
  let repo: jest.Mocked<Repository<Association>>;

  const mockRepository = () => ({
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
        AssociationsService,
        {
          provide: getRepositoryToken(Association),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AssociationsService>(AssociationsService);
    repo = module.get(getRepositoryToken(Association));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an association', async () => {
    const dto: CreateAssociationDto = { name: 'Assoc A', unionId: '1' };
    const entity = {
      id: '123',
      name: dto.name,
      union: { id: dto.unionId } as Union,
      unionId: dto.unionId,
    } as Association;
    repo.create.mockReturnValue(entity);
    repo.save.mockResolvedValue(entity);

    const result = await service.create(dto);
    expect(result).toEqual(entity);
    expect(repo.create).toHaveBeenCalledWith({
      name: dto.name,
      union: { id: dto.unionId },
    });
    expect(repo.save).toHaveBeenCalledWith(entity);
  });

  it('should find all associations', async () => {
    const entities = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    repo.find.mockResolvedValue(entities as Association[]);

    const result = await service.findAll();
    expect(result).toEqual(entities);
    expect(repo.find).toHaveBeenCalledWith({ relations: ['union'] });
  });

  it('should find one association by id', async () => {
    const id = 'abc';
    const entity = { id, name: 'Assoc A' };
    repo.findOne.mockResolvedValue(entity as Association);

    const result = await service.findOne(id);
    expect(result).toEqual(entity);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id },
      relations: ['union'],
    });
  });

  it('should update an association and return updated one', async () => {
    const id = '1';
    const dto: UpdateAssociationDto = { name: 'Updated Name' };
    const updatedEntity = { id, name: dto.name };

    const mockUpdateResult: UpdateResult = {
      affected: 1,
      raw: [],
      generatedMaps: [],
    };
    repo.update.mockResolvedValue(mockUpdateResult);
    repo.findOne.mockResolvedValue(updatedEntity as Association);

    const result = await service.update(id, dto);
    expect(repo.update).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(updatedEntity);
  });

  it('should remove an association', async () => {
    const mockDeleteResult: DeleteResult = { affected: 1, raw: [] };
    repo.delete.mockResolvedValue(mockDeleteResult);

    const result = await service.remove('1');
    expect(result).toEqual({ affected: 1 });
    expect(repo.delete).toHaveBeenCalledWith('1');
  });
});
