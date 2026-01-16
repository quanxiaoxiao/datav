import { isPlainObject } from './utils.js';
import { DataVError, ERROR_CODES } from './errors.js';

export interface ExpressSchema {
  type: 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';
  properties?: Record<string, unknown> | [string, object];
  resolve?: (value: unknown, root: unknown) => unknown;
}

const BASIC_TYPES = ['string', 'number', 'boolean', 'integer'] as const;
const VALID_TYPES = [...BASIC_TYPES, 'object', 'array'] as const;

type BasicType = typeof BASIC_TYPES[number];
type ValidType = typeof VALID_TYPES[number];

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

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

const validateBasicType = (schema: ExpressSchema): ValidationResult => {
  const errors: string[] = [];

  if (!schema.type) {
    errors.push('root: missing required property "type"');
  } else if (!BASIC_TYPES.includes(schema.type as BasicType)) {
    errors.push(`root: type must be one of [${BASIC_TYPES.join(', ')}]`);
  }

  return { valid: errors.length === 0, errors };
};

const validateObjectType = (schema: ExpressSchema): ValidationResult => {
  const errors: string[] = [];

  if (!isRecord(schema.properties)) {
    if (schema.properties === undefined) {
      errors.push('root: must have required property "properties"');
    } else if (Array.isArray(schema.properties)) {
      errors.push('root: properties must be object, not array');
    } else {
      errors.push('root: properties must be object');
    }
  }

  return { valid: errors.length === 0, errors };
};

const validateArrayType = (schema: ExpressSchema): ValidationResult => {
  const errors: string[] = [];

  if (schema.properties === undefined) {
    errors.push('root: must have required property "properties"');
  } else if (Array.isArray(schema.properties)) {
    const tupleCheck = isTupleProperties(schema.properties);
    if (!tupleCheck) {
      const len = schema.properties.length;
      if (len !== 2) {
        errors.push(
          `root: properties array must have exactly 2 elements, got ${len}`,
        );
      } else {
        const [first, second] = schema.properties;
        if (typeof first !== 'string') {
          errors.push(
            `root: properties[0] must be string, got ${typeof first}`,
          );
        } else if (!isPlainObject(second)) {
          errors.push(
            `root: properties[1] must be object, got ${typeof second}`,
          );
        }
      }
    }
  } else if (!isRecord(schema.properties)) {
    errors.push('root: properties must be object or array');
  }

  return { valid: errors.length === 0, errors };
};

const validateSchemaType = (schema: ExpressSchema): ValidationResult => {
  if (!schema.type) {
    return {
      valid: false,
      errors: ['root: missing required property "type"'],
    };
  }

  if (!VALID_TYPES.includes(schema.type as ValidType)) {
    return {
      valid: false,
      errors: [
        `root: type must be one of [${VALID_TYPES.join(', ')}], got "${schema.type}"`,
      ],
    };
  }

  switch (schema.type) {
    case 'object':
      return validateObjectType(schema);
    case 'array':
      return validateArrayType(schema);
    default:
      return validateBasicType(schema);
  }
};

const validateRootIsObject = (schema: unknown): ValidationResult => {
  if (!isPlainObject(schema) || Array.isArray(schema)) {
    return {
      valid: false,
      errors: ['root: must be object'],
    };
  }
  return { valid: true, errors: [] };
};

export function validateExpressSchema(schema: ExpressSchema): void {
  const rootResult = validateRootIsObject(schema);
  if (!rootResult.valid) {
    throw DataVError.invalidSchema(
      schema,
      rootResult.errors.join('; '),
    );
  }

  const typeResult = validateSchemaType(schema);
  if (!typeResult.valid) {
    throw DataVError.invalidSchema(
      schema,
      typeResult.errors.join('; '),
    );
  }
}
