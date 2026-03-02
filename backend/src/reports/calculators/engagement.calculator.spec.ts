import { EngagementCalculator } from './engagement.calculator';
import { EngagementResponse } from '../dto/report-responses.dto';

describe('EngagementCalculator', () => {
  let calculator: EngagementCalculator;
  let userRepo: any;

  const createActivity = (userId: string, date: string) => ({ userId, activityDate: date }) as any;

  const createUser = (id: string, name: string, entityName: string, roleName: string | null) => ({
    id,
    full_name: name,
    username: name.toLowerCase().replace(' ', '.'),
    entity_id: 'entity-1',
    entity: { name: entityName },
    role: roleName ? { name: roleName } : null,
    status: 'active',
  });

  beforeEach(() => {
    userRepo = { find: jest.fn() };
    calculator = new EngagementCalculator(userRepo);
  });

  it('should return unified user list with engagement signals', async () => {
    const users = [
      createUser('u1', 'Alice', 'Field A', 'Pastor'),
      createUser('u2', 'Bob', 'Field A', 'Missionary'),
    ];
    userRepo.find.mockResolvedValue(users);

    const currentActivities = [
      createActivity('u1', '2026-02-10'),
      createActivity('u1', '2026-02-15'),
    ];
    const previousActivities = [createActivity('u1', '2026-01-10')];

    const result = await calculator.calculate(currentActivities, previousActivities, ['entity-1']);

    expect(result.users).toHaveLength(2);

    const alice = result.users.find((u) => u.userId === 'u1')!;
    expect(alice.activityCount).toBe(2);
    expect(alice.lastActivityDate).toBe('2026-02-15');
    expect(alice.trend).toBe(100); // 1 -> 2 = +100%

    const bob = result.users.find((u) => u.userId === 'u2')!;
    expect(bob.activityCount).toBe(0);
    expect(bob.lastActivityDate).toBeNull();
    expect(bob.trend).toBeNull(); // 0 -> 0, no baseline

    expect(result.summary.totalUsers).toBe(2);
    expect(result.summary.activeUsers).toBe(1);
    expect(result.summary.inactiveUsers).toBe(1);
    expect(result.summary.avgActivitiesPerUser).toBe(1); // 2 activities / 2 users
  });

  it('should set trend to null when previous count is 0 and current > 0', async () => {
    const users = [createUser('u1', 'Alice', 'Field A', 'Pastor')];
    userRepo.find.mockResolvedValue(users);

    const currentActivities = [createActivity('u1', '2026-02-10')];
    const previousActivities: any[] = [];

    const result = await calculator.calculate(currentActivities, previousActivities, ['entity-1']);

    expect(result.users[0].trend).toBeNull();
  });

  it('should calculate negative trend', async () => {
    const users = [createUser('u1', 'Alice', 'Field A', 'Pastor')];
    userRepo.find.mockResolvedValue(users);

    const currentActivities = [createActivity('u1', '2026-02-10')];
    const previousActivities = [
      createActivity('u1', '2026-01-10'),
      createActivity('u1', '2026-01-11'),
      createActivity('u1', '2026-01-12'),
      createActivity('u1', '2026-01-13'),
    ];

    const result = await calculator.calculate(currentActivities, previousActivities, ['entity-1']);

    expect(result.users[0].trend).toBe(-75); // 4 -> 1 = -75%
  });

  it('should include roles and entity in user items', async () => {
    const users = [createUser('u1', 'Alice', 'Field A', 'Pastor')];
    userRepo.find.mockResolvedValue(users);

    const result = await calculator.calculate([], [], ['entity-1']);

    expect(result.users[0].roles).toEqual(['Pastor']);
    expect(result.users[0].entity).toBe('Field A');
  });

  it('should handle user with no role', async () => {
    const users = [createUser('u1', 'Alice', 'Field A', null)];
    userRepo.find.mockResolvedValue(users);

    const result = await calculator.calculate([], [], ['entity-1']);

    expect(result.users[0].roles).toEqual([]);
  });
});
