import { DataVError } from './errors.js';

export function parseDotPath(input: string): string[] {
  if (!input || input === '.') {
    return [];
  }

  const segments: string[] = [];
  let buffer = '';
  let isEscaping = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (isEscaping) {
      buffer += char;
      isEscaping = false;
      continue;
    }

    if (char === '\\') {
      isEscaping = true;
      continue;
    }

    if (char === '.') {
      if (buffer.length === 0) {
        if (i === 0) {
          continue;
        }
        throw DataVError.invalidPathSegment(input);
      }

      segments.push(buffer);
      buffer = '';
      continue;
    }

    buffer += char;
  }

  if (isEscaping) {
    throw DataVError.invalidPathSegment(input);
  }

  if (buffer.length === 0) {
    throw DataVError.invalidPathSegment(input);
  }

  segments.push(buffer);
  return segments;
}
