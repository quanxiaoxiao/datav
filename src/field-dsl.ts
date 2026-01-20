import { createDataAccessor } from './data-accessor.js';
import {
  toArray as toArrayValue,
  toBoolean as toBooleanValue,
  toInteger as toIntegerValue,
  toNumber as toNumberValue,
  toObject as toObjectValue,
  toString as toStringValue,
} from './value-type.js';

export interface Field<T = unknown> {
  run(data: unknown): T;
}

export type Infer<T> = T extends Field<infer U>
  ? (U extends Array<infer V> ? Array<Infer<Field<V>>> : U extends object ? { [K in keyof U]: Infer<Field<U[K]>> } : U)
  : never;

export type TypeOf<T extends Field> = ReturnType<T['run']>;

function createField<T>(
  path: string | undefined,
  transform: (val: unknown) => T,
): Field<T> {
  const accessor = path ? createDataAccessor(path) : (v: unknown) => v;

  return {
    run(data: unknown): T {
      return transform(accessor(data));
    },
  };
}

export const toString = (path?: string): Field<string> =>
  createField(path, toStringValue);

export const toNumber = (path?: string): Field<number> =>
  createField(path, toNumberValue);

export const toInteger = (path?: string): Field<number> =>
  createField(path, toIntegerValue);

export const toBoolean = (path?: string): Field<boolean> =>
  createField(path, toBooleanValue);

export function toObject<T extends Record<string, Field>>(fields: T): Field<{ [K in keyof T]: TypeOf<T[K]> }>;
export function toObject<T extends Record<string, Field>>(path: string, fields: T): Field<{ [K in keyof T]: TypeOf<T[K]> }>;
export function toObject<T extends Record<string, Field>>(
  pathOrFields: string | T,
  fields?: T,
): Field<{ [K in keyof T]: TypeOf<T[K]> }> {
  const isPathString = typeof pathOrFields === 'string';
  const path = isPathString ? pathOrFields : undefined;
  const schema = (isPathString ? fields : pathOrFields) as T;

  const entries = Object.entries(schema);

  const transform = (val: unknown): { [K in keyof T]: TypeOf<T[K]> } => {
    const source = toObjectValue(val);
    const result = {} as Record<string, unknown>;

    for (const [key, field] of entries) {
      try {
        result[key] = field.run(source);
      } catch (error) {
        throw wrapError(error, key);
      }
    }

    return result as { [K in keyof T]: TypeOf<T[K]> };
  };

  return createField(path, transform);
}

export function toArray<T extends Field>(itemField: T): Field<Array<TypeOf<T>>>;

export function toArray<T extends Field>(path: string, itemField: T): Field<Array<TypeOf<T>>>;

export function toArray<T extends Field>(
  pathOrField: string | T,
  itemField?: T,
): Field<Array<TypeOf<T>>> {
  const isPathString = typeof pathOrField === 'string';
  const path = isPathString ? pathOrField : undefined;
  const field = (isPathString ? itemField : pathOrField) as T;

  const transform = (val: unknown): Array<TypeOf<T>> => {
    const arr = toArrayValue(val);
    return arr.map((item, index) => {
      try {
        return field.run(item);
      } catch (error) {
        throw wrapError(error, `[${index}]`);
      }
    }) as Array<TypeOf<T>>;
  };

  return createField(path, transform);
}

export function compile<T>(field: Field<T>): (data: unknown) => T {
  return (data: unknown): T => {
    try {
      return field.run(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Transformation Failed: ${message}`);
    }
  };
}

function wrapError(error: unknown, prefix: string): Error {
  const msg = error instanceof Error ? error.message : String(error);
  return new Error(`${prefix} -> ${msg}`);
}
