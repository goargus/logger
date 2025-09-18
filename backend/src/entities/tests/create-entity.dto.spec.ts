import { validate } from 'class-validator';
import { CreateEntityDto } from '../dto/create-entity.dto';
import { EntityType } from '../entity.entity';

describe('CreateEntityDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new CreateEntityDto();
    dto.name = 'Union Central';
    dto.type = EntityType.UNION;
    dto.parentId = undefined;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if name is missing', async () => {
    const dto = new CreateEntityDto();
    dto.type = EntityType.UNION;
    dto.parentId = undefined;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail if type is invalid', async () => {
    const dto = Object.assign(new CreateEntityDto(), {
      name: 'Union Central',
      type: 'INVALID',
      parentId: undefined,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });

  it('should allow optional fields: code and location', async () => {
    const dto = new CreateEntityDto();
    dto.name = 'Union Central';
    dto.type = EntityType.UNION;
    dto.parentId = undefined;
    dto.code = 'U001';
    dto.location = 'Honduras';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
