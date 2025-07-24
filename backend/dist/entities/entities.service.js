"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entity_entity_1 = require("./entity.entity");
let EntitiesService = class EntitiesService {
    entityRepository;
    async create(dto) {
        const parent = await this.validateHierarchy(dto.type, dto.parentId);
        const entity = this.entityRepository.create({
            ...dto,
            parent,
            is_active: true,
        });
        return this.entityRepository.save(entity);
    }
    async findAll() {
        return this.entityRepository.find({
            relations: ["parent"],
            order: { created_at: "DESC" },
        });
    }
    async findOne(id) {
        const entity = await this.entityRepository.findOne({
            where: { id },
            relations: ["parent"],
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Entity with id '${id}' not found`);
        }
        return entity;
    }
    async update(id, dto) {
        const entity = await this.entityRepository.findOne({ where: { id } });
        if (!entity) {
            throw new common_1.NotFoundException(`Entity with id '${id}' not found`);
        }
        if (dto.type && dto.parentId !== undefined) {
            const parent = await this.validateHierarchy(dto.type, dto.parentId);
            entity.parent = parent;
        }
        Object.assign(entity, dto);
        return this.entityRepository.save(entity);
    }
    async remove(id) {
        const entity = await this.entityRepository.findOne({ where: { id } });
        if (!entity) {
            throw new common_1.NotFoundException(`Entity with id '${id}' not found`);
        }
        await this.entityRepository.remove(entity);
        return { deleted: true };
    }
    constructor(entityRepository) {
        this.entityRepository = entityRepository;
    }
    async validateHierarchy(type, parentId) {
        let parent = null;
        if (parentId) {
            parent = await this.entityRepository.findOne({ where: { id: parentId } });
            if (!parent) {
                throw new common_1.NotFoundException("Parent entity not found");
            }
        }
        if (type === entity_entity_1.EntityType.UNION && parent !== null) {
            throw new common_1.BadRequestException("A UNION cannot have a parent");
        }
        if (type === entity_entity_1.EntityType.ASSOCIATION) {
            if (!parent || parent.type !== entity_entity_1.EntityType.UNION) {
                throw new common_1.BadRequestException("An ASSOCIATION must have a UNION as parent");
            }
        }
        if (type === entity_entity_1.EntityType.FIELD) {
            if (!parent || parent.type !== entity_entity_1.EntityType.ASSOCIATION) {
                throw new common_1.BadRequestException("A FIELD must have an ASSOCIATION as parent");
            }
        }
        return parent;
    }
};
exports.EntitiesService = EntitiesService;
exports.EntitiesService = EntitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entity_entity_1.Entity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EntitiesService);
//# sourceMappingURL=entities.service.js.map