import { DataVError } from './errors.js';
import { isPlainObject } from './utils.js';

export type BasicType = 'string' | 'number' | 'boolean' | 'integer';
export type ComplexType = 'object' | 'array';
export type SchemaType = BasicType | ComplexType;

export interface ExpressSchema {
  type: SchemaType;
  properties?: Record<string, unknown> | [string, object];
  resolve?: (value: unknown, root: unknown) => unknown;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const BASIC_TYPES: readonly BasicType[] = ['string', 'number', 'boolean', 'integer'];
const COMPLEX_TYPES: readonly ComplexType[] = ['object', 'array'];
const VALID_TYPES: readonly SchemaType[] = [...BASIC_TYPES, ...COMPLEX_TYPES];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return isPlainObject(value);
};

const isTupleProperties = (value: unknown): value is [string, object] => {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'string' &&
    isPlainObject(value[1])
  );
};

const isBasicType = (type: unknown): type is BasicType => {
  return BASIC_TYPES.includes(type as BasicType);
};

const createResult = (errors: string[]): ValidationResult => ({
  valid: errors.length === 0,
  errors,
});

const validateBasicType = (schema: ExpressSchema): ValidationResult => {
  const errors: string[] = [];

  if (!schema.type) {
    errors.push('root: missing required property "type"');
  } else if (!isBasicType(schema.type)) {
    errors.push(`root: type must be one of [${BASIC_TYPES.join(', ')}]`);
  }

  return createResult(errors);
};

const validateObjectType = (schema: ExpressSchema): ValidationResult => {
  const { properties } = schema;

  if (properties === undefined) {
    return createResult(['root: must have required property "properties"']);
  }

  if (Array.isArray(properties)) {
    return createResult(['root: properties must be object, not array']);
  }

  if (!isRecord(properties)) {
    return createResult(['root: properties must be object']);
  }

  return createResult([]);
};

const validateArrayType = (schema: ExpressSchema): ValidationResult => {
  const { properties } = schema;
  const errors: string[] = [];

  if (properties === undefined) {
    errors.push('root: must have required property "properties"');
    return createResult(errors);
  }

  if (Array.isArray(properties)) {
    const propsArray = properties as unknown[];
    if (!isTupleProperties(propsArray)) {
      const len = propsArray.length;
      if (len !== 2) {
        errors.push(
          `root: properties array must have exactly 2 elements, got ${len}`,
        );
      } else {
        const tuple = propsArray as [unknown, unknown];
        if (typeof tuple[0] !== 'string') {
          errors.push(`root: properties[0] must be string, got ${typeof tuple[0]}`);
        }
        if (!isPlainObject(tuple[1])) {
          errors.push(`root: properties[1] must be object, got ${typeof tuple[1]}`);
        }
      }
    }
  } else if (!isRecord(properties)) {
    errors.push('root: properties must be object or array');
  }

  return createResult(errors);
};

const validateSchemaType = (schema: ExpressSchema): ValidationResult => {
  const { type } = schema;

  if (!type) {
    return createResult(['root: missing required property "type"']);
  }

  if (!VALID_TYPES.includes(type)) {
    return createResult([
      `root: type must be one of [${VALID_TYPES.join(', ')}], got "${type}"`,
    ]);
  }

  const validators: Record<SchemaType, (s: ExpressSchema) => ValidationResult> = {
    object: validateObjectType,
    array: validateArrayType,
    string: validateBasicType,
    number: validateBasicType,
    boolean: validateBasicType,
    integer: validateBasicType,
  };

  return validators[type](schema);
};

const validateRootIsObject = (schema: unknown): ValidationResult => {
  if (!isPlainObject(schema) || Array.isArray(schema)) {
    return createResult(['root: must be object']);
  }
  return createResult([]);
};

export function validateExpressSchema(schema: unknown): asserts schema is ExpressSchema {
  const rootResult = validateRootIsObject(schema);
  if (!rootResult.valid) {
    throw DataVError.invalidSchema(schema, rootResult.errors.join('; '));
  }

  const typeResult = validateSchemaType(schema as ExpressSchema);
  if (!typeResult.valid) {
    throw DataVError.invalidSchema(schema, typeResult.errors.join('; '));
  }
}

export function tryValidateExpressSchema(schema: unknown): ValidationResult {
  const rootResult = validateRootIsObject(schema);
  if (!rootResult.valid) {
    return rootResult;
  }

  return validateSchemaType(schema as ExpressSchema);
}
