import { Repository } from 'typeorm';
import { Union } from './entities/union.entity';
import { CreateUnionDto } from './dto/create-union.dto';
import { UpdateUnionDto } from './dto/update-union.dto';
export declare class UnionsService {
    private unionRepo;
    constructor(unionRepo: Repository<Union>);
    create(dto: CreateUnionDto): Promise<Union>;
    findAll(): Promise<Union[]>;
    findOne(id: string): Promise<Union | null>;
    update(id: string, dto: UpdateUnionDto): Promise<Union | null>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
