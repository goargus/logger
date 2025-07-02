import { CreateChurchDto } from './dto/create-church.dto';
export declare class ChurchesService {
    private readonly associationRepository;
    private readonly churchRepository;
    constructor(associationRepository: any, churchRepository: any);
    create(createChurchDto: CreateChurchDto): Promise<any>;
    findAll(): any;
    findOne(id: number): any;
    remove(id: number): any;
}
