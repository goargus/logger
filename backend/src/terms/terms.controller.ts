import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TermsService } from './terms.service';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';

@Controller('terms')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Post()
  @Roles('admin')
  async create(@Body() createTermDto: CreateTermDto) {
    return await this.termsService.create(createTermDto);
  }

  @Get()
  @Roles('admin')
  async findAll(@Query('entityId') entityId?: string) {
    return await this.termsService.findAll(entityId);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.termsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateTermDto: UpdateTermDto) {
    return await this.termsService.update(id, updateTermDto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.termsService.remove(id);
    return { message: 'Term deleted successfully' };
  }

  @Patch(':id/activate')
  @Roles('admin')
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return await this.termsService.activateTerm(id);
  }

  @Patch(':id/deactivate')
  @Roles('admin')
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return await this.termsService.deactivateTerm(id);
  }

  @Get('entity/:entityId/active')
  @Roles('admin')
  async getActiveTerm(@Param('entityId', ParseUUIDPipe) entityId: string) {
    return await this.termsService.getActiveTermForEntity(entityId);
  }
}
