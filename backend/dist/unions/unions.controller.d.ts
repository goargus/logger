import { UnionsService } from './unions.service';
import { CreateUnionDto } from './dto/create-union.dto';
import { UpdateUnionDto } from './dto/update-union.dto';
export declare class UnionsController {
    private readonly service;
    constructor(service: UnionsService);
    create(dto: CreateUnionDto): Promise<import("./entities/union.entity").Union>;
    findAll(): Promise<import("./entities/union.entity").Union[]>;
    findOne(id: string): Promise<import("./entities/union.entity").Union | null>;
    update(id: string, dto: UpdateUnionDto): Promise<import("./entities/union.entity").Union | null>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
