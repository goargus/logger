import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EntitiesService } from '../src/entities/entities.service';
import { EntityType } from '../src/entities/entity.entity';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const entitiesService = app.get(EntitiesService);

  async function createIfNotExists(params: {
    name: string;
    type: EntityType;
    parentId?: string;
    code?: string;
    description?: string;
    location?: string;
  }) {
    try {
      return await entitiesService.create({
        name: params.name,
        type: params.type,
        parentId: params.parentId,
        code: params.code,
        description: params.description,
        location: params.location,
      } as any);
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      if (msg.toLowerCase().includes('already exists') || e?.status === 409) {
        const all = await entitiesService.findAll();
        const found = all.find(
          (x) => x.type === params.type && x.name.toLowerCase() === params.name.toLowerCase(),
        );
        if (found) return found;
      }
      throw e;
    }
  }

  const platform = await createIfNotExists({
    name: 'Plataforma Global',
    type: EntityType.PLATFORM,
    code: 'PLAT',
    description: 'Plataforma raíz del sistema',
  });

  const union = await createIfNotExists({
    name: 'Unión Hondureña',
    type: EntityType.UNION,
    parentId: platform.id,
    code: 'UHN',
    location: 'Honduras',
    description: 'Estructura de ejemplo para datos iniciales',
  });

  const asociacionNorOccidental = await createIfNotExists({
    name: 'Asociación Nor-occidental',
    type: EntityType.ASSOCIATION,
    parentId: union.id,
    code: 'ANO',
    location: 'Zona Nor-occidental',
  });

  const asociacionCentral = await createIfNotExists({
    name: 'Asociación Central',
    type: EntityType.ASSOCIATION,
    parentId: union.id,
    code: 'ACEN',
    location: 'Zona Central',
  });

  const asociacionNorOriental = await createIfNotExists({
    name: 'Asociación Nor-oriental',
    type: EntityType.ASSOCIATION,
    parentId: union.id,
    code: 'ANOR',
    location: 'Zona Nor-oriental',
  });

  const fieldsNorOccidental = [
    { name: 'Campo Copán', code: 'C-CPN', location: 'Copán' },
    { name: 'Campo Valle de Sula', code: 'C-VS', location: 'Cortés / Yoro' },
    { name: 'Campo Litoral Atlántico', code: 'C-LA', location: 'Atlántida / Colón' },
  ];

  const fieldsCentral = [
    { name: 'Campo Tegucigalpa', code: 'C-TGU', location: 'Francisco Morazán' },
    { name: 'Campo Comayagua', code: 'C-COM', location: 'Comayagua / La Paz' },
    { name: 'Campo Olancho', code: 'C-OL', location: 'Olancho' },
  ];

  const fieldsNorOriental = [
    { name: 'Campo San Pedro Sula', code: 'C-SPS', location: 'Cortés' },
    { name: 'Campo El Paraíso', code: 'C-EP', location: 'El Paraíso' },
    { name: 'Campo Gracias a Dios', code: 'C-GD', location: 'Gracias a Dios' },
  ];

  for (const f of fieldsNorOccidental) {
    await createIfNotExists({
      name: f.name,
      type: EntityType.FIELD,
      parentId: asociacionNorOccidental.id,
      code: f.code,
      location: f.location,
    });
  }

  for (const f of fieldsCentral) {
    await createIfNotExists({
      name: f.name,
      type: EntityType.FIELD,
      parentId: asociacionCentral.id,
      code: f.code,
      location: f.location,
    });
  }

  for (const f of fieldsNorOriental) {
    await createIfNotExists({
      name: f.name,
      type: EntityType.FIELD,
      parentId: asociacionNorOriental.id,
      code: f.code,
      location: f.location,
    });
  }

  console.log('Seed completado: Unión Hondureña → 3 asociaciones → 9 campos');
  await app.close();
}

run().catch((err) => {
  console.error('Seed falló:', err);
  process.exit(1);
});
