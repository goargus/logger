import { Controller, Post, Get, Patch, Delete, Param, Body } from '@nestjs/common';
import { UnionsService } from './unions.service';
import { CreateUnionDto } from './dto/create-union.dto';
import { UpdateUnionDto } from './dto/update-union.dto';

@Controller('unions')
export class UnionsController {
  constructor(private readonly service: UnionsService) {}

  @Post()
  create(@Body() dto: CreateUnionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
