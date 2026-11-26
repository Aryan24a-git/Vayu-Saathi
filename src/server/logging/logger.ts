// Satisfies: SEC-009, OBS-001, EC-003
// Pino-based structured logger with strict redaction of PII, coordinates, and secrets.

import pino, { type LoggerOptions, type DestinationStream } from 'pino';

export const REDACTED_PATHS = [
  'lat',
  'lon',
  'latitude',
  'longitude',
  'coordinates',
  'question',
  'userInput',
  'freeText',
  'authorization',
  'apiKey',
  'token',
  'secret',
  '*.lat',
  '*.lon',
  '*.question',
  '*.authorization',
  '*.apiKey',
  '*.token',
  '*.*.lat',
  '*.*.lon',
  '*.*.question',
];

export function createLogger(options?: LoggerOptions, destination?: DestinationStream) {
  return pino(
    {
      level: process.env['LOG_LEVEL'] || 'info',
      redact: {
        paths: REDACTED_PATHS,
        censor: '[REDACTED]',
      },
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      ...options,
    },
    destination
  );
}

export const logger = createLogger();
