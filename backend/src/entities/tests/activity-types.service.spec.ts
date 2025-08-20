import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, In, ObjectLiteral } from 'typeorm';

import { ActivityTypesService } from '../../activities-type/activity-types.service';
import { ActivityType } from '../../activities-type/activity-type.entity';
import { Role } from '../../roles/role.entity';

class UsagePolicyStub {
  isInUse = jest.fn<Promise<boolean>, [string]>();
}

function createMockRepo<T extends ObjectLiteral>() {
  return {
    find: jest.fn<Promise<T[]>, any>(),
    findOne: jest.fn<Promise<T | null>, any>(),
    findBy: jest.fn<Promise<T[]>, any>(),
    save: jest.fn<Promise<T>, any>(),
    create: jest.fn<T, any>(),
    remove: jest.fn<Promise<T>, any>(),
    count: jest.fn<Promise<number>, any>(),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('ActivityTypesService', () => {
  let service: ActivityTypesService;
  let activityTypeRepo: jest.Mocked<Repository<ActivityType>>;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let usagePolicy: UsagePolicyStub;

  const roleMissionary: Role = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'missionary',
    description: 'Missionary role',
    users: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const rolePastor: Role = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'pastor',
    description: 'Pastor role',
    users: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const atype: ActivityType = {
    id: 'aaaaaaa0-0000-0000-0000-000000000000',
    name: 'Bible Study',
    description: 'Group Bible study',
    allowed_roles: [roleMissionary],
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    activityTypeRepo = createMockRepo<ActivityType>();
    roleRepo = createMockRepo<Role>();
    usagePolicy = new UsagePolicyStub();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityTypesService,
        { provide: getRepositoryToken(ActivityType), useValue: activityTypeRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: 'ACTIVITY_TYPE_USAGE_POLICY' as any, useValue: usagePolicy },
      ],
    })

      .compile();

    service = module.get(ActivityTypesService);

    usagePolicy.isInUse.mockResolvedValue(false);
  });

  describe('create', () => {
    it('creates an activity type when name is unique and roles exist', async () => {
      activityTypeRepo.findOne.mockResolvedValue(null);
      roleRepo.find.mockResolvedValue([roleMissionary, rolePastor]);

      const createdObj = { ...atype, id: 'new-id', allowed_roles: [roleMissionary, rolePastor] };
      activityTypeRepo.create.mockReturnValue(createdObj as any);
      activityTypeRepo.save.mockResolvedValue(createdObj as any);

      const dto = {
        name: 'Bible Study',
        description: 'Group Bible study',
        role_ids: [roleMissionary.id, rolePastor.id],
      };

      const result = await service.create(dto as any);
      expect(activityTypeRepo.findOne).toHaveBeenCalledWith({ where: { name: dto.name } });
      expect(roleRepo.find).toHaveBeenCalledWith({ where: { id: In(dto.role_ids) } });
      expect(activityTypeRepo.create).toHaveBeenCalledWith({
        name: dto.name,
        description: dto.description,
        allowed_roles: [roleMissionary, rolePastor],
      });
      expect(activityTypeRepo.save).toHaveBeenCalledWith(createdObj);
      expect(result).toEqual(createdObj);
    });

    it('throws if name already exists', async () => {
      activityTypeRepo.findOne.mockResolvedValue(atype);
      const dto = {
        name: atype.name,
        description: 'anything',
        role_ids: [roleMissionary.id],
      };
      await expect(service.create(dto as any)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws if one or more role_ids do not exist', async () => {
      activityTypeRepo.findOne.mockResolvedValue(null);
      roleRepo.find.mockResolvedValue([roleMissionary]);
      const dto = {
        name: 'New Type',
        description: 'Desc',
        role_ids: [roleMissionary.id, rolePastor.id],
      };
      await expect(service.create(dto as any)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns all activity types', async () => {
      activityTypeRepo.find.mockResolvedValue([atype]);
      const result = await service.findAll();
      expect(activityTypeRepo.find).toHaveBeenCalled();
      expect(result).toEqual([atype]);
    });
  });

  describe('findOne', () => {
    it('returns the item if it exists', async () => {
      activityTypeRepo.findOne.mockResolvedValue(atype);
      const result = await service.findOne(atype.id);
      expect(result).toBe(atype);
    });

    it('throws NotFound if it does not exist', async () => {
      activityTypeRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates name/description/roles when valid', async () => {
      const existing = { ...atype };
      activityTypeRepo.findOne.mockResolvedValueOnce(existing);
      activityTypeRepo.findOne.mockResolvedValueOnce(null);
      roleRepo.find.mockResolvedValue([rolePastor]);

      const dto = {
        name: 'New Name',
        description: 'New Desc',
        role_ids: [rolePastor.id],
      };

      const saved = { ...existing, ...dto, allowed_roles: [rolePastor] };
      activityTypeRepo.save.mockResolvedValue(saved as any);

      const result = await service.update(existing.id, dto as any);

      expect(roleRepo.find).toHaveBeenCalledWith({ where: { id: In(dto.role_ids) } });
      expect(activityTypeRepo.save).toHaveBeenCalled();
      expect(result).toEqual(saved);
    });

    it('throws BadRequest if new name collides with another record', async () => {
      activityTypeRepo.findOne.mockResolvedValueOnce({ ...atype });
      activityTypeRepo.findOne.mockResolvedValueOnce({ ...atype, id: 'other-id' });

      await expect(service.update(atype.id, { name: 'Bible Study' } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequest if description becomes empty', async () => {
      activityTypeRepo.findOne.mockResolvedValue({ ...atype });
      await expect(service.update(atype.id, { description: '  ' } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('throws BadRequest if usagePolicy reports "in use"', async () => {
      usagePolicy.isInUse.mockResolvedValue(true);
      await expect(service.remove(atype.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(usagePolicy.isInUse).toHaveBeenCalledWith(atype.id);
    });

    it('removes the entity when not in use', async () => {
      usagePolicy.isInUse.mockResolvedValue(false);
      activityTypeRepo.findOne.mockResolvedValue({ ...atype });

      await service.remove(atype.id);
      expect(activityTypeRepo.remove).toHaveBeenCalled();
    });
  });
});
