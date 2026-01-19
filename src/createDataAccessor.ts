import { parseDotPath } from './parseDotPath.js';
import { toInteger } from './parseValueByType.js';

type DataAccessor = (data: unknown) => unknown;

const getArrayElement = (array: unknown[], index: number): unknown => {
  const len = array.length;
  if (len === 0) return null;

  const actualIndex = index < 0 ? len + index : index;

  return actualIndex >= 0 && actualIndex < len ? array[actualIndex] : null;
};

export function createArrayAccessor(index: string): (array: unknown[]) => unknown {
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

  const accessor = Array.isArray(target)
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

  if (len === 1) {
    const key = pathSegments[0];
    return (data: unknown) => {
      if (Array.isArray(data)) {
        return createArrayAccessor(key)(data);
      }
      return createObjectAccessor(key)(data as Record<string, unknown>);
    };
  }

  return (data: unknown) => traversePath(data, pathSegments);
}

export function createDataAccessor(pathname: string): DataAccessor {
  if (typeof pathname !== 'string') {
    throw new TypeError('pathname must be a string');
  }
  const parsedPath = parseDotPath(pathname);
  return createPathAccessor(parsedPath);
}
