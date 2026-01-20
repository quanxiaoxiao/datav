import {
  DataVError,
  type DataVErrorDetails,
  ERROR_CODES,
  type ErrorCode,
  getErrorCode,
  isDataVError,
} from './errors.js';
import {
  compile,
  type Field,
  type Infer,
  toArray,
  toBoolean,
  toInteger,
  toNumber,
  toObject,
  toString,
  type TypeOf,
} from './field-dsl.js';
import {
  createTransform,
  type SchemaExpress,
  type SchemaType,
  transform,
} from './transformer.js';

export {
  compile,
  createTransform,
  DataVError,
  ERROR_CODES,
  ErrorCode,
  Field,
  getErrorCode,
  Infer,
  isDataVError,
  SchemaExpress,
  SchemaType,
  toArray,
  toBoolean,
  toInteger,
  toNumber,
  toObject,
  toString,
  transform,
};

export type {
  DataVErrorDetails,
  TypeOf,
};
