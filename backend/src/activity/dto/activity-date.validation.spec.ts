import { validate } from 'class-validator';
import { CreateActivityDto } from './create-activity.dto';
import { UpdateActivityDto } from './update-activity.dto';

describe('Activity date validation', () => {
  const fixedNow = new Date('2026-02-18T12:00:00.000Z');
  const validActivityTypeId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createDtoWithDate = (activityDate: string): CreateActivityDto =>
    Object.assign(new CreateActivityDto(), {
      activityTypeId: validActivityTypeId,
      activityDate,
      hasExpense: false,
    });

  const updateDtoWithDate = (activityDate: string): UpdateActivityDto =>
    Object.assign(new UpdateActivityDto(), {
      activityDate,
    });

  const dtoCases = [
    {
      name: 'CreateActivityDto',
      build: createDtoWithDate,
    },
    {
      name: 'UpdateActivityDto',
      build: updateDtoWithDate,
    },
  ] as const;

  it.each(dtoCases)('$name rejects future dates', async ({ build }) => {
    const dto = build('2026-02-19');
    const errors = await validate(dto);
    const activityDateError = errors.find((error) => error.property === 'activityDate');

    expect(activityDateError).toBeDefined();
    expect(activityDateError?.constraints).toHaveProperty(
      'isNotFutureActivityDate',
      'Activity date cannot be in the future',
    );
  });

  it.each(dtoCases)('$name accepts today', async ({ build }) => {
    const dto = build('2026-02-18');
    const errors = await validate(dto);

    expect(errors.find((error) => error.property === 'activityDate')).toBeUndefined();
  });

  it.each(dtoCases)('$name accepts past dates', async ({ build }) => {
    const dto = build('2026-02-17');
    const errors = await validate(dto);

    expect(errors.find((error) => error.property === 'activityDate')).toBeUndefined();
  });

  it.each(dtoCases)(
    '$name rejects dates that become previous UTC date because local date is tomorrow',
    async ({ build }) => {
      const dto = build('2026-02-19T00:30:00+14:00');
      const errors = await validate(dto);

      expect(errors.find((error) => error.property === 'activityDate')).toBeDefined();
    },
  );

  it.each(dtoCases)(
    '$name accepts dates that become next UTC date because local date is still today',
    async ({ build }) => {
      const dto = build('2026-02-18T23:30:00-12:00');
      const errors = await validate(dto);

      expect(errors.find((error) => error.property === 'activityDate')).toBeUndefined();
    },
  );
});
