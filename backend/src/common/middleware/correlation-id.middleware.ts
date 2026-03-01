import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'X-Request-ID';

const VALID_CORRELATION_ID = /^[\w.:\-]{1,128}$/;

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers[CORRELATION_ID_HEADER.toLowerCase()] as string | undefined;
    const correlationId =
      (req as any).correlationId ||
      (incoming && VALID_CORRELATION_ID.test(incoming) ? incoming : randomUUID());

    (req as any).correlationId = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    next();
  }
}
