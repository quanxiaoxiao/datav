import { createDataAccessor } from './createDataAccessor.js';
import {
  toArray,
  toBoolean,
  toInteger,
  toNumber,
  toObject,
  toString,
} from './parseValueByType.js';

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

type Transformer = (data: unknown) => unknown;

function compileSchema(schema: SchemaExpress): Transformer {
  const accessor = createDataAccessor(schema.path);

  switch (schema.type) {
  case 'string':
    return (data) => toString(accessor(data));

  case 'number':
    return (data) => toNumber(accessor(data));

  case 'integer':
    return (data) => toInteger(accessor(data));

  case 'boolean':
    return (data) => toBoolean(accessor(data));

  case 'array': {
    const itemSchema = schema.items.path
      ? schema.items
      : { ...schema.items, path: '.' };

    const itemTransform = compileSchema(itemSchema);

    return (data) => {
      const arr = toArray(accessor(data));
      return arr.map(itemTransform);
    };
  }

  case 'object': {
    const compiledProps: Record<string, Transformer> = {};

    for (const [key, childSchema] of Object.entries(schema.properties)) {
      compiledProps[key] = compileSchema(childSchema);
    }

    return (data) => {
      const obj = toObject(accessor(data));
      const result: Record<string, unknown> = {};

      for (const key in compiledProps) {
        result[key] = compiledProps[key](obj);
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
      return transformer(data);
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
