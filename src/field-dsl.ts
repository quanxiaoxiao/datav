import { createDataAccessor } from './data-accessor.js';
import {
  toArray as toArrayValue,
  toBoolean as toBooleanValue,
  toInteger as toIntegerValue,
  toNumber as toNumberValue,
  toObject as toObjectValue,
  toString as toStringValue,
} from './value-type.js';

export type ASTNode =
  | ValueNode
  | ObjectNode
  | ArrayNode;

interface BaseNode {
  readonly kind: string;
  readonly path?: string;
}

export interface ValueNode extends BaseNode {
  readonly kind: 'value';
  readonly transform: 'string' | 'number' | 'integer' | 'boolean';
}

export interface ObjectNode extends BaseNode {
  readonly kind: 'object';
  readonly fields: Readonly<Record<string, ASTNode>>;
}

export interface ArrayNode extends BaseNode {
  readonly kind: 'array';
  readonly item: ASTNode;
}
export type Field<T = unknown> = Readonly<{
  toAST: () => ASTNode;
}>;

const normalizePathArg = <T>(
  arg1: string | T,
  arg2?: T,
): readonly [string | undefined, T] =>
    typeof arg1 === 'string'
      ? [arg1, arg2!] as const
      : [undefined, arg1] as const;

const createValueField = (
  path: string | undefined,
  transform: ValueNode['transform'],
): Field =>
  Object.freeze({
    toAST: (): ValueNode => ({
      kind: 'value',
      path,
      transform,
    }),
  });

export const toString = (path?: string): Field =>
  createValueField(path, 'string');

export const toNumber = (path?: string): Field =>
  createValueField(path, 'number');

export const toInteger = (path?: string): Field =>
  createValueField(path, 'integer');

export const toBoolean = (path?: string): Field =>
  createValueField(path, 'boolean');

const buildObjectFields = (
  fields: Record<string, Field>,
): Record<string, ASTNode> =>
  Object.entries(fields).reduce(
    (acc, [key, field]) => ({
      ...acc,
      [key]: field.toAST(),
    }),
    {} as Record<string, ASTNode>,
  );

export const toObject = <T extends Record<string, Field>>(
  pathOrFields: string | T,
  maybeFields?: T,
): Field => {
  const [path, fields] = normalizePathArg(pathOrFields, maybeFields);

  return Object.freeze({
    toAST: (): ObjectNode => ({
      kind: 'object',
      path,
      fields: buildObjectFields(fields),
    }),
  });
};

// ----------------------------------------------------------------------------
// Array Field 构造器
// ----------------------------------------------------------------------------

export const toArray = (
  pathOrField: string | Field,
  maybeField?: Field,
): Field => {
  const [path, field] = normalizePathArg(pathOrField, maybeField);

  return Object.freeze({
    toAST: (): ArrayNode => ({
      kind: 'array',
      path,
      item: field.toAST(),
    }),
  });
};

type Executor<T = unknown> = (data: unknown) => T;

const VALUE_TRANSFORMERS: Readonly<Record<
  ValueNode['transform'],
  (v: unknown) => unknown
>> = Object.freeze({
  string: toStringValue,
  number: toNumberValue,
  integer: toIntegerValue,
  boolean: toBooleanValue,
});

const createAccessor = (path?: string): Executor =>
  path ? createDataAccessor(path) : (v: unknown) => v;

const compose = <A, B, C>(
  f: (b: B) => C,
  g: (a: A) => B,
): ((a: A) => C) =>
    (a: A) => f(g(a));

const compileValue = (node: ValueNode): Executor => {
  const accessor = createAccessor(node.path);
  const transformer = VALUE_TRANSFORMERS[node.transform];
  return compose(transformer, accessor);
};

// 编译对象节点
const compileObject = (
  node: ObjectNode,
  compileNode: (n: ASTNode) => Executor,
): Executor => {
  const accessor = createAccessor(node.path);
  const fieldExecutors = Object.entries(node.fields).reduce(
    (acc, [key, fieldNode]) => ({
      ...acc,
      [key]: compileNode(fieldNode),
    }),
    {} as Record<string, Executor>,
  );

  return (data: unknown) => {
    const source = toObjectValue(accessor(data));
    return Object.entries(fieldExecutors).reduce(
      (result, [key, executor]) => ({
        ...result,
        [key]: executor(source),
      }),
      {} as Record<string, unknown>,
    );
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
  const visitors = {
    value: compileValue,
    object: (n: ObjectNode) => compileObject(n, compileAST),
    array: (n: ArrayNode) => compileArray(n, compileAST),
  };

  return visitors[node.kind](node as never);
};

export const compile = <T>(field: Field<T>): Executor<T> => {
  const ast = field.toAST();

  return compileAST(ast) as Executor<T>;
};
