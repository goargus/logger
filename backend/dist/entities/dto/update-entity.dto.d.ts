import { EntityType } from "../entity.entity";
export declare class UpdateEntityDto {
    name?: string;
    type?: EntityType;
    parentId?: string;
    code?: string;
    location?: string;
    is_active?: boolean;
}
