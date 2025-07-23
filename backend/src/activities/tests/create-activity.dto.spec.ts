import { validate } from 'class-validator';
import { CreateActivityDto } from '../dto/create-activity.dto';

describe('CreateActivityDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new CreateActivityDto();
    dto.category_id = 'd290f1ee-6c54-4b01-90e6-d701748f0851';
    dto.date = '2025-07-21';
    dto.description = 'Visita a la comunidad';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if category_id is missing', async () => {
    const dto = new CreateActivityDto();
    dto.date = '2025-07-21';

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'category_id')).toBe(true);
  });

  it('should fail if date is missing', async () => {
    const dto = new CreateActivityDto();
    dto.category_id = 'd290f1ee-6c54-4b01-90e6-d701748f0851';

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'date')).toBe(true);
  });

  it('should allow optional description', async () => {
    const dto = new CreateActivityDto();
    dto.category_id = 'd290f1ee-6c54-4b01-90e6-d701748f0851';
    dto.date = '2025-07-21';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
