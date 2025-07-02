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
exports.AssociationsController = void 0;
const common_1 = require("@nestjs/common");
const associations_service_1 = require("./associations.service");
const create_association_dto_1 = require("./dto/create-association.dto");
const update_association_dto_1 = require("./dto/update-association.dto");
let AssociationsController = class AssociationsController {
    associationsService;
    constructor(associationsService) {
        this.associationsService = associationsService;
    }
    create(createAssociationDto) {
        return this.associationsService.create(createAssociationDto);
    }
    findAll() {
        return this.associationsService.findAll();
    }
    findOne(id) {
        return this.associationsService.findOne(id);
    }
    update(id, dto) {
        return this.associationsService.update(id, dto);
    }
    remove(id) {
        return this.associationsService.remove(id);
    }
};
exports.AssociationsController = AssociationsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_association_dto_1.CreateAssociationDto]),
    __metadata("design:returntype", void 0)
], AssociationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AssociationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AssociationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_association_dto_1.UpdateAssociationDto]),
    __metadata("design:returntype", void 0)
], AssociationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AssociationsController.prototype, "remove", null);
exports.AssociationsController = AssociationsController = __decorate([
    (0, common_1.Controller)('associations'),
    __metadata("design:paramtypes", [associations_service_1.AssociationsService])
], AssociationsController);
//# sourceMappingURL=associations.controller.js.map