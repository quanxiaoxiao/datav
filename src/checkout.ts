import { isPlainObject } from './utils.js';

const DATA_TYPE_NUMBER = 'number';
const DATA_TYPE_STRING = 'string';
const DATA_TYPE_BOOLEAN = 'boolean';
const DATA_TYPE_JSON = 'json';
const DATA_TYPE_ARRAY = 'array';
const DATA_TYPE_OBJECT = 'object';
const DATA_TYPE_INTEGER = 'integer';

type DataType = typeof DATA_TYPE_NUMBER | typeof DATA_TYPE_STRING | typeof DATA_TYPE_BOOLEAN |
                typeof DATA_TYPE_JSON | typeof DATA_TYPE_ARRAY | typeof DATA_TYPE_OBJECT |
                typeof DATA_TYPE_INTEGER;

type ValueTransformer = (v: unknown) => unknown;

const map: Record<DataType, ValueTransformer> = {
  [DATA_TYPE_STRING]: (v) => {
    if (typeof v !== 'string') {
      const strVal = v as { toString?: () => string };
      return strVal.toString ? `${strVal.toString()}` : JSON.stringify(v);
    }
    return v;
  },
  [DATA_TYPE_INTEGER]: (v) => {
    if (Number.isNaN(v)) {
      return v;
    }
    if (v === '') {
      return null;
    }
    const type = typeof v;
    if (type !== 'number' && type !== 'string') {
      return null;
    }
    const number = Number(v);
    if (Number.isNaN(number)) {
      return null;
    }
    if (`${number}` !== `${v}`) {
      return null;
    }
    return parseInt(number.toString(), 10);
  },
  [DATA_TYPE_NUMBER]: (v) => {
    if (v === '') {
      return null;
    }
    const number = Number(v);
    if (Number.isNaN(number)) {
      return null;
    }
    if (`${number}` !== `${v}`) {
      return null;
    }
    return number;
  },
  [DATA_TYPE_BOOLEAN]: (v) => {
    if (v !== 'false' && v !== 'true') {
      return null;
    }
    return v === 'true';
  },
  [DATA_TYPE_JSON]: (v) => {
    try {
      return JSON.parse(v as string);
    } catch {
      return null;
    }
  },
  [DATA_TYPE_OBJECT]: (v) => {
    try {
      const d = JSON.parse(v as string);
      if (Array.isArray(d)) {
        return null;
      }
      if (typeof d !== 'object') {
        return null;
      }
      return d;
    } catch {
      return null;
    }
  },
  [DATA_TYPE_ARRAY]: (v) => {
    try {
      const d = JSON.parse(v as string);
      if (Array.isArray(d)) {
        return d;
      }
      return [];
    } catch {
      return [];
    }
  },
};

const typeNameMap: Record<DataType, string> = {
  [DATA_TYPE_NUMBER]: 'number',
  [DATA_TYPE_STRING]: 'string',
  [DATA_TYPE_INTEGER]: 'integer',
  [DATA_TYPE_BOOLEAN]: 'boolean',
  [DATA_TYPE_JSON]: 'object',
  [DATA_TYPE_ARRAY]: 'object',
  [DATA_TYPE_OBJECT]: 'object',
};

export default function checkout(value: unknown, type: DataType): unknown {
  if (type == null) {
    throw new Error('data type is empty');
  }
  if (!Object.hasOwnProperty.call(map, type)) {
    throw new Error(`\`${type}\` invalid data type`);
  }
  if (value == null) {
    return type === DATA_TYPE_ARRAY ? [] : null;
  }
  const valueType = typeof value;
  if (valueType !== 'string') {
    if (type === DATA_TYPE_INTEGER) {
      return map[DATA_TYPE_INTEGER](value);
    }
    if (type === DATA_TYPE_STRING) {
      return map[DATA_TYPE_STRING](value);
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
  return map[type](value);
}
