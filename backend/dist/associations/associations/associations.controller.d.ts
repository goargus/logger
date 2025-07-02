import { AssociationsService } from './associations.service';
import { CreateAssociationDto } from './dto/create-association.dto';
import { UpdateAssociationDto } from './dto/update-association.dto';
export declare class AssociationsController {
    private readonly associationsService;
    constructor(associationsService: AssociationsService);
    create(createAssociationDto: CreateAssociationDto): Promise<import("./entities/association.entity").Association>;
    findAll(): Promise<import("./entities/association.entity").Association[]>;
    findOne(id: string): Promise<import("./entities/association.entity").Association | null>;
    update(id: string, dto: UpdateAssociationDto): Promise<import("./entities/association.entity").Association | null>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
