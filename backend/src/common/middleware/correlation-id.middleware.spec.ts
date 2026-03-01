import { CorrelationIdMiddleware, CORRELATION_ID_HEADER } from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let req: Record<string, any>;
  let res: Record<string, jest.Mock>;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    req = { headers: {} };
    res = { setHeader: jest.fn() };
    next = jest.fn();
  });

  it('generates a UUID when no X-Request-ID header is present', () => {
    middleware.use(req as any, res as any, next);

    expect(req.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, req.correlationId);
    expect(next).toHaveBeenCalled();
  });

  it('uses existing X-Request-ID header when present', () => {
    req.headers['x-request-id'] = 'incoming-id-123';

    middleware.use(req as any, res as any, next);

    expect(req.correlationId).toBe('incoming-id-123');
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'incoming-id-123');
    expect(next).toHaveBeenCalled();
  });

  it('sets the response header', () => {
    middleware.use(req as any, res as any, next);

    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, expect.any(String));
  });

  it('rejects X-Request-ID with newlines and generates a UUID instead', () => {
    req.headers['x-request-id'] = 'abc\nerror=INJECTED';

    middleware.use(req as any, res as any, next);

    expect(req.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('rejects X-Request-ID exceeding 128 characters', () => {
    req.headers['x-request-id'] = 'a'.repeat(129);

    middleware.use(req as any, res as any, next);

    expect(req.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('accepts valid alphanumeric X-Request-ID with hyphens and dots', () => {
    req.headers['x-request-id'] = 'req-abc.123:456';

    middleware.use(req as any, res as any, next);

    expect(req.correlationId).toBe('req-abc.123:456');
  });

  it('reuses req.correlationId when already set by pino genReqId', () => {
    req.correlationId = 'pre-set-by-pino';
    req.headers['x-request-id'] = 'header-value';

    middleware.use(req as any, res as any, next);

    expect(req.correlationId).toBe('pre-set-by-pino');
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'pre-set-by-pino');
  });
});
