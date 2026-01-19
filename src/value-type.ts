import { DataVError } from './errors.js';
import { isPlainObject } from './utils.js';

const DATA_TYPE_NUMBER = 'number';
const DATA_TYPE_STRING = 'string';
const DATA_TYPE_BOOLEAN = 'boolean';
const DATA_TYPE_JSON = 'json';
const DATA_TYPE_ARRAY = 'array';
const DATA_TYPE_OBJECT = 'object';
const DATA_TYPE_INTEGER = 'integer';

export type DataType =
  | typeof DATA_TYPE_NUMBER
  | typeof DATA_TYPE_STRING
  | typeof DATA_TYPE_BOOLEAN
  | typeof DATA_TYPE_JSON
  | typeof DATA_TYPE_ARRAY
  | typeof DATA_TYPE_OBJECT
  | typeof DATA_TYPE_INTEGER;

type ValueTransformer = (value: unknown) => unknown;

const typeNameMap: Record<DataType, string> = {
  [DATA_TYPE_NUMBER]: 'number',
  [DATA_TYPE_STRING]: 'string',
  [DATA_TYPE_INTEGER]: 'integer',
  [DATA_TYPE_BOOLEAN]: 'boolean',
  [DATA_TYPE_JSON]: 'object',
  [DATA_TYPE_ARRAY]: 'object',
  [DATA_TYPE_OBJECT]: 'object',
};

const isEmpty = (value: unknown): boolean => value === '' || value == null;

const isSafeNumberValue = (value: number): boolean => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return false;
  }
  return true;
};

const toSafeNumber = (value: unknown, isInteger: boolean): number | null => {
  if (isEmpty(value)) {
    return null;
  }

  const valueType = typeof value;
  if (valueType !== 'number' && valueType !== 'string') {
    return null;
  }

  if (valueType === 'number' && !isSafeNumberValue(value as number)) {
    return null;
  }

  const number = Number(value);
  if (!isSafeNumberValue(number)) {
    return null;
  }

  if (!isInteger) {
    return number;
  }

  if (String(number) !== String(value)) {
    return null;
  }

  const integer = parseInt(number.toString(), 10);
  if (String(integer) !== String(value)) {
    return null;
  }
  return integer;
};

const safeJsonParse = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const typeTransformers: Record<DataType, ValueTransformer> = {
  [DATA_TYPE_STRING]: (value) => {
    if (typeof value === 'string') {
      return value;
    }
    if (value == null) {
      return null;
    }
    if (typeof value.toString === 'function') {
      return value.toString();
    }
    return JSON.stringify(value);
  },

  [DATA_TYPE_INTEGER]: (value) => toSafeNumber(value, true),

  [DATA_TYPE_NUMBER]: (value) => toSafeNumber(value, false),

  [DATA_TYPE_BOOLEAN]: (value) => {
    if (value === 'false' || value === false) {
      return false;
    }
    if (value === 'true' || value === true) {
      return true;
    }
    return null;
  },

  [DATA_TYPE_JSON]: (value) => safeJsonParse(value),

  [DATA_TYPE_OBJECT]: (value) => {
    const parsed = safeJsonParse(value);
    if (parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  },

  [DATA_TYPE_ARRAY]: (value) => {
    const parsed = safeJsonParse(value);
    return Array.isArray(parsed) ? parsed : [];
  },
};

export function parseValueByType(value: unknown, type: DataType): unknown {
  if (type == null) {
    throw DataVError.emptyDataType();
  }
  if (!Object.hasOwn(typeTransformers, type)) {
    throw DataVError.invalidDataType(type);
  }

  if (value == null) {
    return type === DATA_TYPE_ARRAY ? [] : null;
  }

  const valueType = typeof value;

  if (valueType !== 'string') {
    if (type === DATA_TYPE_INTEGER || type === DATA_TYPE_STRING) {
      return typeTransformers[type](value);
    }

    if (valueType === typeNameMap[type]) {
      if (type === DATA_TYPE_NUMBER) {
        return isSafeNumberValue(value as number) ? value : null;
      }
      if (type === DATA_TYPE_ARRAY) {
        return Array.isArray(value) ? value : [];
      }
      if (type === DATA_TYPE_OBJECT) {
        return isPlainObject(value) ? value : null;
      }
      return value;
    }

    return type === DATA_TYPE_ARRAY ? [] : null;
  }

  return typeTransformers[type](value);
}

export {
  DATA_TYPE_ARRAY,
  DATA_TYPE_BOOLEAN,
  DATA_TYPE_INTEGER,
  DATA_TYPE_JSON,
  DATA_TYPE_NUMBER,
  DATA_TYPE_OBJECT,
  DATA_TYPE_STRING,
};

export const toString = (v: unknown): string | null =>
  parseValueByType(v, DATA_TYPE_STRING) as string | null;

export const toNumber = (v: unknown): number | null =>
  parseValueByType(v, DATA_TYPE_NUMBER) as number | null;

export const toInteger = (v: unknown): number | null =>
  parseValueByType(v, DATA_TYPE_INTEGER) as number | null;

export const toBoolean = (v: unknown): boolean | null =>
  parseValueByType(v, DATA_TYPE_BOOLEAN) as boolean | null;

export const toArray = (v: unknown): unknown[] =>
  parseValueByType(v, DATA_TYPE_ARRAY) as unknown[];

export const toObject = (v: unknown): Record<string, unknown> | null =>
  parseValueByType(v, DATA_TYPE_OBJECT) as Record<string, unknown> | null;

export const toJson = (v: unknown): unknown =>
  parseValueByType(v, DATA_TYPE_JSON);
