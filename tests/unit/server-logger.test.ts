// Satisfies: TEST-001, SEC-009, OBS-001
import { describe, it, expect } from 'vitest';
import { createLogger } from '../../src/server/logging/logger';
import { Writable } from 'stream';

describe('Server Structured Logger & Redaction', () => {
  it('redacts lat, lon, question, and secret keys (SEC-009)', async () => {
    let output = '';
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });

    const testLogger = createLogger({}, stream);

    testLogger.info(
      {
        lat: 28.6139,
        lon: 77.209,
        question: 'Is it safe to run outdoors today?',
        apiKey: 'secret_12345',
        safeField: 'winter-smog-routine',
      },
      'Test audit log'
    );

    expect(output).not.toContain('28.6139');
    expect(output).not.toContain('77.209');
    expect(output).not.toContain('Is it safe to run outdoors today?');
    expect(output).not.toContain('secret_12345');

    const parsed = JSON.parse(output);
    expect(parsed.lat).toBe('[REDACTED]');
    expect(parsed.lon).toBe('[REDACTED]');
    expect(parsed.question).toBe('[REDACTED]');
    expect(parsed.apiKey).toBe('[REDACTED]');
    expect(parsed.safeField).toBe('winter-smog-routine');
    expect(parsed.msg).toBe('Test audit log');
  });
});
