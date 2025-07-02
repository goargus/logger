"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChurchDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_church_dto_1 = require("./create-church.dto");
class UpdateChurchDto extends (0, mapped_types_1.PartialType)(create_church_dto_1.CreateChurchDto) {
}
exports.UpdateChurchDto = UpdateChurchDto;
//# sourceMappingURL=update-church.dto.js.map