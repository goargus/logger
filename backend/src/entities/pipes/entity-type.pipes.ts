import { BadRequestException, PipeTransform } from '@nestjs/common';
import { EntityType } from '../entity.entity';

export class ParseEntityTypePipe implements PipeTransform<string, EntityType> {
  transform(value: string): EntityType {
    const upper = value?.toUpperCase();
    const allowed = Object.values(EntityType);
    if (!upper || !allowed.includes(upper as EntityType)) {
      throw new BadRequestException(`Invalid type. Allowed: ${allowed.join(', ')}`);
    }
    return upper as EntityType;
  }
}
