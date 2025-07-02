import { Union } from '../../../unions/entities/union.entity';
import { Church } from 'src/churches/entities/church.entity';
export declare class Association {
    id: string;
    name: string;
    union: Union;
    churches: Church[] | undefined;
    unionId: string;
}
