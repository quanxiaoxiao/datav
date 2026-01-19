import { createDataAccessor } from './data-accessor.js';
import {
  toArray as toArrayValue,
  toBoolean as toBooleanValue,
  toInteger as toIntegerValue,
  toNumber as toNumberValue,
  toObject as toObjectValue,
  toString as toStringValue,
} from './value-type.js';

/**
 * Core Types
 */
export interface Field<T = unknown> {
  run(data: unknown): T;
}

// 提取推导类型的工具
export type Infer<T> = T extends Field<infer U> ? U : never;

/**
 * 内部辅助函数：统一处理路径提取和数据转换
 */
function createField<T>(
  path: string | undefined,
  transform: (val: unknown) => T,
): Field<T> {
  const accessor = path ? createDataAccessor(path) : (v: unknown) => v;
  return {
    run: (data: unknown) => transform(accessor(data)),
  };
}

/**
 * =====================================
 * Primitive field builders
 * =====================================
 */

export const toString = (path?: string) => createField(path, toStringValue);
export const toNumber = (path?: string) => createField(path, toNumberValue);
export const toInteger = (path?: string) => createField(path, toIntegerValue);
export const toBoolean = (path?: string) => createField(path, toBooleanValue);

/**
 * =====================================
 * Combinators (Object & Array)
 * =====================================
 */

export function toObject<T extends Record<string, Field>>(
  path: string | undefined,
  fields: T,
): Field<{ [K in keyof T]: Infer<T[K]> }> {
  const keys = Object.keys(fields);

  return createField(path, (val) => {
    const source = toObjectValue(val);
    const result = {} as unknown;

    // 使用预先提取的 keys 减少遍历开销
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      result[key] = fields[key].run(source);
    }
    return result;
  });
}

export function toArray<T extends Field>(
  path: string | undefined,
  itemField: T,
): Field<Array<Infer<T>>> {
  return createField(path, (val) => {
    const arr = toArrayValue(val);
    // 显式调用以确保性能和上下文安全
    return arr.map((i) => itemField.run(i));
  });
}

/**
 * =====================================
 * Execution
 * =====================================
 */

export function compile<T>(field: Field<T>) {
  return (data: unknown): T => {
    try {
      return field.run(data);
    } catch (error) {
      throw new Error(
        `[Transformation Error] ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
}
