import { createArrayAccessor } from './createArrayAccessor.js';
import getValueOfPathList from './getValueOfPathList.js';
import { parseDotPath } from './parseDotPath.js';

export default function getValueOfPathname(pathname: string | number | null): (data: unknown) => unknown {
  if (pathname == null) {
    return () => null;
  }
  const type = typeof pathname;
  if (type === 'number') {
    return (data: unknown) => {
      if (!Array.isArray(data)) {
        return null;
      }
      return createArrayAccessor(pathname)(data);
    };
  }
  if (type !== 'string') {
    return () => null;
  }
  return getValueOfPathList(parseDotPath(pathname as string));
}
