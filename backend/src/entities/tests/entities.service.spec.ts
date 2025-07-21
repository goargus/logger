import { Test, TestingModule } from "@nestjs/testing";
import { EntitiesService } from "../entities.service";
import { Entity, EntityType } from "../entity.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";

describe("EntitiesService - Hierarchy Rules", () => {
  let service: EntitiesService;
  let mockEntityRepo: jest.Mocked<Repository<Entity>>;

  const union: Entity = {
    id: "1",
    name: "Union A",
    type: EntityType.UNION,
    parent: null,
    code: "U1",
    location: "X",
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const association: Entity = {
    id: "2",
    name: "Association A",
    type: EntityType.ASSOCIATION,
    parent: union,
    code: "A1",
    location: "Y",
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockEntityRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Entity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitiesService,
        {
          provide: getRepositoryToken(Entity),
          useValue: mockEntityRepo,
        },
      ],
    }).compile();

    service = module.get<EntitiesService>(EntitiesService);
  });

  it("should throw if parentId is provided but entity not found", async () => {
    mockEntityRepo.findOne.mockResolvedValue(null);
    await expect(
      service.validateHierarchy(EntityType.ASSOCIATION, "999"),
    ).rejects.toThrow(NotFoundException);
  });

  it("should throw if UNION has a parentId", async () => {
    mockEntityRepo.findOne.mockResolvedValue(union);
    await expect(
      service.validateHierarchy(EntityType.UNION, union.id),
    ).rejects.toThrow("A UNION cannot have a parent");
  });

  it("should throw if ASSOCIATION parent is not UNION", async () => {
    mockEntityRepo.findOne.mockResolvedValue(association);
    await expect(
      service.validateHierarchy(EntityType.ASSOCIATION, association.id),
    ).rejects.toThrow("An ASSOCIATION must have a UNION as parent");
  });

  it("should throw if FIELD parent is not ASSOCIATION", async () => {
    mockEntityRepo.findOne.mockResolvedValue(union);
    await expect(
      service.validateHierarchy(EntityType.FIELD, union.id),
    ).rejects.toThrow("A FIELD must have an ASSOCIATION as parent");
  });

  it("should allow valid UNION (no parent)", async () => {
    await expect(
      service.validateHierarchy(EntityType.UNION, null),
    ).resolves.toBeNull();
  });

  it("should allow valid ASSOCIATION with UNION parent", async () => {
    mockEntityRepo.findOne.mockResolvedValue(union);
    await expect(
      service.validateHierarchy(EntityType.ASSOCIATION, union.id),
    ).resolves.toEqual(union);
  });

  it("should allow valid FIELD with ASSOCIATION parent", async () => {
    mockEntityRepo.findOne.mockResolvedValue(association);
    await expect(
      service.validateHierarchy(EntityType.FIELD, association.id),
    ).resolves.toEqual(association);
  });
});
