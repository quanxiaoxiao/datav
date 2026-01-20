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
// AST 定义（纯结构，无函数）
// ============================================================================

export type ASTNode =
  | ValueNode
  | ObjectNode
  | ArrayNode;

interface BaseNode {
  kind: string;
  path?: string;
}

export interface ValueNode extends BaseNode {
  kind: 'value';
  transform: 'string' | 'number' | 'integer' | 'boolean';
}

export interface ObjectNode extends BaseNode {
  kind: 'object';
  fields: Record<string, ASTNode>;
}

export interface ArrayNode extends BaseNode {
  kind: 'array';
  item: ASTNode;
}

// ============================================================================
// Resolver（Field 的中间表示，仍保留函数）
// ============================================================================

type Resolver =
  | ValueResolver
  | ObjectResolver
  | ArrayResolver;

interface BaseResolver {
  path?: string;
}

interface ValueResolver extends BaseResolver {
  kind: 'value';
  transformName: ValueNode['transform'];
}

interface ObjectResolver extends BaseResolver {
  kind: 'object';
  fields: Record<string, Resolver>;
}

interface ArrayResolver extends BaseResolver {
  kind: 'array';
  item: Resolver;
}

// ============================================================================
// Field：Schema Builder（不直接执行）
// ============================================================================

export interface Field<T = unknown> {
  build(): Resolver;
}

// ----------------------------------------------------------------------------
// Value Field
// ----------------------------------------------------------------------------

function createValueField(
  path: string | undefined,
  transformName: ValueNode['transform'],
): Field {
  return {
    build(): Resolver {
      return {
        kind: 'value',
        path,
        transformName,
      };
    },
  };
}

export const toString = (path?: string) =>
  createValueField(path, 'string');

export const toNumber = (path?: string) =>
  createValueField(path, 'number');

export const toInteger = (path?: string) =>
  createValueField(path, 'integer');

export const toBoolean = (path?: string) =>
  createValueField(path, 'boolean');

// ----------------------------------------------------------------------------
// Object / Array Field
// ----------------------------------------------------------------------------

function normalizePathArg<T>(
  arg1: string | T,
  arg2?: T,
): [string | undefined, T] {
  return typeof arg1 === 'string'
    ? [arg1, arg2!]
    : [undefined, arg1];
}

export function toObject<T extends Record<string, Field>>(
  pathOrFields: string | T,
  maybeFields?: T,
): Field {
  const [path, fields] = normalizePathArg(pathOrFields, maybeFields);

  return {
    build(): Resolver {
      const resolved: Record<string, Resolver> = {};
      for (const key in fields) {
        resolved[key] = fields[key].build();
      }

      return {
        kind: 'object',
        path,
        fields: resolved,
      };
    },
  };
}

export function toArray(
  pathOrField: string | Field,
  maybeField?: Field,
): Field {
  const [path, field] = normalizePathArg(pathOrField, maybeField);

  return {
    build(): Resolver {
      return {
        kind: 'array',
        path,
        item: field.build(),
      };
    },
  };
}

// ============================================================================
// Lowering：Resolver → AST（去函数化）
// ============================================================================

function lowerResolver(resolver: Resolver): ASTNode {
  switch (resolver.kind) {
  case 'value':
    return {
      kind: 'value',
      path: resolver.path,
      transform: resolver.transformName,
    };

  case 'object': {
    const fields: Record<string, ASTNode> = {};
    for (const key in resolver.fields) {
      fields[key] = lowerResolver(resolver.fields[key]);
    }
    return {
      kind: 'object',
      path: resolver.path,
      fields,
    };
  }

  case 'array':
    return {
      kind: 'array',
      path: resolver.path,
      item: lowerResolver(resolver.item),
    };
  }
}

// ============================================================================
// Compile：AST → Executor（真正运行期）
// ============================================================================

const valueTransformers = {
  string: toStringValue,
  number: toNumberValue,
  integer: toIntegerValue,
  boolean: toBooleanValue,
};

function compileAST(ast: ASTNode): (data: unknown) => unknown {
  const accessor = ast.path
    ? createDataAccessor(ast.path)
    : (v: unknown) => v;

  switch (ast.kind) {
  case 'value': {
    const transform = valueTransformers[ast.transform];
    return (data) => transform(accessor(data));
  }

  case 'object': {
    const fieldExecs: Record<string, (d: unknown) => unknown> = {};
    for (const key in ast.fields) {
      fieldExecs[key] = compileAST(ast.fields[key]);
    }

    return (data) => {
      const source = toObjectValue(accessor(data));
      const result: Record<string, unknown> = {};
      for (const key in fieldExecs) {
        result[key] = fieldExecs[key](source);
      }
      return result;
    };
  }

  case 'array': {
    const itemExec = compileAST(ast.item);
    return (data) => {
      const arr = toArrayValue(accessor(data));
      return arr.map(itemExec);
    };
  }
  }
}

// ============================================================================
// Public API
// ============================================================================

export function compile<T>(field: Field<T>): (data: unknown) => T {
  const resolver = field.build();
  const ast = lowerResolver(resolver);

  // 调试 / 可视化 / 静态分析入口
  // console.log(JSON.stringify(ast, null, 2));

  return compileAST(ast) as (data: unknown) => T;
}
