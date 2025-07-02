"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChurchesService = void 0;
const common_1 = require("@nestjs/common");
class ChurchesService {
    associationRepository;
    churchRepository;
    constructor(associationRepository, churchRepository) {
        this.associationRepository = associationRepository;
        this.churchRepository = churchRepository;
    }
    async create(createChurchDto) {
        const association = await this.associationRepository.findOne({
            where: { id: createChurchDto.associationId },
        });
        if (!association)
            throw new common_1.NotFoundException('Association not found');
        const church = this.churchRepository.create({
            name: createChurchDto.name,
            association,
        });
        return this.churchRepository.save(church);
    }
    findAll() {
        return this.churchRepository.find({ relations: ['association'] });
    }
    findOne(id) {
        return this.churchRepository.findOne({
            where: { id },
            relations: ['association'],
        });
    }
    remove(id) {
        return this.churchRepository.delete(id);
    }
}
exports.ChurchesService = ChurchesService;
//# sourceMappingURL=churches.service.js.map