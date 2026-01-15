import { createArrayAccessor } from './createArrayAccessor.js';
import { createPathAccessor } from './createPathAccessor.js';
import { parseDotPath } from './parseDotPath.js';

export function createDataAccessor(pathname: string | number | null): (data: unknown) => unknown {
  if (pathname == null) {
    return () => null;
  }

  if (typeof pathname === 'number') {
    const arrayAccessor = createArrayAccessor(pathname);
    return (data: unknown) => {
      if (!Array.isArray(data)) {
        return null;
      }
      return arrayAccessor(data);
    };
  }

  if (typeof pathname === 'string') {
    const parsedPath = parseDotPath(pathname);
    return createPathAccessor(parsedPath);
  }

  return () => null;
}
