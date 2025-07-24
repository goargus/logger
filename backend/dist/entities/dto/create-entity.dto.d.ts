import { EntityType } from "../entity.entity";
export declare class CreateEntityDto {
    name: string;
    type: EntityType;
    parentId: string | null;
    code?: string;
    location?: string;
}
