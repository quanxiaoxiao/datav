import assert from 'node:assert';
import test from 'node:test';

import { validateExpressSchema } from './validateExpressSchema.js';

test('select > validateExpressSchema', () => {
  assert.throws(() => {
    validateExpressSchema([]);
  });
  assert.throws(() => {
    validateExpressSchema('number');
  });
  assert.throws(() => {
    validateExpressSchema('integer');
  });
  assert.throws(() => {
    validateExpressSchema({});
  });
  assert.throws(() => {
    validateExpressSchema({
      type: 'object',
      properties: [],
    });
  });
  assert.throws(() => {
    validateExpressSchema({
      type: 'xxx',
    });
  });
  assert.throws(() => {
    validateExpressSchema({
      type: 'json',
    });
  });
  assert.throws(() => {
    validateExpressSchema({
      type: 'array',
      properties: [],
    });
  });
  assert.throws(() => {
    validateExpressSchema({
      type: 'array',
      properties: ['dataKey', []],
    });
  });
  validateExpressSchema({
    type: 'string',
  });
  validateExpressSchema({
    type: 'string',
    properties: ['dataKey'],
  });
  validateExpressSchema({
    type: 'string',
    properties: ['dataKey', []],
  });
  validateExpressSchema({
    type: 'string',
    properties: ['dataKey', {}],
  });
  validateExpressSchema({
    type: 'object',
    properties: {
    },
  });
  validateExpressSchema({
    type: 'array',
    properties: {
    },
  });
  validateExpressSchema({
    type: 'array',
    properties: ['dataKey', {}],
  });
});
