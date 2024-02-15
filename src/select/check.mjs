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
          type: 'object',
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

export default (express) => {
  if (!validate(express)) {
    throw new Error(`\`${JSON.stringify(express)}\` ${JSON.stringify(validate.errors)}`);
  }
};
