import { Repository } from 'typeorm';
import { Association } from './entities/association.entity';
import { CreateAssociationDto } from './dto/create-association.dto';
import { UpdateAssociationDto } from './dto/update-association.dto';
export declare class AssociationsService {
    private associationRepo;
    constructor(associationRepo: Repository<Association>);
    create(createDto: CreateAssociationDto): Promise<Association>;
    findAll(): Promise<Association[]>;
    findOne(id: string): Promise<Association | null>;
    update(id: string, updateDto: UpdateAssociationDto): Promise<Association | null>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
