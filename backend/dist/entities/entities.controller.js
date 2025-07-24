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
exports.EntitiesController = void 0;
const common_1 = require("@nestjs/common");
const entities_service_1 = require("./entities.service");
const update_entity_dto_1 = require("./dto/update-entity.dto");
const create_entity_dto_1 = require("./dto/create-entity.dto");
let EntitiesController = class EntitiesController {
    entitiesService;
    constructor(entitiesService) {
        this.entitiesService = entitiesService;
    }
    create(body) {
        return this.entitiesService.create(body);
    }
    findAll() {
        return this.entitiesService.findAll();
    }
    findOne(id) {
        return this.entitiesService.findOne(id);
    }
    update(id, updateDto) {
        return this.entitiesService.update(id, updateDto);
    }
    remove(id) {
        return this.entitiesService.remove(id);
    }
};
exports.EntitiesController = EntitiesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_entity_dto_1.CreateEntityDto]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_entity_dto_1.UpdateEntityDto]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "remove", null);
exports.EntitiesController = EntitiesController = __decorate([
    (0, common_1.Controller)("entities"),
    __metadata("design:paramtypes", [entities_service_1.EntitiesService])
], EntitiesController);
//# sourceMappingURL=entities.controller.js.map