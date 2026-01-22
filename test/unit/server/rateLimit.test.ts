import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock event type
interface MockEvent {
  path: string
}

// Mock Nitro auto-imports as globals
const mockGetRequestIP = vi.fn()
const mockSetResponseHeader = vi.fn()
const mockCreateError = vi.fn((opts: { statusCode: number, message: string }) => {
  const error = new Error(opts.message) as Error & { statusCode: number }
  error.statusCode = opts.statusCode
  return error
})

// Stub globals BEFORE importing the middleware
vi.stubGlobal('defineEventHandler', <T>(handler: T) => handler)
vi.stubGlobal('getRequestIP', mockGetRequestIP)
vi.stubGlobal('setResponseHeader', mockSetResponseHeader)
vi.stubGlobal('createError', mockCreateError)

describe('Rate Limit Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should allow requests under the limit', async () => {
    // Fresh import to reset the requests Map
    const { default: middleware } = await import('../../../server/middleware/rateLimit')

    const mockEvent = {
      path: '/api/v1/modules',
    }

    mockGetRequestIP.mockReturnValue('192.168.1.1')

    // First request should pass
    expect(() => middleware(mockEvent as MockEvent)).not.toThrow()
  })

  it('should skip non-v1 API paths', async () => {
    const { default: middleware } = await import('../../../server/middleware/rateLimit')

    const mockEvent = {
      path: '/api/sync',
    }

    // Should return early without checking IP
    const result = middleware(mockEvent as MockEvent)
    expect(result).toBeUndefined()
    expect(mockGetRequestIP).not.toHaveBeenCalled()
  })

  it('should block requests over the limit', async () => {
    const { default: middleware } = await import('../../../server/middleware/rateLimit')

    const mockEvent = {
      path: '/api/v1/modules',
    }

    mockGetRequestIP.mockReturnValue('192.168.1.2')

    // Make 60 requests (the limit)
    for (let i = 0; i < 60; i++) {
      expect(() => middleware(mockEvent as MockEvent)).not.toThrow()
    }

    // 61st request should throw 429
    expect(() => middleware(mockEvent as MockEvent)).toThrow()
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 429,
      message: 'Too Many Requests - limit 60/min',
    })
    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      mockEvent,
      'Retry-After',
      expect.any(Number),
    )
  })

  it('should track different IPs separately', async () => {
    const { default: middleware } = await import('../../../server/middleware/rateLimit')

    const mockEvent = {
      path: '/api/v1/modules',
    }

    // IP 1: make 60 requests
    mockGetRequestIP.mockReturnValue('10.0.0.1')
    for (let i = 0; i < 60; i++) {
      middleware(mockEvent as MockEvent)
    }

    // IP 2: should still be able to make requests
    mockGetRequestIP.mockReturnValue('10.0.0.2')
    expect(() => middleware(mockEvent as MockEvent)).not.toThrow()
  })

  it('should reset after window expires', async () => {
    vi.useFakeTimers()

    const { default: middleware } = await import('../../../server/middleware/rateLimit')

    const mockEvent = {
      path: '/api/v1/modules',
    }

    mockGetRequestIP.mockReturnValue('192.168.1.3')

    // Exhaust the limit
    for (let i = 0; i < 61; i++) {
      try {
        middleware(mockEvent as MockEvent)
      }
      catch {
        // Expected on 61st request
      }
    }

    // Advance time past the window (60 seconds)
    vi.advanceTimersByTime(61_000)

    // Should be able to make requests again
    expect(() => middleware(mockEvent as MockEvent)).not.toThrow()

    vi.useRealTimers()
  })
})
