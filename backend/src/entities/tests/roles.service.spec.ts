import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult, ObjectLiteral } from 'typeorm';
import { RolesService } from '../../roles/roles.service';
import { Role } from '../../roles/role.entity';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

type MockRepo<T extends ObjectLiteral = never> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepo = (): MockRepo<Role> => ({
  exist: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('RolesService', () => {
  let service: RolesService;
  let repo: MockRepo<Role>;

  const now = new Date();
  const role: Role = {
    id: 'uuid-1',
    name: 'Admin',
    description: 'Admin role',
    created_at: now,
    updated_at: now,
    users: [] as never,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, { provide: getRepositoryToken(Role), useValue: createMockRepo() }],
    }).compile();

    service = module.get(RolesService);
    repo = module.get(getRepositoryToken(Role));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a role when the name does not exist (case-insensitive)', async () => {
      repo.exist?.mockResolvedValue(false);
      repo.create?.mockReturnValue(role);
      repo.save?.mockResolvedValue(role);

      const result = await service.create({ name: 'Admin', description: 'Admin role' });
      expect(repo.exist).toHaveBeenCalledWith({
        where: { name: expect.any(Object) },
      });
      expect(repo.create).toHaveBeenCalledWith({
        name: 'Admin',
        description: 'Admin role',
      });
      expect(repo.save).toHaveBeenCalledWith(role);
      expect(result).toEqual(role);
    });

    it('throws 409 if the name already exists (case-insensitive)', async () => {
      repo.exist?.mockResolvedValue(true);
      await expect(service.create({ name: 'ADMIN', description: '' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws 400 if name is empty or only spaces', async () => {
      await expect(service.create({ name: '   ', description: '' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('returns roles list', async () => {
      repo.find?.mockResolvedValue([role]);
      const result = await service.findAll();
      expect(repo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toEqual([role]);
    });
  });

  describe('findOne', () => {
    it('returns existing role', async () => {
      repo.findOne?.mockResolvedValue(role);
      const result = await service.findOne('uuid-1');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
      expect(result).toEqual(role);
    });

    it('throws 404 if not found', async () => {
      repo.findOne?.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates name and description (no duplication)', async () => {
      repo.findOne?.mockResolvedValue({ ...role });
      repo.exist?.mockResolvedValue(false);
      repo.save?.mockResolvedValue({ ...role, name: 'Supervisor', description: 'New' });

      const result = await service.update('uuid-1', { name: 'Supervisor', description: 'New' });
      expect(repo.exist).toHaveBeenCalledWith({
        where: { name: expect.any(Object) },
      });
      expect(result).toMatchObject({ name: 'Supervisor', description: 'New' });
    });

    it('throws 409 if attempting to change to a duplicate name (case-insensitive)', async () => {
      repo.findOne?.mockResolvedValue({ ...role });
      repo.exist?.mockResolvedValue(true);

      await expect(service.update('uuid-1', { name: 'ADMIN' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws 400 if name is empty in update', async () => {
      repo.findOne?.mockResolvedValue({ ...role });
      await expect(service.update('uuid-1', { name: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws 404 if the role to update does not exist', async () => {
      repo.findOne?.mockResolvedValue(null);
      await expect(service.update('nope', { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates only description if name is not provided', async () => {
      repo.findOne?.mockResolvedValue({ ...role });
      repo.save?.mockResolvedValue({ ...role, description: 'Description only' });

      const result = await service.update('uuid-1', {
        description: 'Description only',
        name: '',
      });
      expect(repo.exist).not.toHaveBeenCalled();
      expect(result.description).toBe('Description only');
    });
  });

  describe('remove', () => {
    it('deletes existing', async () => {
      const del: DeleteResult = { affected: 1, raw: undefined as unknown };
      repo.delete?.mockResolvedValue(del);

      const result = await service.remove('uuid-1');
      expect(repo.delete).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual({ deleted: true });
    });

    it('throws 404 if not found', async () => {
      const del: DeleteResult = { affected: 0, raw: undefined as unknown };
      repo.delete?.mockResolvedValue(del);
      await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
