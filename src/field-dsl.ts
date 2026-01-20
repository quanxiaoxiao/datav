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
 * 核心接口定义
 */
export interface Field<T = unknown> {
  run(data: unknown): T;
}

// 优化类型推导：使用递归推导（虽然当前够用，但为未来扩展做准备）
export type Infer<T> = T extends Field<infer U>
  ? (U extends Array<infer V> ? Array<Infer<Field<V>>> : U extends object ? { [K in keyof U]: Infer<Field<U[K]>> } : U)
  : never;

// 简单的类型提取别名
export type TypeOf<T extends Field> = ReturnType<T['run']>;

/**
 * 内部工厂函数：创建 Field 实例
 */
function createField<T>(
  path: string | undefined,
  transform: (val: unknown) => T,
): Field<T> {
  // 性能优化：只在 path 存在时创建 accessor，否则直接透传
  // 假设 createDataAccessor 返回 (data: unknown) => unknown
  const accessor = path ? createDataAccessor(path) : (v: unknown) => v;

  return {
    run(data: unknown): T {
      return transform(accessor(data));
    },
  };
}

// --- 基础类型 ---

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
 * 组合器 (Object & Array)
 * =====================================
 */

// 重载定义：支持不传 path
export function toObject<T extends Record<string, Field>>(fields: T): Field<{ [K in keyof T]: TypeOf<T[K]> }>;
export function toObject<T extends Record<string, Field>>(path: string, fields: T): Field<{ [K in keyof T]: TypeOf<T[K]> }>;
export function toObject<T extends Record<string, Field>>(
  pathOrFields: string | T,
  fields?: T,
): Field<{ [K in keyof T]: TypeOf<T[K]> }> {
  // 参数归一化处理
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
        // 错误优化：追加当前字段名，方便调试深层嵌套错误
        throw wrapError(error, key);
      }
    }

    return result as { [K in keyof T]: TypeOf<T[K]> };
  };

  return createField(path, transform);
}

// 重载定义：支持不传 path
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
    // 性能 & 错误追踪：使用传统的 for 循环或 map 并在回调中捕获索引
    return arr.map((item, index) => {
      try {
        return field.run(item);
      } catch (error) {
        // 错误优化：追加数组索引
        throw wrapError(error, `[${index}]`);
      }
    }) as Array<TypeOf<T>>;
  };

  return createField(path, transform);
}

/**
 * =====================================
 * 编译与执行
 * =====================================
 */

export function compile<T>(field: Field<T>): (data: unknown) => T {
  return (data: unknown): T => {
    try {
      return field.run(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // 这里可以根据需要决定是否要 swallow stack trace
      throw new Error(`Transformation Failed: ${message}`);
    }
  };
}

/**
 * 内部工具：错误包装
 * 用于在错误消息前追加路径上下文
 */
function wrapError(error: unknown, prefix: string): Error {
  const msg = error instanceof Error ? error.message : String(error);
  // 防止重复包装 "Key: Key: Error"
  return new Error(`${prefix} -> ${msg}`);
}
