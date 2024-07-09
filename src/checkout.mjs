import _ from 'lodash';

const DATA_TYPE_NUMBER = 'number';
const DATA_TYPE_STRING = 'string';
const DATA_TYPE_BOOLEAN = 'boolean';
const DATA_TYPE_JSON = 'json';
const DATA_TYPE_ARRAY = 'array';
const DATA_TYPE_OBJECT = 'object';
const DATA_TYPE_INTEGER = 'integer';

const map = {
  [DATA_TYPE_STRING]: (v) => {
    if (typeof v !== 'string') {
      return v.toString ? `${v.toString()}` : JSON.stringify(v);
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
    return parseInt(number, 10);
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
      return JSON.parse(v);
    } catch (error) { // eslint-disable-line
      return null;
    }
  },
  [DATA_TYPE_OBJECT]: (v) => {
    try {
      const d = JSON.parse(v);
      if (Array.isArray(d)) {
        return null;
      }
      if (typeof d !== 'object') {
        return null;
      }
      return d;
    } catch (error) { // eslint-disable-line
      return null;
    }
  },
  [DATA_TYPE_ARRAY]: (v) => {
    try {
      const d = JSON.parse(v);
      if (Array.isArray(d)) {
        return d;
      }
      return [];
    } catch (error) { // eslint-disable-line
      return [];
    }
  },
};

const typeNameMap = {
  [DATA_TYPE_NUMBER]: 'number',
  [DATA_TYPE_STRING]: 'string',
  [DATA_TYPE_INTEGER]: 'integer',
  [DATA_TYPE_BOOLEAN]: 'boolean',
  [DATA_TYPE_JSON]: 'object',
  [DATA_TYPE_ARRAY]: 'object',
  [DATA_TYPE_OBJECT]: 'object',
};

export default (value, type) => {
  if (type == null) {
    throw new Error('data type is empty');
  }
  if (!Object.hasOwnProperty.call(map, type)) {
    throw new Error(`\`${type}\` invalid data type`);
  }
  if (value == null) {
    if (type === 'array') {
      return [];
    }
    return null;
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
        return _.isPlainObject(value) ? value : null;
      }
      return value;
    }
    return type === DATA_TYPE_ARRAY ? [] : null;
  }
  return map[type](value);
};
