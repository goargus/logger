import { Test, TestingModule } from "@nestjs/testing";
import { EntitiesController } from "../entities.controller";
import { EntitiesService } from "../entities.service";
import { EntityType, Entity } from "../entity.entity";
import { NotFoundException } from "@nestjs/common";
import { CreateEntityDto } from "../dto/create-entity.dto";

describe("EntitiesController", () => {
  let controller: EntitiesController;

  const mockEntity: Entity = {
    id: "1",
    name: "Union Central",
    type: EntityType.UNION,
    parent: null,
    code: "UC001",
    location: "Honduras",
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockEntitiesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntitiesController],
      providers: [
        {
          provide: EntitiesService,
          useValue: mockEntitiesService,
        },
      ],
    }).compile();

    controller = module.get<EntitiesController>(EntitiesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should create a new entity", async () => {
    mockEntitiesService.create.mockResolvedValue(mockEntity);

    const dto: CreateEntityDto = {
      name: "Union Central",
      type: EntityType.UNION,
      parentId: null,
    };

    const result = await controller.create(dto);
    expect(result).toEqual(mockEntity);
  });

  it("should return all entities", async () => {
    mockEntitiesService.findAll.mockResolvedValue([mockEntity]);
    expect(await controller.findAll()).toEqual([mockEntity]);
  });

  it("should return one entity by ID", async () => {
    mockEntitiesService.findOne.mockResolvedValue(mockEntity);
    expect(await controller.findOne("1")).toEqual(mockEntity);
  });

  it("should throw if entity not found", async () => {
    mockEntitiesService.findOne.mockRejectedValue(new NotFoundException());
    await expect(controller.findOne("999")).rejects.toThrow(NotFoundException);
  });

  it("should update an entity", async () => {
    const updated = { ...mockEntity, name: "Updated" };
    mockEntitiesService.update.mockResolvedValue(updated);
    expect(await controller.update("1", { name: "Updated" })).toEqual(updated);
  });

  it("should delete an entity", async () => {
    mockEntitiesService.remove.mockResolvedValue({ deleted: true });
    expect(await controller.remove("1")).toEqual({ deleted: true });
  });
});
