import Ajv from 'ajv';

const ajv = new Ajv();

const validate = ajv.compile({
  type: 'object',
  anyOf: [
    {
      properties: {
        type: {
          enum: ['object'],
        },
        properties: {
          type: 'object',
        },
      },
      required: ['type', 'properties'],
    },
    {
      properties: {
        type: {
          enum: ['array'],
        },
        properties: {
          anyOf: [
            {
              type: 'object',
            },
            {
              type: 'array',
              items: [
                {
                  type: 'string',
                },
                {
                  type: 'object',
                },
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
        type: {
          enum: ['string', 'number', 'boolean', 'integer'],
        },
      },
      required: ['type'],
    },
  ],
});

interface ExpressSchema {
  type: 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';
  properties?: Record<string, unknown> | object | [string, object];
  resolve?: (value: unknown, root: unknown) => unknown;
}

export default function check(express: ExpressSchema): void {
  if (!validate(express)) {
    throw new Error(`\`${JSON.stringify(express)}\` ${JSON.stringify(validate.errors)}`);
  }
}
