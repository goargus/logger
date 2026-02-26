import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../src/roles/role.entity';
import { ActivityType } from '../src/activities-type/activity-type.entity';
import { RolePermission } from '../src/roles/role-permission.entity';
import { Permission } from '../src/auth/permissions/permission.enum';

interface ActivityTypeData {
  name: string;
  description: string;
}

interface RoleActivityMapping {
  roleName: string;
  roleDescription: string;
  permissions: Permission[];
  activityTypes: ActivityTypeData[];
}

// Permission sets for different role types
const SYSTEM_ADMIN_PERMISSIONS: Permission[] = [Permission.SYSTEM_ADMIN];

const LEADERSHIP_PERMISSIONS: Permission[] = [
  Permission.REPORT_VIEW_HIERARCHY,
  Permission.ACTIVITY_READ_HIERARCHY,
  Permission.ENTITY_READ_HIERARCHY,
  Permission.USER_READ_HIERARCHY,
  Permission.ROLE_READ,
  Permission.ACTIVITY_TYPE_READ,
];

const SECRETARY_PERMISSIONS: Permission[] = [
  ...LEADERSHIP_PERMISSIONS,
  Permission.ACTIVITY_MANAGE_HIERARCHY,
  Permission.ENTITY_UPDATE_OWN,
  Permission.USER_UPDATE_HIERARCHY,
];

const MISSIONARY_PERMISSIONS: Permission[] = [
  Permission.ACTIVITY_CREATE_OWN,
  Permission.ACTIVITY_READ_OWN,
  Permission.ACTIVITY_UPDATE_OWN,
  Permission.ACTIVITY_DELETE_OWN,
  Permission.USER_READ_OWN,
  Permission.ACTIVITY_TYPE_READ,
  Permission.ENTITY_READ,
];

