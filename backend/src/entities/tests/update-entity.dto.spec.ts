import { validate } from "class-validator";
import { UpdateEntityDto } from "../dto/update-entity.dto";
import { EntityType } from "../entity.entity";

describe("UpdateEntityDto", () => {
  it("should pass with no fields (all optional)", async () => {
    const dto = new UpdateEntityDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should pass with valid fields", async () => {
    const dto = new UpdateEntityDto();
    dto.name = "Updated Name";
    dto.type = EntityType.FIELD;
    dto.parentId = "123e4567-e89b-12d3-a456-426614174000";
    dto.code = "F123";
    dto.location = "Honduras";
    dto.is_active = false;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should fail if type is invalid", async () => {
    const dto = Object.assign(new UpdateEntityDto(), {
      type: "INVALID",
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === "type")).toBe(true);
  });

  it("should fail if name is not a string", async () => {
    const dto = Object.assign(new UpdateEntityDto(), {
      name: 123,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === "name")).toBe(true);
  });
});
