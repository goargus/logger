import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { User as UserEntity } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  create(@Body() createDto: CreateActivityDto, @User() user: UserEntity) {
    return this.activityService.create(createDto, user);
  }

  @Get()
  findAll(
    @Query('category_id') category_id: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @User() user: UserEntity,
  ) {
    return this.activityService.findAll(user, { category_id, start, end });
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateActivityDto,
    @User() user: UserEntity,
  ) {
    return this.activityService.update(id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: UserEntity) {
    return this.activityService.remove(id, user);
  }
}