async function seedRolesAndActivities() {
  console.log('Starting roles and activity types seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));
  const activityTypeRepo = app.get<Repository<ActivityType>>(getRepositoryToken(ActivityType));
  const rolePermissionRepo = app.get<Repository<RolePermission>>(getRepositoryToken(RolePermission));

  const roleActivityMappings: RoleActivityMapping[] = [
    // System Admin with full access
    {
      roleName: 'Administrador del Sistema',
      roleDescription: 'Administrador del sistema con acceso completo',
      permissions: SYSTEM_ADMIN_PERMISSIONS,
      activityTypes: [],
    },
    // Leadership roles with REPORT_VIEW_HIERARCHY permissions
    {
      roleName: 'Presidente de Unión',
      roleDescription: 'Presidente de Unión con visibilidad completa de la unión',
      permissions: LEADERSHIP_PERMISSIONS,
      activityTypes: [],
    },
    {
      roleName: 'Presidente de Asociación',
      roleDescription: 'Presidente de Asociación con visibilidad de la asociación',
      permissions: LEADERSHIP_PERMISSIONS,
      activityTypes: [],
    },
    {
      roleName: 'Director de Campo',
      roleDescription: 'Director de Campo con visibilidad del campo',
      permissions: LEADERSHIP_PERMISSIONS,
      activityTypes: [],
    },
    // Secretary roles with ACTIVITY_MANAGE_HIERARCHY permissions
    {
      roleName: 'Secretario de Unión',
      roleDescription: 'Secretario de Unión con gestión de actividades de la unión',
      permissions: SECRETARY_PERMISSIONS,
      activityTypes: [],
    },
    {
      roleName: 'Secretario de Asociación',
      roleDescription: 'Secretario de Asociación con gestión de actividades de la asociación',
      permissions: SECRETARY_PERMISSIONS,
      activityTypes: [],
    },
    {
      roleName: 'Secretario de Campo',
      roleDescription: 'Secretario de Campo con gestión de actividades del campo',
      permissions: SECRETARY_PERMISSIONS,
      activityTypes: [],
    },
    // Missionary roles with ACTIVITY_*_OWN permissions
    {
      roleName: 'Misionero',
      roleDescription: 'Misionero/Obrero de campo con actividades evangelísticas',
      permissions: MISSIONARY_PERMISSIONS,
      activityTypes: [
        { name: 'Visitas a miembros', description: 'Visitas a miembros de la iglesia' },
        { name: 'Visitas a interesados', description: 'Visitas a personas interesadas' },
        { name: 'Visita a infantes', description: 'Visitas a infantes' },
        { name: 'Estudios bíblicos', description: 'Estudios bíblicos' },
        { name: 'Cultos en hogares', description: 'Cultos realizados en hogares' },
        {
          name: 'Conversaciones oportunas',
          description: 'Conversaciones evangelísticas oportunas',
        },
        { name: 'Contactos Misioneros', description: 'Contactos con fines misioneros' },
        { name: 'Predicaciones', description: 'Predicaciones y sermones' },
        { name: 'Dirección de programas', description: 'Dirección de programas de la iglesia' },
        { name: 'Días de conferencias', description: 'Días de conferencias' },
        { name: 'Seminarios', description: 'Seminarios y capacitaciones' },
        { name: 'Congreso', description: 'Congresos' },
        { name: 'Retiros', description: 'Retiros espirituales' },
        { name: 'Otros eventos', description: 'Otros eventos eclesiásticos' },
        { name: 'Viaje', description: 'Viajes relacionados con el ministerio' },
        { name: 'Oficina', description: 'Trabajo de oficina y administrativo' },
        { name: 'Trámites', description: 'Trámites administrativos y documentación' },
        { name: 'Reuniones de comité', description: 'Reuniones de comité' },
        { name: 'Reuniones de consejo', description: 'Reuniones de consejo' },
        { name: 'Reuniones de asamblea', description: 'Reuniones de asamblea' },
        { name: 'Reunión de iglesia', description: 'Reunión de iglesia regular' },
        { name: 'Reuniones diversas', description: 'Otras reuniones diversas' },
        { name: 'Incapacidad por enfermedad', description: 'Incapacidad por enfermedad' },
        { name: 'Días libres', description: 'Días libres' },
        { name: 'Vacaciones', description: 'Vacaciones' },
      ],
    },
    {
      roleName: 'Ministro',
      roleDescription: 'Ministro con privilegios completos para actividades ministeriales',
      permissions: MISSIONARY_PERMISSIONS,
      activityTypes: [
        { name: 'Bautismos', description: 'Ceremonias de bautismo' },
        { name: 'Santa Cena', description: 'Servicio de Santa Cena' },
        { name: 'Casamiento', description: 'Ceremonias de matrimonio' },
        { name: 'Ordenaciones', description: 'Ceremonias de ordenación' },
        { name: 'Presentación de niños', description: 'Ceremonia de presentación de niños' },
        { name: 'Acciones disciplinarias', description: 'Acciones disciplinarias eclesiásticas' },
        { name: 'Unción de enfermos', description: 'Servicio de unción de enfermos' },
        { name: 'Dedicaciones', description: 'Ceremonias de dedicación' },
        { name: 'Funerales', description: 'Servicios funerarios' },
        { name: 'Oficina', description: 'Trabajo de oficina y administrativo' },
        { name: 'Trámites', description: 'Trámites administrativos y documentación' },
        { name: 'Reuniones de comité', description: 'Reuniones de comité' },
        { name: 'Reuniones de consejo', description: 'Reuniones de consejo' },
        { name: 'Reuniones de asamblea', description: 'Reuniones de asamblea' },
        { name: 'Reunión de iglesia', description: 'Reunión de iglesia regular' },
        { name: 'Reuniones diversas', description: 'Otras reuniones diversas' },
        { name: 'Visitas a miembros', description: 'Visitas a miembros de la iglesia' },
        { name: 'Visitas a interesados', description: 'Visitas a personas interesadas' },
        { name: 'Estudios bíblicos', description: 'Estudios bíblicos' },
        {
          name: 'Conversaciones oportunas',
          description: 'Conversaciones evangelísticas oportunas',
        },
        { name: 'Contactos Misioneros', description: 'Contactos con fines misioneros' },
        { name: 'Predicaciones', description: 'Predicaciones y sermones' },
        { name: 'Dirección de programas', description: 'Dirección de programas de la iglesia' },
        {
          name: 'Visitas a estudiantes de principios de fe',
          description: 'Visitas a estudiantes de principios de fe',
        },
        { name: 'Visitas a hermanos en desánimo', description: 'Visitas a hermanos desanimados' },
        {
          name: 'Visitas a familias con problemas',
          description: 'Visitas a familias con problemas',
        },
        { name: 'Visitas a familias de obreros', description: 'Visitas a familias de obreros' },
        { name: 'Curso de matrimonio a novios', description: 'Curso de preparación matrimonial' },
        { name: 'Visita a vivero ministerial', description: 'Visitas a vivero ministerial' },
        { name: 'Días de conferencias', description: 'Días de conferencias' },
        { name: 'Seminarios', description: 'Seminarios y capacitaciones' },
        { name: 'Visitas a obreros', description: 'Visitas a obreros' },
        { name: 'Visitas a iglesias', description: 'Visitas a iglesias' },
        { name: 'Visitas a asociaciones', description: 'Visitas a asociaciones' },
        { name: 'Congreso', description: 'Congresos' },
        { name: 'Retiros', description: 'Retiros espirituales' },
        { name: 'Otros eventos', description: 'Otros eventos eclesiásticos' },
        { name: 'Viaje', description: 'Viajes relacionados con el ministerio' },
        { name: 'Incapacidad por enfermedad', description: 'Incapacidad por enfermedad' },
        { name: 'Días libres', description: 'Días libres' },
        { name: 'Vacaciones', description: 'Vacaciones' },
      ],
    },
    {
      roleName: 'Anciano',
      roleDescription: 'Anciano de iglesia con responsabilidades pastorales',
      permissions: MISSIONARY_PERMISSIONS,
      activityTypes: [
        { name: 'Bautismos', description: 'Ceremonias de bautismo' },
        { name: 'Santa Cena', description: 'Servicio de Santa Cena' },
        { name: 'Presentación de niños', description: 'Ceremonia de presentación de niños' },
        { name: 'Acciones disciplinarias', description: 'Acciones disciplinarias eclesiásticas' },
        { name: 'Unción de enfermos', description: 'Servicio de unción de enfermos' },
        { name: 'Dedicaciones', description: 'Ceremonias de dedicación' },
        { name: 'Funerales', description: 'Servicios funerarios' },
        { name: 'Oficina', description: 'Trabajo de oficina y administrativo' },
        { name: 'Trámites', description: 'Trámites administrativos y documentación' },
        { name: 'Reuniones de comité', description: 'Reuniones de comité' },
        { name: 'Reuniones de consejo', description: 'Reuniones de consejo' },
        { name: 'Reuniones de asamblea', description: 'Reuniones de asamblea' },
        { name: 'Reunión de iglesia', description: 'Reunión de iglesia regular' },
        { name: 'Reuniones diversas', description: 'Otras reuniones diversas' },
        { name: 'Visitas a miembros', description: 'Visitas a miembros de la iglesia' },
        { name: 'Visitas a interesados', description: 'Visitas a personas interesadas' },
        { name: 'Estudios bíblicos', description: 'Estudios bíblicos' },
        {
          name: 'Conversaciones oportunas',
          description: 'Conversaciones evangelísticas oportunas',
        },
        { name: 'Contactos Misioneros', description: 'Contactos con fines misioneros' },
        { name: 'Predicaciones', description: 'Predicaciones y sermones' },
        { name: 'Dirección de programas', description: 'Dirección de programas de la iglesia' },
        {
          name: 'Visitas a estudiantes de principios de fe',
          description: 'Visitas a estudiantes de principios de fe',
        },
        { name: 'Visitas a hermanos en desánimo', description: 'Visitas a hermanos desanimados' },
        {
          name: 'Visitas a familias con problemas',
          description: 'Visitas a familias con problemas',
        },
        { name: 'Visitas a familias de obreros', description: 'Visitas a familias de obreros' },
        { name: 'Curso de matrimonio a novios', description: 'Curso de preparación matrimonial' },
        { name: 'Visita a vivero ministerial', description: 'Visitas a vivero ministerial' },
        { name: 'Días de conferencias', description: 'Días de conferencias' },
        { name: 'Seminarios', description: 'Seminarios y capacitaciones' },
        { name: 'Incapacidad por enfermedad', description: 'Incapacidad por enfermedad' },
        { name: 'Días libres', description: 'Días libres' },
        { name: 'Vacaciones', description: 'Vacaciones' },
        { name: 'Visitas a obreros', description: 'Visitas a obreros' },
        { name: 'Visitas a iglesias', description: 'Visitas a iglesias' },
        { name: 'Visitas a asociaciones', description: 'Visitas a asociaciones' },
        { name: 'Congreso', description: 'Congresos' },
        { name: 'Retiros', description: 'Retiros espirituales' },
        { name: 'Otros eventos', description: 'Otros eventos eclesiásticos' },
        { name: 'Viaje', description: 'Viajes relacionados con el ministerio' },
      ],
    },
    {
      roleName: 'Director de Obra Misionera',
      roleDescription: 'Director de Obra Misionera con responsabilidades de supervisión',
      permissions: MISSIONARY_PERMISSIONS,
      activityTypes: [
        { name: 'Seminarios', description: 'Seminarios y capacitaciones' },
        { name: 'Charlas y orientaciones', description: 'Charlas y orientaciones' },
        { name: 'Visitas a obreros', description: 'Visitas a obreros' },
        { name: 'Visitas a iglesias', description: 'Visitas a iglesias' },
        { name: 'Días de conferencias', description: 'Días de conferencias' },
        { name: 'Predicaciones', description: 'Predicaciones y sermones' },
        {
          name: 'Apoyo a otros proyectos de Unión y Asociación',
          description: 'Apoyo a proyectos de Unión y Asociación',
        },
        { name: 'Programas virtuales', description: 'Programas realizados virtualmente' },
        {
          name: 'Circulares y comunicados enviados al campo',
          description: 'Circulares y comunicados',
        },
        {
          name: 'Distribución de materiales impresos',
          description: 'Distribución de materiales impresos',
        },
        {
          name: 'Supervisión de proyectos en desarrollo',
          description: 'Supervisión de proyectos en desarrollo',
        },
      ],
    },
    {
      roleName: 'Director de Asistencia Social',
      roleDescription: 'Director de Asistencia Social con responsabilidades comunitarias',
      permissions: MISSIONARY_PERMISSIONS,
      activityTypes: [
        {
          name: 'Oficina y trámites',
          description: 'Trabajo de oficina y trámites administrativos',
        },
        { name: 'Reuniones de comité', description: 'Reuniones de comité' },
        { name: 'Reuniones de consejo UH', description: 'Reuniones de consejo de Unión' },
        { name: 'Preparación de proyectos', description: 'Preparación de proyectos' },
        { name: 'Talleres de desarrollo social', description: 'Talleres de desarrollo social' },
        {
          name: 'Gestión de fondos en otras instituciones',
          description: 'Gestión de fondos en otras instituciones',
        },
        {
          name: 'Gestión de recursos humanos y financieros internos',
          description: 'Gestión de recursos humanos y financieros',
        },
        {
          name: 'Supervisión de proyectos en desarrollo',
          description: 'Supervisión de proyectos en desarrollo',
        },
        { name: 'Seminarios', description: 'Seminarios y capacitaciones' },
        { name: 'Capacitaciones', description: 'Capacitaciones' },
        { name: 'Visitas a iglesias', description: 'Visitas a iglesias' },
        { name: 'Actividades de donación', description: 'Actividades de donación' },
        {
          name: 'Proyectos de reparación o construcción social',
          description: 'Proyectos de reparación o construcción',
        },
        {
          name: 'Colaboración con otros departamentos',
          description: 'Colaboración con otros departamentos',
        },
        { name: 'Misiones de ayuda humanitaria', description: 'Misiones de ayuda humanitaria' },
        { name: 'Días de conferencias', description: 'Días de conferencias' },
        { name: 'Programas virtuales', description: 'Programas realizados virtualmente' },
        { name: 'Predicaciones', description: 'Predicaciones y sermones' },
        { name: 'Personas auxiliadas', description: 'Registro de personas auxiliadas' },
      ],
    },
    {
      roleName: 'Director de Salud',
      roleDescription: 'Director de Salud con responsabilidades de salud y bienestar',
      permissions: MISSIONARY_PERMISSIONS,
      activityTypes: [
        {
          name: 'Oficina y trámites',
          description: 'Trabajo de oficina y trámites administrativos',
        },
        { name: 'Reuniones de comité', description: 'Reuniones de comité' },
        { name: 'Reuniones de consejo UH', description: 'Reuniones de consejo de Unión' },
        { name: 'Preparación de proyectos', description: 'Preparación de proyectos' },
        {
          name: 'Preparación de material didáctico',
          description: 'Preparación de material didáctico',
        },
        {
          name: 'Supervisión de proyectos en desarrollo',
          description: 'Supervisión de proyectos en desarrollo',
        },
        { name: 'Seminarios', description: 'Seminarios y capacitaciones' },
        { name: 'Capacitaciones', description: 'Capacitaciones' },
        { name: 'Visitas a iglesias', description: 'Visitas a iglesias' },
        { name: 'Charlas', description: 'Charlas sobre salud' },
        {
          name: 'Colaboración con otros departamentos',
          description: 'Colaboración con otros departamentos',
        },
        { name: 'Programas virtuales', description: 'Programas realizados virtualmente' },
        { name: 'Brigadas', description: 'Brigadas de salud' },
      ],
    },
    {
      roleName: 'Director de Jóvenes',
      roleDescription: 'Director de Jóvenes con responsabilidades juveniles',
      permissions: MISSIONARY_PERMISSIONS,
      activityTypes: [
        {
          name: 'Preparación de material didáctico',
          description: 'Preparación de material didáctico',
        },
        {
          name: 'Reuniones con comisiones de jóvenes',
          description: 'Reuniones con comisiones de jóvenes',
        },
        { name: 'Visitas a jóvenes', description: 'Visitas a jóvenes' },
        { name: 'Conferencias juveniles', description: 'Conferencias juveniles' },
        { name: 'Seminarios', description: 'Seminarios y capacitaciones' },
        { name: 'Charlas', description: 'Charlas para jóvenes' },
        { name: 'Eventos juveniles', description: 'Eventos juveniles' },
        {
          name: 'Actividades sociales juveniles',
          description: 'Actividades sociales para jóvenes',
        },
      ],
    },
    {
      roleName: 'Secretario',
      roleDescription: 'Secretario con responsabilidades administrativas',
      permissions: MISSIONARY_PERMISSIONS,
      activityTypes: [
        { name: 'Elaboración de actas', description: 'Elaboración de actas' },
        { name: 'Elaboración de circulares', description: 'Elaboración de circulares' },
        { name: 'Elaboración de constancias', description: 'Elaboración de constancias' },
        { name: 'Elaboración de solicitudes', description: 'Elaboración de solicitudes' },
      ],
    },
  ];

  const allActivityTypes = new Map<string, ActivityType>();
  console.log('\n=== Creating Activity Types ===');
  for (const mapping of roleActivityMappings) {
    for (const activityData of mapping.activityTypes) {
      if (!allActivityTypes.has(activityData.name)) {
        let activityType = await activityTypeRepo.findOne({
          where: { name: activityData.name },
        });

        if (!activityType) {
          console.log(`Creating activity type: ${activityData.name}`);
          activityType = activityTypeRepo.create({
            name: activityData.name,
            description: activityData.description,
            allowed_roles: [],
          });
          activityType = await activityTypeRepo.save(activityType);
        } else {
          console.log(`Activity type already exists: ${activityData.name}`);
        }
        allActivityTypes.set(activityData.name, activityType);
      }
    }
  }

  console.log('\n=== Creating Roles and Permissions ===');
  for (const mapping of roleActivityMappings) {
    let role = await roleRepo.findOne({
      where: { name: mapping.roleName },
      relations: ['rolePermissions'],
    });
    if (!role) {
      console.log(`Creating role: ${mapping.roleName}`);
      role = roleRepo.create({
        name: mapping.roleName,
        description: mapping.roleDescription,
      });
      role = await roleRepo.save(role);
      console.log(`Role created: ${mapping.roleName}`);
    } else {
      console.log(`Role already exists: ${mapping.roleName}`);
    }

    // Create permissions for the role
    const existingPermissions = new Set(role.rolePermissions?.map((rp) => rp.permission) || []);
    for (const permission of mapping.permissions) {
      if (!existingPermissions.has(permission)) {
        const rolePermission = rolePermissionRepo.create({
          role,
          permission,
        });
        await rolePermissionRepo.save(rolePermission);
        console.log(`  - Added permission: ${permission}`);
      }
    }

    console.log(`Associating activity types with role: ${mapping.roleName}`);
    for (const activityData of mapping.activityTypes) {
      const activityType = allActivityTypes.get(activityData.name);
      if (activityType) {
        const activityTypeWithRoles = await activityTypeRepo.findOne({
          where: { id: activityType.id },
          relations: ['allowed_roles'],
        });

        if (activityTypeWithRoles) {
          const roleExists = activityTypeWithRoles.allowed_roles.some((r) => r.id === role.id);

          if (!roleExists) {
            activityTypeWithRoles.allowed_roles.push(role);
            await activityTypeRepo.save(activityTypeWithRoles);
            console.log(`  - Associated "${activityData.name}" with "${mapping.roleName}"`);
          }
        }
      }
    }
  }

  console.log('\n=== Seeding Complete ===');
  console.log(`Total roles created/updated: ${roleActivityMappings.length}`);
  console.log(`Total activity types created/updated: ${allActivityTypes.size}`);

  await app.close();
}

seedRolesAndActivities()
  .then(() => {
    console.log('\nDatabase seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
