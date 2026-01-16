import { DataVError } from './errors.js';

enum DotPathState {
  START = 'start',
  IN_SEGMENT = 'in_segment',
  ESCAPE = 'escape',
}

export function parseDotPath(input: string): string[] {
  if (!input || input === '.') {
    return [];
  }

  const segments: string[] = [];
  let buffer = '';
  let state = DotPathState.START;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    switch (state) {
    case DotPathState.START: {
      if (ch === '.') {
        if (i === 0) {
          continue;
        }
        throw DataVError.invalidPathSegment(input);
      }

      if (ch === '\\') {
        state = DotPathState.ESCAPE;
        continue;
      }

      buffer += ch;
      state = DotPathState.IN_SEGMENT;
      continue;
    }

    case DotPathState.IN_SEGMENT: {
      if (ch === '.') {
        segments.push(buffer);
        buffer = '';
        state = DotPathState.START;
        continue;
      }

      if (ch === '\\') {
        state = DotPathState.ESCAPE;
        continue;
      }

      buffer += ch;
      continue;
    }

    case DotPathState.ESCAPE: {
      buffer += ch;
      state = DotPathState.IN_SEGMENT;
      continue;
    }

    default:
      throw DataVError.invalidPathSegment(input);
    }
  }

  if (state === DotPathState.ESCAPE) {
    throw DataVError.invalidPathSegment(input);
  }

  if (state === DotPathState.START) {
    throw DataVError.invalidPathSegment(input);
  }

  segments.push(buffer);
  return segments;
}
