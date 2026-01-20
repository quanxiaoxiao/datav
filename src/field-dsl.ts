import { createDataAccessor } from './data-accessor.js';
import {
  toArray as toArrayValue,
  toBoolean as toBooleanValue,
  toInteger as toIntegerValue,
  toNumber as toNumberValue,
  toObject as toObjectValue,
  toString as toStringValue,
} from './value-type.js';

interface BaseNode {
  readonly kind: string;
  readonly path?: string;
}

export interface ValueNode extends BaseNode {
  readonly kind: 'value';
  readonly transform: 'string' | 'number' | 'integer' | 'boolean';
}

export type ASTNode = ValueNode | ObjectNode | ArrayNode;

export interface ObjectNode extends BaseNode {
  readonly kind: 'object';
  readonly fields: Readonly<Record<string, ASTNode>>;
}

export interface ArrayNode extends BaseNode {
  readonly kind: 'array';
  readonly item: ASTNode;
}

export interface Field<T = unknown> {
  readonly toAST: () => ASTNode;
  readonly __type?: T; // 仅用于 TS 类型推导，运行时不存在
}

type InferShape<T extends Record<string, Field<unknown>>> = {
  [K in keyof T]: T[K] extends Field<infer U> ? U : never;
};

const createValueField = <T>(
  transform: ValueNode['transform'],
  path?: string,
): Field<T> => ({
    toAST: () => ({ kind: 'value', path, transform }),
  });

export const toString = (path?: string) => createValueField<string>('string', path);
export const toNumber = (path?: string) => createValueField<number>('number', path);
export const toInteger = (path?: string) => createValueField<number>('integer', path);
export const toBoolean = (path?: string) => createValueField<boolean>('boolean', path);

const buildObjectFields = (
  fields: Record<string, Field<unknown>>,
): Record<string, ASTNode> => {
  const result: Record<string, ASTNode> = {};
  for (const key in fields) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      result[key] = fields[key].toAST();
    }
  }
  return result;
};

export function toObject<T extends Record<string, Field<unknown>>>(
  fields: T
): Field<InferShape<T>>;
export function toObject<T extends Record<string, Field<unknown>>>(
  path: string,
  fields: T
): Field<InferShape<T>>;
export function toObject(
  arg1: string | Record<string, Field<unknown>>,
  arg2?: Record<string, Field<unknown>>,
): Field<unknown> {
  const path = typeof arg1 === 'string' ? arg1 : undefined;
  const fields = typeof arg1 === 'string' ? arg2! : arg1;

  return {
    toAST: () => ({
      kind: 'object',
      path,
      fields: buildObjectFields(fields),
    }),
  };
}

export function toArray<T>(field: Field<T>): Field<T[]>;

export function toArray<T>(path: string, field: Field<T>): Field<T[]>;

export function toArray(arg1: string | Field<unknown>, arg2?: Field<unknown>): Field<unknown[]> {
  const path = typeof arg1 === 'string' ? arg1 : undefined;
  const field = typeof arg1 === 'string' ? arg2! : arg1;

  return {
    toAST: () => ({
      kind: 'array',
      path,
      item: field.toAST(),
    }),
  };
}

type Executor<T = unknown> = (data: unknown) => T;

const VALUE_TRANSFORMERS = {
  string: toStringValue,
  number: toNumberValue,
  integer: toIntegerValue,
  boolean: toBooleanValue,
} as const;

const createAccessor = (path?: string) =>
  path ? createDataAccessor(path) : (v: unknown) => v;

const compileValue = (node: ValueNode): Executor => {
  const accessor = createAccessor(node.path);
  const transformer = VALUE_TRANSFORMERS[node.transform];
  return (data) => transformer(accessor(data));
};

const compileObject = (
  node: ObjectNode,
  compileNode: (n: ASTNode) => Executor,
): Executor => {
  const accessor = createAccessor(node.path);

  const keys = Object.keys(node.fields);
  const fieldExecutors = keys.map(key => ({
    key,
    exec: compileNode(node.fields[key]),
  }));

  return (data: unknown) => {
    const source = toObjectValue(accessor(data)) as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (let i = 0; i < fieldExecutors.length; i++) {
      const { key, exec } = fieldExecutors[i];
      result[key] = exec(source);
    }

    return result;
  };
};

const compileArray = (
  node: ArrayNode,
  compileNode: (n: ASTNode) => Executor,
): Executor => {
  const accessor = createAccessor(node.path);
  const itemExecutor = compileNode(node.item);

  return (data: unknown) => {
    const arr = toArrayValue(accessor(data));
    return arr.map(itemExecutor);
  };
};

const compileAST = (node: ASTNode): Executor => {
  switch (node.kind) {
  case 'value':
    return compileValue(node);
  case 'object':
    return compileObject(node, compileAST);
  case 'array':
    return compileArray(node, compileAST);
  }
};

export const compile = <T>(field: Field<T>): Executor<T> => {
  return compileAST(field.toAST()) as Executor<T>;
};
