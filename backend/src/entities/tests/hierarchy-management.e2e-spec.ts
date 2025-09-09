import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { Entity, EntityType } from '../entity.entity';
import { User } from '../../users/user.entity';
import { Role } from '../../roles/role.entity';

describe('Entity Hierarchy Management (e2e)', () => {
  let app: INestApplication;
  let entityRepository: Repository<Entity>;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    entityRepository = moduleFixture.get('EntityRepository');
    userRepository = moduleFixture.get('UserRepository');
    roleRepository = moduleFixture.get('RoleRepository');
  });

  beforeEach(async () => {
    // Clean up test data
    await userRepository.delete({});
    await entityRepository.delete({});
    await roleRepository.delete({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Hierarchy Validation', () => {
    it('should create Platform entity without parent', async () => {
      const platformData = {
        name: 'Test Platform',
        type: EntityType.PLATFORM,
      };

      const response = await request(app.getHttpServer())
        .post('/entities/platform')
        .send(platformData)
        .expect(201);

      expect(response.body.name).toBe('Test Platform');
      expect(response.body.type).toBe(EntityType.PLATFORM);
      expect(response.body.parent_id).toBeNull();
    });

    it('should create Union under Platform', async () => {
      // First create a platform
      const platform = await entityRepository.save({
        name: 'Test Platform',
        type: EntityType.PLATFORM,
      });

      const unionData = {
        name: 'Test Union',
        type: EntityType.UNION,
        parentId: platform.id,
      };

      const response = await request(app.getHttpServer())
        .post('/entities/union')
        .send(unionData)
        .expect(201);

      expect(response.body.name).toBe('Test Union');
      expect(response.body.type).toBe(EntityType.UNION);
      expect(response.body.parent_id).toBe(platform.id);
    });

    it('should create Association under Union', async () => {
      // Create platform -> union -> association hierarchy
      const platform = await entityRepository.save({
        name: 'Test Platform',
        type: EntityType.PLATFORM,
      });

      const union = await entityRepository.save({
        name: 'Test Union',
        type: EntityType.UNION,
        parent_id: platform.id,
      });

      const associationData = {
        name: 'Test Association',
        type: EntityType.ASSOCIATION,
        parentId: union.id,
      };

      const response = await request(app.getHttpServer())
        .post('/entities/association')
        .send(associationData)
        .expect(201);

      expect(response.body.name).toBe('Test Association');
      expect(response.body.type).toBe(EntityType.ASSOCIATION);
      expect(response.body.parent_id).toBe(union.id);
    });

    it('should create Field under Association', async () => {
      // Create full hierarchy: platform -> union -> association -> field
      const platform = await entityRepository.save({
        name: 'Test Platform',
        type: EntityType.PLATFORM,
      });

      const union = await entityRepository.save({
        name: 'Test Union',
        type: EntityType.UNION,
        parent_id: platform.id,
      });

      const association = await entityRepository.save({
        name: 'Test Association',
        type: EntityType.ASSOCIATION,
        parent_id: union.id,
      });

      const fieldData = {
        name: 'Test Field',
        type: EntityType.FIELD,
        parentId: association.id,
      };

      const response = await request(app.getHttpServer())
        .post('/entities/field')
        .send(fieldData)
        .expect(201);

      expect(response.body.name).toBe('Test Field');
      expect(response.body.type).toBe(EntityType.FIELD);
      expect(response.body.parent_id).toBe(association.id);
    });

    it('should reject Union without parent', async () => {
      const unionData = {
        name: 'Test Union',
        type: EntityType.UNION,
      };

      await request(app.getHttpServer())
        .post('/entities/union')
        .send(unionData)
        .expect(400);
    });

    it('should reject Association under Platform (skip Union)', async () => {
      const platform = await entityRepository.save({
        name: 'Test Platform',
        type: EntityType.PLATFORM,
      });

      const associationData = {
        name: 'Test Association',
        type: EntityType.ASSOCIATION,
        parentId: platform.id,
      };

      await request(app.getHttpServer())
        .post('/entities/association')
        .send(associationData)
        .expect(400);
    });

    it('should reject Field under Union (skip Association)', async () => {
      const platform = await entityRepository.save({
        name: 'Test Platform',
        type: EntityType.PLATFORM,
      });

      const union = await entityRepository.save({
        name: 'Test Union',
        type: EntityType.UNION,
        parent_id: platform.id,
      });

      const fieldData = {
        name: 'Test Field',
        type: EntityType.FIELD,
        parentId: union.id,
      };

      await request(app.getHttpServer())
        .post('/entities/field')
        .send(fieldData)
        .expect(400);
    });
  });

  describe('Unique Name Constraint', () => {
    it('should enforce unique name per entity type', async () => {
      const entityData = {
        name: 'Test Entity',
        type: EntityType.PLATFORM,
      };

      // Create first entity
      await request(app.getHttpServer())
        .post('/entities/platform')
        .send(entityData)
        .expect(201);

      // Try to create another with same name and type
      await request(app.getHttpServer())
        .post('/entities/platform')
        .send(entityData)
        .expect(409);
    });

    it('should allow same name for different entity types', async () => {
      const platform = await entityRepository.save({
        name: 'Test Entity',
        type: EntityType.PLATFORM,
      });

      const unionData = {
        name: 'Test Entity', // Same name, different type
        type: EntityType.UNION,
        parentId: platform.id,
      };

      await request(app.getHttpServer())
        .post('/entities/union')
        .send(unionData)
        .expect(201);
    });
  });

  describe('Soft Delete', () => {
    it('should soft delete entity (set is_active to false)', async () => {
      const entity = await entityRepository.save({
        name: 'Test Entity',
        type: EntityType.PLATFORM,
      });

      await request(app.getHttpServer())
        .delete(`/entities/${entity.id}`)
        .expect(200);

      const deletedEntity = await entityRepository.findOne({
        where: { id: entity.id },
      });

      expect(deletedEntity?.is_active).toBe(false);
    });

    it('should prevent deletion of entity with active children', async () => {
      const platform = await entityRepository.save({
        name: 'Test Platform',
        type: EntityType.PLATFORM,
      });

      await entityRepository.save({
        name: 'Test Union',
        type: EntityType.UNION,
        parent_id: platform.id,
      });

      await request(app.getHttpServer())
        .delete(`/entities/${platform.id}`)
        .expect(400);
    });

    it('should prevent deletion of entity with active users', async () => {
      const platform = await entityRepository.save({
        name: 'Test Platform',
        type: EntityType.PLATFORM,
      });

      const role = await roleRepository.save({
        name: 'Test Role',
        description: 'Test role for testing',
      });

      await userRepository.save({
        username: 'testuser',
        email: 'test@example.com',
        role_id: role.id,
        entity_id: platform.id,
      });

      await request(app.getHttpServer())
        .delete(`/entities/${platform.id}`)
        .expect(400);
    });
  });

  describe('API Endpoints', () => {
    it('should get hierarchy tree', async () => {
      const platform = await entityRepository.save({
        name: 'Test Platform',
        type: EntityType.PLATFORM,
      });

      const union = await entityRepository.save({
        name: 'Test Union',
        type: EntityType.UNION,
        parent_id: platform.id,
      });

      const response = await request(app.getHttpServer())
        .get('/entities/hierarchy/tree')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Test Platform');
      expect(response.body[1].name).toBe('Test Union');
    });

    it('should get valid parents for entity type', async () => {
      await entityRepository.save({
        name: 'Test Platform',
        type: EntityType.PLATFORM,
      });

      const response = await request(app.getHttpServer())
        .get('/entities/hierarchy/parents/union')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].type).toBe(EntityType.PLATFORM);
    });

    it('should get children of entity', async () => {
      const platform = await entityRepository.save({
        name: 'Test Platform',
        type: EntityType.PLATFORM,
      });

      await entityRepository.save({
        name: 'Test Union',
        type: EntityType.UNION,
        parent_id: platform.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/entities/${platform.id}/children`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Test Union');
    });

    it('should activate/deactivate entity', async () => {
      const entity = await entityRepository.save({
        name: 'Test Entity',
        type: EntityType.PLATFORM,
        is_active: false,
      });

      // Activate
      await request(app.getHttpServer())
        .patch(`/entities/${entity.id}/activate`)
        .expect(200);

      let updatedEntity = await entityRepository.findOne({
        where: { id: entity.id },
      });
      expect(updatedEntity?.is_active).toBe(true);

      // Deactivate
      await request(app.getHttpServer())
        .patch(`/entities/${entity.id}/deactivate`)
        .expect(200);

      updatedEntity = await entityRepository.findOne({
        where: { id: entity.id },
      });
      expect(updatedEntity?.is_active).toBe(false);
    });
  });
});
