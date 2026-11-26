// Satisfies: TEST-001, EC-001
import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, mapResult, unwrapOr } from '../../src/domain/result';

describe('Domain Result Pattern', () => {
  it('handles ok and err results correctly', () => {
    const success = ok(42);
    expect(isOk(success)).toBe(true);
    expect(isErr(success)).toBe(false);
    expect(unwrapOr(success, 0)).toBe(42);

    const failure = err('Something failed');
    expect(isOk(failure)).toBe(false);
    expect(isErr(failure)).toBe(true);
    expect(unwrapOr(failure, 0)).toBe(0);
  });

  it('maps ok results and preserves err results', () => {
    const success = ok(10);
    const doubled = mapResult(success, (n) => n * 2);
    expect(isOk(doubled)).toBe(true);
    if (isOk(doubled)) {
      expect(doubled.value).toBe(20);
    }

    const failure = err('error message');
    const mappedErr = mapResult(failure, (n: number) => n * 2);
    expect(isErr(mappedErr)).toBe(true);
    if (isErr(mappedErr)) {
      expect(mappedErr.error).toBe('error message');
    }
  });
});
