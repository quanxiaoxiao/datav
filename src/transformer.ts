import { createDataAccessor } from './data-accessor.js';
import {
  toArray,
  toBoolean,
  toInteger,
  toNumber,
  toObject,
  toString,
} from './value-type.js';

type ResolveContext = {
  data: unknown;
  rootData: unknown;
  path: string;
};

type Resolver = (value: unknown, ctx: ResolveContext) => unknown;

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

type Transformer = (data: unknown, rootData: unknown) => unknown;

type DefaultValueByType =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | unknown[];

export type SchemaExpress = {
  path: string;
  resolve?: Resolver;
  defaultValue?: DefaultValueByType;
} & (
  | { type: 'string' | 'number' | 'boolean' | 'integer' }
  | { type: 'object'; properties: Record<string, SchemaExpress> }
  | { type: 'array'; items: SchemaExpress }
);

export type SchemaType = 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';

const VALID_TYPES: readonly SchemaType[] = [
  'string',
  'number',
  'boolean',
  'integer',
  'object',
  'array',
] as const;

function applyDefaultValue(
  value: unknown,
  schema: SchemaExpress,
): unknown {
  if (schema.defaultValue === undefined) {
    return value;
  }

  if (schema.type === 'array') {
    return Array.isArray(value) && value.length === 0
      ? schema.defaultValue
      : value;
  }

  return value === null ? schema.defaultValue : value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSchemaType(value: unknown): value is SchemaType {
  return VALID_TYPES.includes(value as SchemaType);
}

function readValue(
  accessor: (data: unknown) => unknown,
  schema: SchemaExpress,
  data: unknown,
  rootData: unknown,
): unknown {
  const raw = accessor(schema.path.includes('$') ? rootData : data);

  if (!schema.resolve) {
    return raw;
  }

  return schema.resolve(raw, {
    data,
    rootData,
    path: schema.path,
  });
}

function compileSchema(schema: SchemaExpress): Transformer {
  const accessor = createDataAccessor(schema.path);

  switch (schema.type) {
  case 'string':
    return (data, rootData) => {
      const value = readValue(accessor, schema, data, rootData);
      const converted = toString(value);
      return applyDefaultValue(converted, schema);
    };

  case 'number':
    return (data, rootData) => {
      const value = readValue(accessor, schema, data, rootData);
      const converted = toNumber(value);
      return applyDefaultValue(converted, schema);
    };

  case 'integer':
    return (data, rootData) => {
      const value = readValue(accessor, schema, data, rootData);
      const converted = toInteger(value);
      return applyDefaultValue(converted, schema);
    };

  case 'boolean':
    return (data, rootData) => {
      const value = readValue(accessor, schema, data, rootData);
      const converted = toBoolean(value);
      return applyDefaultValue(converted, schema);
    };

  case 'array': {
    const itemSchema = schema.items.path
      ? schema.items
      : { ...schema.items, path: '.' };

    const itemTransform = compileSchema(itemSchema);

    return (data, rootData) => {
      const value = readValue(accessor, schema, data, rootData);
      const arr = toArray(value);
      const mapped = arr.map((item) => itemTransform(item, rootData));
      return applyDefaultValue(mapped, schema);
    };
  }

  case 'object': {
    const compiledProps: Record<string, Transformer> = {};

    for (const [key, childSchema] of Object.entries(schema.properties)) {
      compiledProps[key] = compileSchema(childSchema);
    }

    return (data, rootData) => {
      const value = readValue(accessor, schema, data, rootData);
      const obj = toObject(value);
      const result: Record<string, unknown> = {};

      for (const key in compiledProps) {
        result[key] = compiledProps[key](obj ?? {}, rootData);
      }

      return applyDefaultValue(result, schema);
    };
  }

  default: {
    const neverType: never = schema;
    throw new Error(`Unhandled schema type: ${neverType}`);
  }
  }
}

function isDefaultValueValid(
  type: SchemaType,
  value: unknown,
): boolean {
  switch (type) {
  case 'string':
    return typeof value === 'string';
  case 'number':
  case 'integer':
    return typeof value === 'number';
  case 'boolean':
    return typeof value === 'boolean';
  case 'object':
    return isObject(value);
  case 'array':
    return Array.isArray(value);
  default:
    return false;
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

  if ('defaultValue' in node && node.defaultValue !== undefined) {
    if (!isDefaultValueValid(node.type as SchemaType, node.defaultValue)) {
      errors.push(
        `[${currentPath}]: defaultValue does not match type "${node.type}"`,
      );
    }
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
