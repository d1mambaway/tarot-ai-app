/**
 * Tests for the in-memory rate limiter.
 *
 * checkRateLimit() tracks request counts per key within a time window.
 * It's purely in-memory — no external deps, easy to test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within the limit', () => {
    const key = 'test-allow';
    const result = checkRateLimit(key, 5, 60_000);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests exceeding the limit', () => {
    const key = 'test-block';
    const limit = 3;

    // Use up all 3 allowed requests
    checkRateLimit(key, limit, 60_000);
    checkRateLimit(key, limit, 60_000);
    checkRateLimit(key, limit, 60_000);

    // 4th should be blocked
    const result = checkRateLimit(key, limit, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after the time window expires', () => {
    const key = 'test-reset';
    const limit = 2;
    const windowMs = 10_000;

    checkRateLimit(key, limit, windowMs);
    checkRateLimit(key, limit, windowMs);

    // Should be blocked now
    expect(checkRateLimit(key, limit, windowMs).allowed).toBe(false);

    // Fast forward past the window
    vi.advanceTimersByTime(windowMs + 1);

    // Should be allowed again (new window)
    const result = checkRateLimit(key, limit, windowMs);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('tracks different keys independently', () => {
    const limit = 1;

    checkRateLimit('user-A', limit, 60_000);
    expect(checkRateLimit('user-A', limit, 60_000).allowed).toBe(false);

    // Different key should still be allowed
    expect(checkRateLimit('user-B', limit, 60_000).allowed).toBe(true);
  });

  it('returns correct remaining count', () => {
    const key = 'test-remaining';
    const limit = 5;

    expect(checkRateLimit(key, limit, 60_000).remaining).toBe(4);
    expect(checkRateLimit(key, limit, 60_000).remaining).toBe(3);
    expect(checkRateLimit(key, limit, 60_000).remaining).toBe(2);
    expect(checkRateLimit(key, limit, 60_000).remaining).toBe(1);
    expect(checkRateLimit(key, limit, 60_000).remaining).toBe(0);
  });
});

describe('getRateLimitKey', () => {
  it('extracts IP from X-Forwarded-For header', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    const key = getRateLimitKey(req, 'api');
    expect(key).toBe('api:1.2.3.4');
  });

  it('falls back to "unknown" when no IP header', () => {
    const req = new Request('http://localhost');
    const key = getRateLimitKey(req, 'test');
    expect(key).toBe('test:unknown');
  });

  it('uses prefix in the key', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    });
    expect(getRateLimitKey(req, 'reading')).toBe('reading:10.0.0.1');
    expect(getRateLimitKey(req, 'admin')).toBe('admin:10.0.0.1');
  });
});
