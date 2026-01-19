import { createDataAccessor } from './data-accessor.js';
import {
  toArray,
  toBoolean,
  toInteger,
  toNumber,
  toObject,
  toString,
} from './value-type.js';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type SchemaType = 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';

export type SchemaExpress = { path: string } & (
  | { type: 'string' | 'number' | 'boolean' | 'integer' }
  | { type: 'object'; properties: Record<string, SchemaExpress> }
  | { type: 'array'; items: SchemaExpress }
);

const VALID_TYPES: readonly SchemaType[] = [
  'string',
  'number',
  'boolean',
  'integer',
  'object',
  'array',
] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSchemaType(value: unknown): value is SchemaType {
  return VALID_TYPES.includes(value as SchemaType);
}

type Transformer = (data: unknown, rootData: unknown) => unknown;

function compileSchema(schema: SchemaExpress): Transformer {
  const accessor = createDataAccessor(schema.path);
  const hasRootRef = schema.path.includes('$');

  switch (schema.type) {
  case 'string':
    return (data, rootData) => {
      const target = hasRootRef ? rootData : data;
      const value = accessor(target);
      return toString(value);
    };

  case 'number':
    return (data, rootData) => {
      const target = hasRootRef ? rootData : data;
      const value = accessor(target);
      return toNumber(value);
    };

  case 'integer':
    return (data, rootData) => {
      const target = hasRootRef ? rootData : data;
      const value = accessor(target);
      return toInteger(value);
    };

  case 'boolean':
    return (data, rootData) => {
      const target = hasRootRef ? rootData : data;
      const value = accessor(target);
      return toBoolean(value);
    };

  case 'array': {
    const itemSchema = schema.items.path
      ? schema.items
      : { ...schema.items, path: '.' };

    const itemTransform = compileSchema(itemSchema);

    return (data, rootData) => {
      const target = hasRootRef ? rootData : data;
      const arr = toArray(accessor(target));
      return arr.map((item) => itemTransform(item, rootData));
    };
  }

  case 'object': {
    const compiledProps: Record<string, Transformer> = {};
    const childHasRootRef: Record<string, boolean> = {};

    for (const [key, childSchema] of Object.entries(schema.properties)) {
      compiledProps[key] = compileSchema(childSchema);
      childHasRootRef[key] = childSchema.path.includes('$');
    }

    return (data, rootData) => {
      const target = hasRootRef ? rootData : data;
      const obj = toObject(accessor(target));
      const result: Record<string, unknown> = {};

      for (const key in compiledProps) {
        const childTarget = childHasRootRef[key] ? rootData : (obj ?? {});
        result[key] = compiledProps[key](childTarget, rootData);
      }

      return result;
    };
  }

  default: {
    const neverType: never = schema;
    throw new Error(`Unhandled schema type: ${neverType}`);
  }
  }
}

export function validateExpressSchema(
  data: unknown,
  contextPath = 'root',
): ValidationResult {
  const errors: string[] = [];

  if (!isObject(data)) {
    return {
      valid: false,
      errors: [`[${contextPath}]: Must be an object`],
    };
  }

  const node = data as Record<string, unknown>;

  if (typeof node.path !== 'string') {
    errors.push(`[${contextPath}]: Missing or invalid 'path' field`);
  }

  if (!isSchemaType(data.type)) {
    errors.push(
      `[${contextPath}]: Invalid 'type' field, current value is "${node.type}"`,
    );
    return { valid: false, errors };
  }

  const currentPath = node.path || contextPath;

  switch (node.type) {
  case 'object':
    if (!isObject(data.properties)) {
      errors.push(
        `[${currentPath}]: Type 'object' must include a 'properties' object`,
      );
      break;
    }
    for (const [key, child] of Object.entries(data.properties)) {
      const result = validateExpressSchema(
        child,
        `${contextPath}.properties.${key}`,
      );
      errors.push(...result.errors);
    }
    break;
    break;

  case 'array':
    if (!isObject(data.items)) {
      errors.push(
        `[${currentPath}]: Type 'array' must include an 'items' object`,
      );
    } else {
      const result = validateExpressSchema(node.items, `${contextPath}.items`);
      errors.push(...result.errors);
    }
    break;

  default:
    break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createTransform(schema: SchemaExpress) {
  const { valid, errors } = validateExpressSchema(schema);

  if (!valid) {
    throw new Error(`Invalid schema:\n${errors.join('\n')}`);
  }

  const transformer = compileSchema(schema);

  return (data: unknown): unknown => {
    try {
      return transformer(data, data);
    } catch (error) {
      throw new Error(
        `Data transformation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };
}

export function transform(schema: SchemaExpress, data: unknown): unknown {
  const transformer = createTransform(schema);
  return transformer(data);
}
