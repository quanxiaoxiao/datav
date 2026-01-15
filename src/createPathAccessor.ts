import { createArrayAccessor } from './createArrayAccessor.js';

const getObjectValue = (key: string) => (obj: Record<string, unknown> | null): unknown => {
  if (obj == null || !Object.hasOwnProperty.call(obj, key)) {
    return null;
  }
  return obj[key];
};

const traversePath = (target: unknown, pathSegments: string[]): unknown => {
  const [currentKey, ...remainingPath] = pathSegments;

  if (Array.isArray(target)) {
    const value = createArrayAccessor(currentKey)(target);
    if (value == null || remainingPath.length === 0) {
      return value;
    }
    return traversePath(value, remainingPath);
  }

  const value = getObjectValue(currentKey)(target as Record<string, unknown>);
  if (value == null || remainingPath.length === 0) {
    return value;
  }

  return traversePath(value, remainingPath);
};

export function createPathAccessor(pathSegments: string[]): (data: unknown) => unknown {
  if (pathSegments.length === 0) {
    return (data: unknown) => data;
  }

  if (pathSegments.length === 1) {
    const key = pathSegments[0];
    return (data: unknown) => {
      if (Array.isArray(data)) {
        return createArrayAccessor(key)(data);
      }
      return getObjectValue(key)(data as Record<string, unknown>);
    };
  }

  return (data: unknown) => traversePath(data, pathSegments);
}
