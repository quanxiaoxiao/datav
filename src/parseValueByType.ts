import { isPlainObject } from './utils.js';

const DATA_TYPE_NUMBER = 'number';
const DATA_TYPE_STRING = 'string';
const DATA_TYPE_BOOLEAN = 'boolean';
const DATA_TYPE_JSON = 'json';
const DATA_TYPE_ARRAY = 'array';
const DATA_TYPE_OBJECT = 'object';
const DATA_TYPE_INTEGER = 'integer';

type DataType =
  | typeof DATA_TYPE_NUMBER
  | typeof DATA_TYPE_STRING
  | typeof DATA_TYPE_BOOLEAN
  | typeof DATA_TYPE_JSON
  | typeof DATA_TYPE_ARRAY
  | typeof DATA_TYPE_OBJECT
  | typeof DATA_TYPE_INTEGER;

type ValueTransformer = (value: unknown) => unknown;

const typeTransformers: Record<DataType, ValueTransformer> = {
  [DATA_TYPE_STRING]: (value) => {
    if (typeof value === 'string') {
      return value;
    }
    const strVal = value as { toString?: () => string };
    return strVal.toString ? strVal.toString() : JSON.stringify(value);
  },

  [DATA_TYPE_INTEGER]: (value) => {
    if (value === '' || value == null) {
      return null;
    }

    const valueType = typeof value;
    if (valueType !== 'number' && valueType !== 'string') {
      return null;
    }

    const number = Number(value);
    if (Number.isNaN(number)) {
      return null;
    }

    if (String(number) !== String(value)) {
      return null;
    }

    return parseInt(number.toString(), 10);
  },

  [DATA_TYPE_NUMBER]: (value) => {
    if (value === '' || value == null) {
      return null;
    }

    const number = Number(value);
    if (Number.isNaN(number)) {
      return null;
    }

    if (String(number) !== String(value)) {
      return null;
    }

    return number;
  },

  [DATA_TYPE_BOOLEAN]: (value) => {
    if (value !== 'false' && value !== 'true') {
      return null;
    }
    return value === 'true';
  },

  [DATA_TYPE_JSON]: (value) => {
    try {
      return JSON.parse(value as string);
    } catch {
      return null;
    }
  },

  [DATA_TYPE_OBJECT]: (value) => {
    try {
      const parsed = JSON.parse(value as string);

      if (Array.isArray(parsed) || typeof parsed !== 'object') {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  },

  [DATA_TYPE_ARRAY]: (value) => {
    try {
      const parsed = JSON.parse(value as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
};

// 类型名称映射表(用于 typeof 检查)
const typeNameMap: Record<DataType, string> = {
  [DATA_TYPE_NUMBER]: 'number',
  [DATA_TYPE_STRING]: 'string',
  [DATA_TYPE_INTEGER]: 'integer',
  [DATA_TYPE_BOOLEAN]: 'boolean',
  [DATA_TYPE_JSON]: 'object',
  [DATA_TYPE_ARRAY]: 'object',
  [DATA_TYPE_OBJECT]: 'object',
};

export function parseValueByType(value: unknown, type: DataType): unknown {
  if (type == null) {
    throw new Error('data type is empty');
  }

  if (!Object.hasOwnProperty.call(typeTransformers, type)) {
    throw new Error(`\`${type}\` is an invalid data type`);
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
  type DataType,
};
