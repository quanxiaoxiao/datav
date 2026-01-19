import { parseDotPath } from './dot-path.js';
import { toInteger } from './parse-value-by-type.js';

export type DataAccessor = (data: unknown) => unknown;

const ROOT_SYMBOL = '$';

const getArrayElement = (array: unknown[], index: number): unknown => {
  const len = array.length;
  if (len === 0) return null;

  const actualIndex = index < 0 ? len + index : index;

  return actualIndex >= 0 && actualIndex < len ? array[actualIndex] : null;
};

export function createArrayAccessor(index: string): DataAccessor {
  const numericIndex = toInteger(index);

  if (numericIndex == null) {
    return () => null;
  }

  return (array: unknown) =>
    Array.isArray(array) ? getArrayElement(array, numericIndex) : null;
}

const createObjectAccessor = (key: string): DataAccessor => {
  return (obj: unknown) => {
    if (obj == null || typeof obj !== 'object') return null;

    const record = obj as Record<string, unknown>;
    return Object.hasOwnProperty.call(record, key) ? record[key] : null;
  };
};

const traversePath = (target: unknown, pathSegments: string[]): unknown => {
  if (pathSegments.length === 0) {
    return target;
  }

  const [currentKey, ...remainingPath] = pathSegments;

  const accessor: (target: unknown) => unknown = Array.isArray(target)
    ? createArrayAccessor(currentKey)
    : createObjectAccessor(currentKey);

  const value = accessor(target);

  if (value == null || remainingPath.length === 0) {
    return value;
  }

  return traversePath(value, remainingPath);
};

export function createPathAccessor(pathSegments: string[]): DataAccessor {
  const len = pathSegments.length;
  if (len === 0) {
    return (data: unknown) => data;
  }

  const hasRootSymbol = pathSegments[0] === ROOT_SYMBOL;
  const effectiveSegments = hasRootSymbol ? pathSegments.slice(1) : pathSegments;
  const effectiveLen = effectiveSegments.length;

  if (effectiveLen === 0) {
    return (data: unknown) => data;
  }

  if (effectiveLen === 1) {
    const key = effectiveSegments[0];
    return (data: unknown) => {
      const target = hasRootSymbol ? data : (data as Record<string, unknown>);
      if (Array.isArray(target)) {
        return createArrayAccessor(key)(target);
      }
      return createObjectAccessor(key)(target as Record<string, unknown>);
    };
  }

  return (data: unknown) => {
    const target = hasRootSymbol ? data : data;
    return traversePath(target, effectiveSegments);
  };
}

export function createDataAccessor(pathname: string): DataAccessor {
  if (typeof pathname !== 'string') {
    throw new TypeError('pathname must be a string');
  }
  const parsedPath = parseDotPath(pathname);
  return createPathAccessor(parsedPath);
}

export { ROOT_SYMBOL };
