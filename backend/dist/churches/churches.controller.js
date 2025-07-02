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
exports.ChurchesController = void 0;
const common_1 = require("@nestjs/common");
const churches_service_1 = require("./churches.service");
const create_church_dto_1 = require("./dto/create-church.dto");
const update_church_dto_1 = require("./dto/update-church.dto");
let ChurchesController = class ChurchesController {
    churchesService;
    constructor(churchesService) {
        this.churchesService = churchesService;
    }
    create(createChurchDto) {
        return this.churchesService.create(createChurchDto);
    }
    findAll() {
        return this.churchesService.findAll();
    }
    findOne(id) {
        return this.churchesService.findOne(+id);
    }
    update(id, updateChurchDto) {
        return this.churchesService.update(+id, updateChurchDto);
    }
    remove(id) {
        return this.churchesService.remove(+id);
    }
};
exports.ChurchesController = ChurchesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_church_dto_1.CreateChurchDto]),
    __metadata("design:returntype", void 0)
], ChurchesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChurchesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChurchesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_church_dto_1.UpdateChurchDto]),
    __metadata("design:returntype", void 0)
], ChurchesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChurchesController.prototype, "remove", null);
exports.ChurchesController = ChurchesController = __decorate([
    (0, common_1.Controller)('churches'),
    __metadata("design:paramtypes", [churches_service_1.ChurchesService])
], ChurchesController);
//# sourceMappingURL=churches.controller.js.map