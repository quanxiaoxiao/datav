import assert from 'node:assert';
import test from 'node:test';

import check from './check.mjs';

test('select > check', () => {
  assert.throws(() => {
    check([]);
  });
  assert.throws(() => {
    check('number');
  });
  assert.throws(() => {
    check('integer');
  });
  assert.throws(() => {
    check({});
  });
  assert.throws(() => {
    check({
      type: 'object',
      properties: [],
    });
  });
  assert.throws(() => {
    check({
      type: 'xxx',
    });
  });
  assert.throws(() => {
    check({
      type: 'json',
    });
  });
  assert.throws(() => {
    check({
      type: 'array',
      properties: [],
    });
  });
  assert.throws(() => {
    check({
      type: 'array',
      properties: ['dataKey', []],
    });
  });
  check({
    type: 'string',
  });
  check({
    type: 'string',
    properties: ['dataKey'],
  });
  check({
    type: 'string',
    properties: ['dataKey', []],
  });
  check({
    type: 'string',
    properties: ['dataKey', {}],
  });
  check({
    type: 'object',
    properties: {
    },
  });
  check({
    type: 'array',
    properties: {
    },
  });
  check({
    type: 'array',
    properties: ['dataKey', {}],
  });
});
