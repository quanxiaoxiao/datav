export function parseDotPath(path: string): string[] {
  const normalizedPath = path.startsWith('.') ? path.slice(1) : path;
  if (normalizedPath === '') {
    return [];
  }
  const segments = normalizedPath
    .split(/(?<!\\)\./)
    .map((segment) => segment.replace(/\\\./g, '.'));
  if (segments.some((segment) => segment === '')) {
    throw new Error(`Path "${path}" parse failed: contains empty segment`);
  }
  return segments;
}
