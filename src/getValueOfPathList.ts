import { createArrayAccessor } from './createArrayAccessor.js';

const getValue = (dataKey: string) => (obj: Record<string, unknown> | null): unknown => {
  if (obj == null) {
    return null;
  }
  if (!Object.hasOwnProperty.call(obj, dataKey)) {
    return null;
  }
  return obj[dataKey];
};

const walk = (obj: unknown, nameList: string[]): unknown => {
  const [dataKey, ...other] = nameList;
  if (Array.isArray(obj)) {
    const value = createArrayAccessor(dataKey)(obj);
    if (value == null) {
      return null;
    }
    if (other.length === 0) {
      return value;
    }
    return walk(value, other);
  }
  const value = getValue(dataKey)(obj as Record<string, unknown>);
  if (value == null) {
    return null;
  }
  if (other.length === 0) {
    return value;
  }
  return walk(value, other);
};

export default function getValueOfPathList(pathList: string[]): (data: unknown) => unknown {
  if (pathList.length === 0) {
    return (data: unknown) => data;
  }
  if (pathList.length === 1) {
    return (data: unknown) => {
      if (Array.isArray(data)) {
        return createArrayAccessor(pathList[0])(data);
      }
      return getValue(pathList[0])(data as Record<string, unknown>);
    };
  }
  return (data: unknown) => walk(data, pathList);
}
