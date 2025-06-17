import { EntityType } from '../../Entities';

export class CreateEntityDto {
  name: string;
  type: EntityType;
  parent_id?: string | null;
  code?: string;
  location?: string;
  is_active: boolean;
}