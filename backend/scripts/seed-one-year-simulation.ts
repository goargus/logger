import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/user.entity';
import { Activity } from '../src/activity/activity.entity';
import { ActivityType } from '../src/activities-type/activity-type.entity';
import { ActivityStatus } from '../src/activity/activity-status.enum';
import { Role } from '../src/roles/role.entity';

const MISSIONARY_ACTIVITY_TYPES = [
  'Visitas a miembros',
  'Visitas a interesados',
  'Visita a infantes',
  'Estudios bíblicos',
  'Cultos en hogares',
  'Conversaciones oportunas',
  'Contactos Misioneros',
  'Predicaciones',
  'Dirección de programas',
  'Seminarios',
  'Reuniones de comité',
  'Reunión de iglesia',
  'Viaje',
  'Oficina',
  'Días libres',
];

interface WorkerProfile {
  email: string;
  minActivitiesPerWeek: number;
  maxActivitiesPerWeek: number;
  qualityLevel: string;
}

const WORKER_PROFILES: WorkerProfile[] = [
  {
    email: 'obrero.copan@uhn.test',
    minActivitiesPerWeek: 8,
    maxActivitiesPerWeek: 12,
    qualityLevel: 'excellent',
  },
  {
    email: 'obrero.tegucigalpa@uhn.test',
    minActivitiesPerWeek: 5,
    maxActivitiesPerWeek: 7,
    qualityLevel: 'good',
  },
  {
    email: 'obrero.sps@uhn.test',
    minActivitiesPerWeek: 2,
    maxActivitiesPerWeek: 4,
    qualityLevel: 'poor',
  },
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function generateActivitiesForYear(
  userId: string,
  profile: WorkerProfile,
  activityTypes: ActivityType[],
  startDate: Date,
): Partial<Activity>[] {
  const activities: Partial<Activity>[] = [];
  const currentDate = new Date(startDate);
  const endDate = addDays(startDate, 365);

  const highFrequencyActivities = [
    'Visitas a miembros',
    'Visitas a interesados',
    'Estudios bíblicos',
    'Contactos Misioneros',
  ];

  const mediumFrequencyActivities = [
    'Cultos en hogares',
    'Conversaciones oportunas',
    'Predicaciones',
    'Reunión de iglesia',
  ];

  const lowFrequencyActivities = ['Seminarios', 'Reuniones de comité', 'Dirección de programas'];

  const routineActivities = ['Oficina', 'Viaje', 'Días libres'];

  while (currentDate < endDate) {
    const weekStart = new Date(currentDate);

    const activitiesThisWeek = getRandomInt(
      profile.minActivitiesPerWeek,
      profile.maxActivitiesPerWeek,
    );

    const daysInWeek = 7;
    const activitiesPerDay: number[] = new Array(daysInWeek).fill(0);

    for (let i = 0; i < activitiesThisWeek; i++) {
      const dayIndex = getRandomInt(0, daysInWeek - 1);
      activitiesPerDay[dayIndex]++;
    }

    for (let dayOffset = 0; dayOffset < daysInWeek && currentDate < endDate; dayOffset++) {
      const isWeekendDay = isWeekend(currentDate);
      const activitiesForToday = activitiesPerDay[dayOffset];

      for (let activityNum = 0; activityNum < activitiesForToday; activityNum++) {
        let selectedActivityType: ActivityType;

        if (isWeekendDay) {
          const weekendTypes = activityTypes.filter((at) =>
            ['Reunión de iglesia', 'Predicaciones', 'Cultos en hogares'].includes(at.name),
          );
          selectedActivityType =
            weekendTypes.length > 0
              ? getRandomElement(weekendTypes)
              : getRandomElement(activityTypes);
        } else {
          const rand = Math.random();
          let selectedName: string;

          if (profile.qualityLevel === 'excellent') {
            if (rand < 0.5) {
              selectedName = getRandomElement(highFrequencyActivities);
            } else if (rand < 0.8) {
              selectedName = getRandomElement(mediumFrequencyActivities);
            } else {
              selectedName = getRandomElement([...lowFrequencyActivities, ...routineActivities]);
            }
          } else if (profile.qualityLevel === 'good') {
            if (rand < 0.4) {
              selectedName = getRandomElement(highFrequencyActivities);
            } else if (rand < 0.7) {
              selectedName = getRandomElement(mediumFrequencyActivities);
            } else {
              selectedName = getRandomElement([...lowFrequencyActivities, ...routineActivities]);
            }
          } else {
            if (rand < 0.3) {
              selectedName = getRandomElement(highFrequencyActivities);
            } else if (rand < 0.5) {
              selectedName = getRandomElement(mediumFrequencyActivities);
            } else {
              selectedName = getRandomElement([...routineActivities, 'Días libres']);
            }
          }

          const found = activityTypes.find((at) => at.name === selectedName);
          selectedActivityType = found || getRandomElement(activityTypes);
        }

        const descriptions: Record<string, string[]> = {
          'Visitas a miembros': [
            'Visita a la familia Hernández',
            'Visita a hermanos mayores',
            'Visita de seguimiento a nuevos miembros',
            'Visita pastoral a familia en crisis',
          ],
          'Visitas a interesados': [
            'Visita a familia interesada del barrio',
            'Seguimiento de contacto evangelístico',
            'Visita a persona referida por miembro',
          ],
          'Estudios bíblicos': [
            'Estudio bíblico con familia',
            'Estudio de Daniel con interesado',
            'Estudio bíblico grupal',
            'Estudio sobre el Santuario',
          ],
          Predicaciones: [
            'Sermón del sábado',
            'Predicación en culto joven',
            'Mensaje especial',
            'Serie evangelística',
          ],
          'Reunión de iglesia': [
            'Culto divino del sábado',
            'Reunión de oración',
            'Culto de jóvenes',
          ],
        };

        const activityDescriptions = descriptions[selectedActivityType.name] || [
          `${selectedActivityType.description}`,
          `Actividad de ${selectedActivityType.name.toLowerCase()}`,
        ];

        const description = getRandomElement(activityDescriptions);

        const hasExpense = Math.random() < 0.1;
        const expenseAmount = hasExpense ? (Math.random() * 100 + 20).toFixed(2) : null;

        activities.push({
          activityTypeId: selectedActivityType.id,
          activityDate: formatDate(currentDate),
          description,
          hasExpense,
          expenseAmount,
          userId,
          createdBy: userId,
          updatedBy: userId,
          status: ActivityStatus.ACTIVE,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return activities;
}

async function run() {
  console.log('Starting one-year simulation seed...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const userRepo = dataSource.getRepository(User);
  const activityRepo = dataSource.getRepository(Activity);
  const activityTypeRepo = dataSource.getRepository(ActivityType);
  const roleRepo = dataSource.getRepository(Role);

  try {
    const missionaryRole = await roleRepo.findOne({ where: { name: 'Missionary' } });
    if (!missionaryRole) {
      throw new Error('Missionary role not found. Please run seed-roles-and-activities.ts first.');
    }

    const allActivityTypes = await activityTypeRepo.find({ relations: ['allowed_roles'] });
    const missionaryActivityTypes = allActivityTypes.filter((at) =>
      at.allowed_roles.some((role) => role.name === 'Missionary'),
    );

    if (missionaryActivityTypes.length === 0) {
      throw new Error(
        'No activity types found for Missionary role. Please run seed-roles-and-activities.ts first.',
      );
    }

    console.log(`Found ${missionaryActivityTypes.length} activity types for missionaries\n`);

    const workers: { user: User; profile: WorkerProfile }[] = [];

    for (const profile of WORKER_PROFILES) {
      const worker = await userRepo.findOne({
        where: { email: profile.email },
        relations: ['entity', 'role'],
      });

      if (!worker) {
        throw new Error(
          `Worker not found: ${profile.email}. Please run 'npm run seed:honduras-users' first.`,
        );
      }

      workers.push({ user: worker, profile });
      console.log(`Found worker: ${worker.full_name} (${profile.qualityLevel} simulation)`);
    }

    console.log('');

    const startDate = new Date();
    startDate.setMonth(0, 1);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setDate(endDate.getDate() - 1);

    console.log('\nGenerating activities for one year...\n');

    let totalActivitiesCreated = 0;

    for (const { user: worker, profile } of workers) {
      console.log(`\nGenerating activities for ${worker.full_name}...`);

      const existingCount = await activityRepo.count({ where: { userId: worker.id } });

      if (existingCount > 0) {
        console.log(`   Worker already has ${existingCount} activities. Skipping...`);
        continue;
      }

      const activities = generateActivitiesForYear(
        worker.id,
        profile,
        missionaryActivityTypes,
        startDate,
      );

      const BATCH_SIZE = 100;
      for (let j = 0; j < activities.length; j += BATCH_SIZE) {
        const batch = activities.slice(j, j + BATCH_SIZE);
        await activityRepo.save(batch);

        const progress = Math.min(j + BATCH_SIZE, activities.length);
        process.stdout.write(`   Saved ${progress}/${activities.length} activities...\r`);
      }

      console.log(`   Created ${activities.length} activities for ${worker.full_name}`);
      totalActivitiesCreated += activities.length;
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('Simulation seed completed successfully!\n');
    console.log('Summary:');
    console.log(`   - Workers: ${workers.length}`);
    console.log(`   - Total activities: ${totalActivitiesCreated}`);
    console.log(`   - Period: ${formatDate(startDate)} to ${formatDate(endDate)}`);
    console.log('='.repeat(60) + '\n');

    for (const { user: worker, profile } of workers) {
      const count = await activityRepo.count({ where: { userId: worker.id } });
      console.log(`   ${worker.full_name} (${profile.qualityLevel}): ${count} activities`);
    }

    console.log('\nYou can now login and view the activities in the admin dashboard.');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await app.close();
  }
}

run()
  .then(() => {
    console.log('\nScript finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
