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
exports.AssociationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const association_entity_1 = require("./entities/association.entity");
let AssociationsService = class AssociationsService {
    associationRepo;
    constructor(associationRepo) {
        this.associationRepo = associationRepo;
    }
    async create(createDto) {
        const association = this.associationRepo.create({
            name: createDto.name,
            union: { id: createDto.unionId },
        });
        return this.associationRepo.save(association);
    }
    findAll() {
        return this.associationRepo.find({ relations: ['union'] });
    }
    findOne(id) {
        return this.associationRepo.findOne({
            where: { id },
            relations: ['union'],
        });
    }
    async update(id, updateDto) {
        await this.associationRepo.update(id, updateDto);
        return this.findOne(id);
    }
    remove(id) {
        return this.associationRepo.delete(id);
    }
};
exports.AssociationsService = AssociationsService;
exports.AssociationsService = AssociationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(association_entity_1.Association)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AssociationsService);
//# sourceMappingURL=associations.service.js.map