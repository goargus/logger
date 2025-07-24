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
exports.Entity = exports.EntityType = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
var EntityType;
(function (EntityType) {
    EntityType["UNION"] = "UNION";
    EntityType["ASSOCIATION"] = "ASSOCIATION";
    EntityType["FIELD"] = "FIELD";
})(EntityType || (exports.EntityType = EntityType = {}));
let Entity = class Entity {
    id;
    name;
    type;
    parent;
    code;
    location;
    is_active;
    created_at;
    updated_at;
};
exports.Entity = Entity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Entity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Entity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: EntityType }),
    (0, class_validator_1.IsEnum)(EntityType),
    __metadata("design:type", String)
], Entity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Entity, { nullable: true }),
    __metadata("design:type", Object)
], Entity.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Entity.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Entity.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Entity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Entity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Entity.prototype, "updated_at", void 0);
exports.Entity = Entity = __decorate([
    (0, typeorm_1.Entity)("entity")
], Entity);
//# sourceMappingURL=entity.entity.js.map