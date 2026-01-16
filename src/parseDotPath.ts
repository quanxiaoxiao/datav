import { DataVError } from './errors.js';

export function parseDotPath(input: string): string[] {
  if (input === '' || input === '.') {
    return [];
  }

  const segments: string[] = [];
  let buffer = '';

  let i = 0;
  let escaping = false;
  let isStart = true;

  const throwInvalid = (): never => {
    throw DataVError.invalidPathSegment(input);
  };

  while (i < input.length) {
    const ch = input[i];

    if (escaping) {
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
        if (isStart) {
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

  if (escaping) {
    throwInvalid();
  }

  if (buffer.length === 0) {
    throwInvalid();
  }

  segments.push(buffer);
  return segments;
}
