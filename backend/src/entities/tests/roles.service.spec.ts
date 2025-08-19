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
    description: 'Rol administrador',
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
    it('crea un rol cuando el nombre no existe (case-insensitive)', async () => {
      repo.exist?.mockResolvedValue(false);
      repo.create?.mockReturnValue(role);
      repo.save?.mockResolvedValue(role);

      const result = await service.create({ name: 'Admin', description: 'Rol administrador' });
      expect(repo.exist).toHaveBeenCalledWith({
        where: { name: expect.any(Object) },
      });
      expect(repo.create).toHaveBeenCalledWith({
        name: 'Admin',
        description: 'Rol administrador',
      });
      expect(repo.save).toHaveBeenCalledWith(role);
      expect(result).toEqual(role);
    });

    it('lanza 409 si el nombre ya existe (case-insensitive)', async () => {
      repo.exist?.mockResolvedValue(true);
      await expect(service.create({ name: 'ADMIN', description: '' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('lanza 400 si el name viene vacío o espacios', async () => {
      await expect(service.create({ name: '   ', description: '' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('retorna lista de roles', async () => {
      repo.find?.mockResolvedValue([role]);
      const result = await service.findAll();
      expect(repo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toEqual([role]);
    });
  });

  describe('findOne', () => {
    it('retorna rol existente', async () => {
      repo.findOne?.mockResolvedValue(role);
      const result = await service.findOne('uuid-1');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
      expect(result).toEqual(role);
    });

    it('lanza 404 si no existe', async () => {
      repo.findOne?.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza nombre y description (sin duplicar)', async () => {
      repo.findOne?.mockResolvedValue({ ...role });
      repo.exist?.mockResolvedValue(false);
      repo.save?.mockResolvedValue({ ...role, name: 'Supervisor', description: 'Nuevo' });

      const result = await service.update('uuid-1', { name: 'Supervisor', description: 'Nuevo' });
      expect(repo.exist).toHaveBeenCalledWith({
        where: { name: expect.any(Object) },
      });
      expect(result).toMatchObject({ name: 'Supervisor', description: 'Nuevo' });
    });

    it('lanza 409 si intenta cambiar a nombre duplicado (case-insensitive)', async () => {
      repo.findOne?.mockResolvedValue({ ...role });
      repo.exist?.mockResolvedValue(true);

      await expect(service.update('uuid-1', { name: 'ADMIN' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('lanza 400 si manda name vacío en update', async () => {
      repo.findOne?.mockResolvedValue({ ...role });
      await expect(service.update('uuid-1', { name: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('lanza 404 si el rol a actualizar no existe', async () => {
      repo.findOne?.mockResolvedValue(null);
      await expect(service.update('nope', { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('actualiza solo description si no envía name', async () => {
      repo.findOne?.mockResolvedValue({ ...role });
      repo.save?.mockResolvedValue({ ...role, description: 'Solo desc' });

      const result = await service.update('uuid-1', {
        description: 'Solo desc',
        name: '',
      });
      expect(repo.exist).not.toHaveBeenCalled();
      expect(result.description).toBe('Solo desc');
    });
  });

  describe('remove', () => {
    it('elimina existente', async () => {
      const del: DeleteResult = { affected: 1, raw: undefined as unknown };
      repo.delete?.mockResolvedValue(del);

      const result = await service.remove('uuid-1');
      expect(repo.delete).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual({ deleted: true });
    });

    it('lanza 404 si no existe', async () => {
      const del: DeleteResult = { affected: 0, raw: undefined as unknown };
      repo.delete?.mockResolvedValue(del);
      await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
