import { DataVError } from './errors.js';

export function parseDotPath(input: string): string[] {
  if (input === '' || input === '.') {
    return [];
  }

  const segments: string[] = [];
  let buffer = '';

  let i = 0;
  let escaping = false;
  let isStart = true; // whether we are before the first real segment

  const throwInvalid = (): never => {
    throw DataVError.invalidPathSegment(input);
  };

  while (i < input.length) {
    const ch = input[i];

    if (escaping) {
      // '\' escapes ANY character
      buffer += ch;
      escaping = false;
      i++;
      continue;
    }

    if (ch === '\\') {
      escaping = true;
      i++;
      continue;
    }

    if (ch === '.') {
      if (buffer.length === 0) {
        // empty segment
        if (isStart) {
          // allow exactly one leading empty segment
          isStart = false;
          i++;
          continue;
        }
        throwInvalid();
      }

      segments.push(buffer);
      buffer = '';
      isStart = false;
      i++;
      continue;
    }

    buffer += ch;
    isStart = false;
    i++;
  }

  // dangling escape
  if (escaping) {
    throwInvalid();
  }

  // handle last segment
  if (buffer.length === 0) {
    // ending with '.'
    throwInvalid();
  }

  segments.push(buffer);
  return segments;
}
