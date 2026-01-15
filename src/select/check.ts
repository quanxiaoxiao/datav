import Ajv from 'ajv';

// 定义 Schema 接口
interface ExpressSchema {
  type: 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';
  properties?: Record<string, unknown> | [string, object];
  resolve?: (value: unknown, root: unknown) => unknown;
}

const ajv = new Ajv();

// 定义验证规则
const schemaValidationRules = {
  type: 'object',
  anyOf: [
    // 对象类型规则
    {
      properties: {
        type: { enum: ['object'] },
        properties: { type: 'object' },
      },
      required: ['type', 'properties'],
    },
    // 数组类型规则
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
    // 基础类型规则
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
    const schemaStr = JSON.stringify(schema);
    const errorsStr = JSON.stringify(validateSchema.errors);
    throw new Error(`Invalid schema: ${schemaStr}. Validation errors: ${errorsStr}`);
  }
}

export default validateExpressSchema;
