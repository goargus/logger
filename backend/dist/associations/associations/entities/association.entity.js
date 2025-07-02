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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Association = void 0;
const typeorm_1 = require("typeorm");
const union_entity_1 = require("../../../unions/entities/union.entity");
const church_entity_1 = require("../../../churches/entities/church.entity");
let Association = class Association {
    id;
    name;
    union;
    churches;
    unionId;
};
exports.Association = Association;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Association.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Association.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => union_entity_1.Union, (union) => union.associations, {
        onDelete: 'CASCADE',
    }),
    __metadata("design:type", union_entity_1.Union)
], Association.prototype, "union", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => church_entity_1.Church, (church) => church.association),
    __metadata("design:type", Object)
], Association.prototype, "churches", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Association.prototype, "unionId", void 0);
exports.Association = Association = __decorate([
    (0, typeorm_1.Entity)()
], Association);
//# sourceMappingURL=association.entity.js.map