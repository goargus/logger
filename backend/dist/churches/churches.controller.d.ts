import { ChurchesService } from './churches.service';
import { CreateChurchDto } from './dto/create-church.dto';
import { UpdateChurchDto } from './dto/update-church.dto';
export declare class ChurchesController {
    private readonly churchesService;
    constructor(churchesService: ChurchesService);
    create(createChurchDto: CreateChurchDto): Promise<any>;
    findAll(): any;
    findOne(id: string): any;
    update(id: string, updateChurchDto: UpdateChurchDto): any;
    remove(id: string): any;
}
