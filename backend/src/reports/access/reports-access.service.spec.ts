import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ReportsAccessService } from './reports-access.service';
import { Entity } from '../../entities/entity.entity';
import { User } from '../../users/user.entity';
import { UserRoleAssignment } from '../../roles/user-role-assignment.entity';

describe('ReportsAccessService - getEntityHierarchy', () => {
  let service: ReportsAccessService;
  let entityRepo: jest.Mocked<Repository<Entity>>;

  beforeEach(() => {
    entityRepo = {
      query: jest.fn(),
    } as unknown as jest.Mocked<Repository<Entity>>;

    service = new ReportsAccessService(
      entityRepo,
      {} as Repository<User>,
      {} as Repository<UserRoleAssignment>,
    );
  });

  it('should return hierarchy ids using a recursive CTE', async () => {
    entityRepo.query.mockResolvedValue([{ id: 'root-1' }, { id: 'child-1' }]);

    const result = await service.getEntityHierarchy('root-1');

    expect(entityRepo.query).toHaveBeenCalled();
    expect(entityRepo.query.mock.calls[0][0]).toContain('WITH RECURSIVE entity_tree AS');
    expect(entityRepo.query.mock.calls[0][0]).not.toContain('WHERE e.is_active = true');
    expect(result).toEqual(['root-1', 'child-1']);
  });

  it('should throw NotFoundException when the root entity does not exist', async () => {
    entityRepo.query.mockResolvedValue([]);

    await expect(service.getEntityHierarchy('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
