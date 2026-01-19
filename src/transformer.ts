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

const VALID_TYPES: readonly SchemaType[] = ['string', 'number', 'boolean', 'integer', 'object', 'array'] as const;

export function validateExpressSchema(data: unknown, contextPath = 'root'): ValidationResult {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return {
      valid: false,
      errors: [`[${contextPath}]: Must be an object`],
    };
  }

  const node = data as Record<string, unknown>;

  if (typeof node.path !== 'string') {
    errors.push(`[${contextPath}]: Missing or invalid 'path' field`);
  }

  if (!VALID_TYPES.includes(node.type as SchemaType)) {
    errors.push(`[${contextPath}]: Invalid 'type' field, current value is "${node.type}"`);
    return { valid: false, errors };
  }

  const currentPath = node.path || contextPath;

  switch (node.type) {
  case 'object':
    if (typeof node.properties !== 'object' || node.properties === null) {
      errors.push(`[${currentPath}]: Type 'object' must include a 'properties' object`);
    } else {
      Object.entries(node.properties).forEach(([key, childSchema]) => {
        const result = validateExpressSchema(childSchema, `${contextPath}.properties.${key}`);
        errors.push(...result.errors);
      });
    }
    break;

  case 'array':
    if (typeof node.items !== 'object' || node.items === null) {
      errors.push(`[${currentPath}]: Type 'array' must include an 'items' object`);
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
