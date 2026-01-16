import { Ajv } from 'ajv';

import { DataVError, ERROR_CODES } from './errors.js';

export interface ExpressSchema {
  type: 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';
  properties?: Record<string, unknown> | [string, object];
  resolve?: (value: unknown, root: unknown) => unknown;
}

const ajv = new Ajv();

const schemaValidationRules = {
  type: 'object',
  anyOf: [
    {
      properties: {
        type: { enum: ['object'] },
        properties: { type: 'object' },
      },
      required: ['type', 'properties'],
    },
    {
      properties: {
        type: { enum: ['array'] },
        properties: {
          anyOf: [
            { type: 'object' },
            {
              type: 'array',
              items: [
                { type: 'string' },
                { type: 'object' },
              ],
              additionalItems: false,
              minItems: 2,
              maxItems: 2,
            },
          ],
        },
      },
      required: ['type', 'properties'],
    },
    {
      properties: {
        type: { enum: ['string', 'number', 'boolean', 'integer'] },
      },
      required: ['type'],
    },
  ],
};

const validateSchema = ajv.compile(schemaValidationRules);

export function validateExpressSchema(schema: ExpressSchema): void {
  if (!validateSchema(schema)) {
    const errorsStr = validateSchema.errors
      ?.map((e) => `${e.instancePath || 'root'}: ${e.message}`)
      .join('; ');
    throw DataVError.invalidSchema(schema, errorsStr || 'unknown error');
  }
}
