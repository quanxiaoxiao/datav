import { DataVError } from './errors.js';

export function parseDotPath(path: string): string[] {
  const normalizedPath = path.startsWith('.') ? path.slice(1) : path;
  if (normalizedPath === '') {
    return [];
  }
  const segments = normalizedPath
    .split(/(?<!\\)\./)
    .map((segment) => segment.replace(/\\\./g, '.'));
  if (segments.some((segment) => segment === '')) {
    throw DataVError.invalidPathSegment(path);
  }
  return segments;
}
