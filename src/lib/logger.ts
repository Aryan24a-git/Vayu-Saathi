// Satisfies: OBS-001, OBS-002, SEC-009
// Structured JSON logger with automatic redaction of sensitive fields.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const REDACTED_FIELDS = new Set([
  'lat', 'lon', 'latitude', 'longitude', 'coordinates', 'coord',
  'query', 'freeText', 'question', 'userInput', 'followUp',
  'apiKey', 'key', 'token', 'secret', 'password', 'authorization',
]);

function redact(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[DEEP]';
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => redact(item, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACTED_FIELDS.has(key)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redact(value, depth + 1);
    }
  }
  return result;
}

function shouldLog(level: LogLevel): boolean {
  const currentLevel = (process.env['LOG_LEVEL'] as LogLevel) || 'info';
  const targetVal = LEVEL_ORDER[level] ?? 1;
  const currentVal = LEVEL_ORDER[currentLevel] ?? 1;
  return targetVal >= currentVal;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? (redact(meta) as Record<string, unknown>) : {}),
  };

  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};
