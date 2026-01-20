import { createDataAccessor } from './data-accessor.js';
import {
  toArray as toArrayValue,
  toBoolean as toBooleanValue,
  toInteger as toIntegerValue,
  toNumber as toNumberValue,
  toObject as toObjectValue,
  toString as toStringValue,
} from './value-type.js';

// ============================================================================
// 类型定义
// ============================================================================
interface TransformError extends Error {
  path?: string;
}

function withPath(error: unknown, path: string): TransformError {
  const err = error instanceof Error ? error : new Error(String(error));
  const wrapped = new Error(err.message) as TransformError;
  wrapped.path = wrapped.path
    ? `${path}.${wrapped.path}`
    : path;
  return wrapped;
}

export interface Field<T = unknown> {
  run(data: unknown): T;
}

export type TypeOf<T extends Field> = T extends Field<infer U> ? U : never;

export type Infer<T> = T extends Field<infer U>
  ? U extends Array<infer V>
    ? Array<Infer<Field<V>>>
    : U extends object
    ? { [K in keyof U]: Infer<Field<U[K]>> }
    : U
  : never;

type FieldSchema = Record<string, Field>;
type InferSchema<T extends FieldSchema> = { [K in keyof T]: TypeOf<T[K]> };

// ============================================================================
// 核心工厂函数
// ============================================================================

function createField<T>(
  path: string | undefined,
  transform: (val: unknown) => T,
): Field<T> {
  const accessor = path ? createDataAccessor(path) : ((v: unknown) => v);

  return {
    run(data: unknown): T {
      return transform(accessor(data));
    },
  };
}

// ============================================================================
// 基础类型转换器
// ============================================================================

export const toString = (path?: string): Field<string | null> =>
  createField(path, toStringValue);

export const toNumber = (path?: string): Field<number | null> =>
  createField(path, toNumberValue);

export const toInteger = (path?: string): Field<number | null> =>
  createField(path, toIntegerValue);

export const toBoolean = (path?: string): Field<boolean | null> =>
  createField(path, toBooleanValue);

// ============================================================================
// 复杂类型转换器
// ============================================================================

export function toObject<T extends FieldSchema>(
  fields: T
): Field<InferSchema<T>>;
export function toObject<T extends FieldSchema>(
  path: string,
  fields: T
): Field<InferSchema<T>>;
export function toObject<T extends FieldSchema>(
  pathOrFields: string | T,
  fields?: T,
): Field<InferSchema<T>> {
  const [path, schema] = typeof pathOrFields === 'string'
    ? [pathOrFields, fields!]
    : [undefined, pathOrFields];

  // 预先计算 entries,避免每次运行时重复计算
  const entries = Object.entries(schema) as Array<[keyof T, Field]>;

  const transform = (val: unknown): InferSchema<T> => {
    const source = toObjectValue(val);
    const result: Record<string, unknown> = {};

    for (const [key, field] of entries) {
      try {
        result[key as string] = field.run(source);
      } catch (error) {
        throw withPath(error, String(key));
      }
    }

    return result as InferSchema<T>;
  };

  return createField(path, transform);
}

export function toArray<T extends Field>(
  itemField: T
): Field<Array<TypeOf<T>>>;
export function toArray<T extends Field>(
  path: string,
  itemField: T
): Field<Array<TypeOf<T>>>;
export function toArray<T extends Field>(
  pathOrField: string | T,
  itemField?: T,
): Field<Array<TypeOf<T>>> {
  const [path, field] = typeof pathOrField === 'string'
    ? [pathOrField, itemField!]
    : [undefined, pathOrField];

  const transform = (val: unknown): Array<TypeOf<T>> => {
    const arr = toArrayValue(val);
    const result: Array<TypeOf<T>> = [];

    for (let i = 0; i < arr.length; i++) {
      try {
        result.push(field.run(arr[i]) as TypeOf<T>);
      } catch (error) {
        throw withPath(error, String(`[${i}]`));
      }
    }

    return result;
  };

  return createField(path, transform);
}

// ============================================================================
// 编译与错误处理
// ============================================================================

export function compile<T>(field: Field<T>): (data: unknown) => T {
  return (data: unknown): T => {
    try {
      return field.run(data);
    } catch (error) {
      if (error instanceof Error && 'path' in error) {
        throw new Error(
          `Transformation Failed at ${error.path}: ${error.message}`,
        );
      }
      throw error;
    }
  };
}
