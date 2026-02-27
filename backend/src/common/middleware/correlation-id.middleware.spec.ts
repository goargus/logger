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
});
