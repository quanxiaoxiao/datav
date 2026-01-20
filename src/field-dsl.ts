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

export type Infer<T> = T extends Field<infer U> ? U : never;

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

/**
 * =====================================
 * Combinators (Object & Array)
 * =====================================
 */
export function toObject<T extends Record<string, Field>>(
  path: string | undefined,
  fields: T,
): Field<{ [K in keyof T]: Infer<T[K]> }> {
  const entries = Object.entries(fields);

  const transform = (val: unknown): { [K in keyof T]: Infer<T[K]> } => {
    const source = toObjectValue(val);
    const result = {} as Record<string, unknown>;

    for (const [key, field] of entries) {
      result[key] = field.run(source);
    }

    return result as { [K in keyof T]: Infer<T[K]> };
  };

  return createField(path, transform);
}

export function toArray<T extends Field>(
  path: string | undefined,
  itemField: T,
): Field<Array<Infer<T>>> {
  const transform = (val: unknown): Array<Infer<T>> => {
    const arr = toArrayValue(val);
    return arr.map((item) => itemField.run(item)) as Array<Infer<T>>;
  };

  return createField(path, transform);
}

export function compile<T>(field: Field<T>): (data: unknown) => T {
  const { run } = field;

  return (data: unknown): T => {
    try {
      return run.call(field, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`[Transformation Error] ${message}`);
    }
  };
}
