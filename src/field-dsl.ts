import { createDataAccessor } from './data-accessor.js';
import {
  toArray as toArrayValue,
  toBoolean as toBooleanValue,
  toInteger as toIntegerValue,
  toNumber as toNumberValue,
  toObject as toObjectValue,
  toString as toStringValue,
} from './parse-value-by-type.js';

/**
 * =====================================
 * Core Field abstraction
 * =====================================
 */

export interface Field<T = unknown> {
  run(data: unknown): T;
}

/**
 * Helper: bind path accessor + value transform
 */
function withPath<T>(
  path: string | undefined,
  transform: (value: unknown) => T,
): Field<T> {
  const accessor = path
    ? createDataAccessor(path)
    : (value: unknown) => value;

  return {
    run(data: unknown): T {
      return transform(accessor(data));
    },
  };
}

/**
 * =====================================
 * Primitive field builders
 * =====================================
 */

export function toString(path?: string): Field<string> {
  return withPath(path, toStringValue);
}

export function toNumber(path?: string): Field<number> {
  return withPath(path, toNumberValue);
}

export function toInteger(path?: string): Field<number> {
  return withPath(path, toIntegerValue);
}

export function toBoolean(path?: string): Field<boolean> {
  return withPath(path, toBooleanValue);
}

/**
 * =====================================
 * Object combinator
 * =====================================
 */

type FieldMap = Record<string, Field<any>>;

export function toObject<T extends FieldMap>(
  path: string | undefined,
  fields: T,
): Field<{ [K in keyof T]: ReturnType<T[K]['run']> }> {
  const accessor = path
    ? createDataAccessor(path)
    : (value: unknown) => value;

  return {
    run(data: unknown) {
      const source = toObjectValue(accessor(data));
      const result: Record<string, unknown> = {};

      for (const key in fields) {
        result[key] = fields[key].run(source);
      }

      return result as any;
    },
  };
}

/**
 * =====================================
 * Array combinator
 * =====================================
 */

export function toArray<T>(
  path: string | undefined,
  item: Field<T>,
): Field<T[]> {
  const accessor = path
    ? createDataAccessor(path)
    : (value: unknown) => value;

  return {
    run(data: unknown) {
      const arr = toArrayValue(accessor(data));
      return arr.map(item.run);
    },
  };
}

/**
 * =====================================
 * Compile / execution entry
 * =====================================
 */

export function compile<T>(field: Field<T>) {
  return (data: unknown): T => {
    try {
      return field.run(data);
    } catch (error) {
      throw new Error(
        `Data transformation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };
}
