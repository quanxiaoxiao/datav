import Ajv from 'ajv';

const ajv = new Ajv({
  strict: false,
});

const validate = ajv.compile({
  type: 'object',
  anyOf: [
    {
      properties: {
        type: {
          enum: ['object', 'array'],
        },
        properties: {
          anyOf: [
            {
              type: 'array',
              items: [
                {
                  type: 'string',
                },
                {
                  type: ['object', 'array'],
                },
              ],
              minItems: 1,
              additionalItems: false,
            },
            {
              type: 'object',
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
        properties: {
          type: 'array',
          items: [
            {
              type: 'string',
            },
            {
              type: ['object', 'array'],
            },
          ],
          minItems: 1,
          additionalItems: false,
        },
      },
      required: ['type'],
    },
  ],
});

export default (express) => {
  if (!validate(express)) {
    throw new Error(`\`${JSON.stringify(express)}\` ${JSON.stringify(validate.errors)}`);
  }
};
