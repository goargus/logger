"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAssociationDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_association_dto_1 = require("./create-association.dto");
class UpdateAssociationDto extends (0, mapped_types_1.PartialType)(create_association_dto_1.CreateAssociationDto) {
}
exports.UpdateAssociationDto = UpdateAssociationDto;
//# sourceMappingURL=update-association.dto.js.map