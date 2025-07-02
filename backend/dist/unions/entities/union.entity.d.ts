import { Association } from '../../associations/associations/entities/association.entity';
export declare class Union {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
    associations: Association[];
}
