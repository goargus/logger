import { Activity } from '../entities/activity.entity';
import { User } from '../../src/users/entities/user.entity';
import { Category } from '../../src/categories/entities/category.entity';

describe('Activity Entity', () => {
  it('should create an activity instance with default values', () => {
    const activity = new Activity();
    activity.id = 'uuid';
    activity.date = '2025-07-21';
    activity.description = 'Reunión de oración';
    activity.is_locked = false;
    activity.category = new Category();
    activity.user = new User();

    expect(activity.date).toBe('2025-07-21');
    expect(activity.description).toBe('Reunión de oración');
    expect(activity.is_locked).toBe(false);
  });
});
