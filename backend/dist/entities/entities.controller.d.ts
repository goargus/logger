import { EntitiesService } from "./entities.service";
import { Entity } from "./entity.entity";
import { UpdateEntityDto } from "./dto/update-entity.dto";
import { CreateEntityDto } from "./dto/create-entity.dto";
export declare class EntitiesController {
    private readonly entitiesService;
    constructor(entitiesService: EntitiesService);
    create(body: CreateEntityDto): Promise<Entity>;
    findAll(): Promise<Entity[]>;
    findOne(id: string): Promise<Entity>;
    update(id: string, updateDto: UpdateEntityDto): Promise<Entity>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
