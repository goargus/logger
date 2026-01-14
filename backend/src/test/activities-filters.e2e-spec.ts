import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../app.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Activity } from '../activity/activity.entity';
import { ActivityStatus } from '../activity/activity-status.enum';
import { ActivityType, GrowthDirection } from '../activities-type/activity-type.entity';
import { Entity as OrgEntity, EntityType } from '../entities/entity.entity';
import { Role } from '../roles/role.entity';
import { User } from '../users/user.entity';
import { IdpIdentity } from '../idp-identities/idp-identity.entity';

describe('Activities Filters (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let activityRepo: Repository<Activity>;
  let activityTypeRepo: Repository<ActivityType>;
  let entityRepo: Repository<OrgEntity>;
  let roleRepo: Repository<Role>;
  let userRepo: Repository<User>;
  let idpRepo: Repository<IdpIdentity>;

  const activityIds: string[] = [];
  const activityTypeIds: string[] = [];
  const entityIds: string[] = [];
  const roleIds: string[] = [];
  const userIds: string[] = [];
  const idpIds: string[] = [];
  const subject = `test-sub-${Date.now()}`;
  const issuer = 'test-issuer';
  let type1Id: string;
  let type2Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { sub: subject, iss: issuer };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    activityRepo = moduleFixture.get(getRepositoryToken(Activity));
    activityTypeRepo = moduleFixture.get(getRepositoryToken(ActivityType));
    entityRepo = moduleFixture.get(getRepositoryToken(OrgEntity));
    roleRepo = moduleFixture.get(getRepositoryToken(Role));
    userRepo = moduleFixture.get(getRepositoryToken(User));
    idpRepo = moduleFixture.get(getRepositoryToken(IdpIdentity));

    const entity = await entityRepo.save({
      name: `Filters Entity ${Date.now()}`,
      type: EntityType.FIELD,
      is_active: true,
      term_length_years: 5,
    });
    entityIds.push(entity.id);

    const role = await roleRepo.save({
      name: `Filters Role ${Date.now()}`,
    });
    roleIds.push(role.id);

    const user = await userRepo.save({
      username: `filters_user_${Date.now()}`,
      email: `filters_${Date.now()}@example.com`,
      role,
      entity,
      role_id: role.id,
      entity_id: entity.id,
    });
    userIds.push(user.id);

    const idp = await idpRepo.save({
      user,
      user_id: user.id,
      provider: 'test',
      issuer,
      subject,
      audience: null,
      email: user.email,
      email_verified: true,
      name: user.username,
      last_seen_at: new Date(),
    });
    idpIds.push(idp.id);

    const type1 = await activityTypeRepo.save({
      name: `Type One ${Date.now()}`,
      description: 'Type one for filter tests',
      growth_direction: GrowthDirection.POSITIVE,
      allowed_roles: [],
    });
    type1Id = type1.id;
    activityTypeIds.push(type1.id);

    const type2 = await activityTypeRepo.save({
      name: `Type Two ${Date.now()}`,
      description: 'Type two for filter tests',
      growth_direction: GrowthDirection.POSITIVE,
      allowed_roles: [],
    });
    type2Id = type2.id;
    activityTypeIds.push(type2.id);

    const activities = [
      {
        activityTypeId: type1.id,
        activityDate: '2024-03-10',
        hasExpense: true,
        expenseAmount: '10.00',
      },
      {
        activityTypeId: type1.id,
        activityDate: '2024-03-05',
        hasExpense: false,
        expenseAmount: null,
      },
      {
        activityTypeId: type2.id,
        activityDate: '2024-02-20',
        hasExpense: true,
        expenseAmount: '25.00',
      },
      {
        activityTypeId: type2.id,
        activityDate: '2024-01-15',
        hasExpense: false,
        expenseAmount: null,
      },
      {
        activityTypeId: type2.id,
        activityDate: '2023-12-31',
        hasExpense: true,
        expenseAmount: '5.00',
      },
    ];

    for (const activity of activities) {
      const created = await activityRepo.save({
        ...activity,
        description: 'Seeded activity',
        reportingPeriodId: null,
        userId: user.id,
        createdBy: user.id,
        updatedBy: user.id,
        status: ActivityStatus.ACTIVE,
      });
      activityIds.push(created.id);
    }
  });

  afterAll(async () => {
    await activityRepo.delete(activityIds);
    await idpRepo.delete(idpIds);
    await userRepo.delete(userIds);
    await activityTypeRepo.delete(activityTypeIds);
    await roleRepo.delete(roleIds);
    await entityRepo.delete(entityIds);
    await app.close();
  });

  it('filters by date range only', async () => {
    const response = await request(app.getHttpServer())
      .get('/activities')
      .query({ startDate: '2024-03-01', endDate: '2024-03-31', limit: 50 })
      .expect(200);

    const dates = response.body.items.map((item: any) => item.activityDate);
    expect(dates).toEqual(expect.arrayContaining(['2024-03-10', '2024-03-05']));
    expect(dates).not.toContain('2024-02-20');
    expect(dates).not.toContain('2024-01-15');
  });

  it('combines date, type, and expense filters', async () => {
    const response = await request(app.getHttpServer())
      .get('/activities')
      .query({
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        activityTypeId: type2Id,
        hasExpense: 'true',
        limit: 50,
      })
      .expect(200);

    const items = response.body.items;
    expect(items).toHaveLength(1);
    expect(items[0].activityDate).toBe('2024-02-20');
    expect(items[0].hasExpense).toBe(true);
  });

  it('supports hasExpense=false filters', async () => {
    const response = await request(app.getHttpServer())
      .get('/activities')
      .query({ hasExpense: 'false', limit: 50 })
      .expect(200);

    const dates = response.body.items.map((item: any) => item.activityDate);
    expect(dates).toEqual(expect.arrayContaining(['2024-03-05', '2024-01-15']));
    expect(dates).not.toContain('2024-03-10');
    expect(dates).not.toContain('2024-02-20');
  });

  it('combines activity type and date range without conflicts', async () => {
    const response = await request(app.getHttpServer())
      .get('/activities')
      .query({
        startDate: '2024-03-01',
        endDate: '2024-03-31',
        activityTypeId: type1Id,
        limit: 50,
      })
      .expect(200);

    const dates = response.body.items.map((item: any) => item.activityDate);
    expect(dates).toEqual(expect.arrayContaining(['2024-03-10', '2024-03-05']));
    expect(dates).not.toContain('2024-02-20');
    expect(dates).not.toContain('2024-01-15');
  });
});
