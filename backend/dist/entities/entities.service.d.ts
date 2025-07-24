import { Repository } from "typeorm";
import { Entity, EntityType } from "./entity.entity";
import { UpdateEntityDto } from "./dto/update-entity.dto";
import { CreateEntityDto } from "./dto/create-entity.dto";
export declare class EntitiesService {
    private readonly entityRepository;
    create(dto: CreateEntityDto): Promise<Entity>;
    findAll(): Promise<Entity[]>;
    findOne(id: string): Promise<Entity>;
    update(id: string, dto: UpdateEntityDto): Promise<Entity>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
    constructor(entityRepository: Repository<Entity>);
    validateHierarchy(type: EntityType, parentId: string | null): Promise<Entity | null>;
}
