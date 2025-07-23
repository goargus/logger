// test/dto/update-activity.dto.spec.ts
import { validate } from 'class-validator';
import { UpdateActivityDto } from '../dto/update-activity.dto';

describe('UpdateActivityDto', () => {
  it('should allow valid partial update', async () => {
    const dto = new UpdateActivityDto();
    dto.description = 'Estudio bíblico con la familia López';
    dto.date = '2025-07-15';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if category_id is not a UUID', async () => {
    const dto = new UpdateActivityDto();
    dto.category_id = '123';

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'category_id')).toBe(true);
  });

  it('should fail if date is invalid', async () => {
    const dto = new UpdateActivityDto();
    dto.date = 'invalid-date';

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'date')).toBe(true);
  });
});
