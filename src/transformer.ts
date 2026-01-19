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

function transformData(schema: SchemaExpress, data: unknown): unknown {
  const accessor = createDataAccessor(schema.path);
  const value = accessor(data);
  const { type } = schema;

  switch (type) {
  case 'string':
    return toString(value);

  case 'number':
    return toNumber(value);

  case 'integer':
    return toInteger(value);

  case 'boolean':
    return toBoolean(value);

  case 'array': {
    const arrayValue = toArray(value);
    return arrayValue.map((item) =>
      transformData(
        schema.items.path ? schema.items : {
          ...schema.items,
          path: '.',
        },
        item,
      ),
    );
  }

  case 'object': {
    const objectValue = toObject(value);
    const result: Record<string, unknown> = {};

    Object.entries(schema.properties).forEach(([key, childSchema]) => {
      result[key] = transformData(childSchema, objectValue);
    });

    return result;
  }

  default: {
    const exhaustiveCheck: never = type;
    throw new Error(`Unhandled type: ${exhaustiveCheck}`);
  }
  }
}

export function createTransform(schema: SchemaExpress) {
  const validationResult = validateExpressSchema(schema);

  if (!validationResult.valid) {
    throw new Error(
      `Invalid schema:\n${validationResult.errors.join('\n')}`,
    );
  }

  return (data: unknown): unknown => {
    try {
      return transformData(schema, data);
    } catch (error) {
      throw new Error(
        `Data transformation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
}

export function transform(schema: SchemaExpress, data: unknown): unknown {
  const transformer = createTransform(schema);
  return transformer(data);
}
