import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RankingsQueryDto } from './report-query.dto';

describe('RankingsQueryDto', () => {
  it('accepts topN as a valid legacy query parameter', async () => {
    const dto = plainToInstance(RankingsQueryDto, { topN: '10' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.topN).toBe(10);
  });

  it('prioritizes limit when both limit and topN are provided', async () => {
    const dto = plainToInstance(RankingsQueryDto, { limit: '7', topN: '10' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(7);
  });
});
