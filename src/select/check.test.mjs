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
      type: 'string',
      properties: 'xxx',
    });
  });
  assert.throws(() => {
    check({
      type: 'string',
      properties: null,
    });
  });
  assert.throws(() => {
    check({
      type: 'string',
      properties: ['dataKey', 11],
    });
  });
  assert.throws(() => {
    check({
      type: 'string',
      properties: ['dataKey', 'xxx'],
    });
  });
  assert.throws(() => {
    check({
      type: 'string',
      properties: [11],
    });
  });
  assert.throws(() => {
    check({
      type: 'string',
      properties: [{}],
    });
  });
  assert.throws(() => {
    check({
      type: 'string',
      properties: [],
    });
  });
  assert.throws(() => {
    check({
      type: 'string',
      properties: [[]],
    });
  });
  assert.throws(() => {
    check({
      type: 'string',
      properties: {},
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
});
