import assert from 'node:assert';
import test from 'node:test';

import { parseValueByType } from './parseValueByType.js';

test('parseValueByType invalid data type', () => {
  assert.throws(() => {
    parseValueByType('aaa', 'bbb');
  });
  assert.throws(() => {
    parseValueByType('aaa');
  });
});

test('parseValueByType with data value null', () => {
  assert.deepEqual(parseValueByType(null, 'array'), []);
  assert.equal(parseValueByType(null, 'object'), null);
  assert.equal(parseValueByType(null, 'string'), null);
  assert.equal(parseValueByType(null, 'number'), null);
  assert.equal(parseValueByType(null, 'integer'), null);
  assert.equal(parseValueByType(null, 'boolean'), null);
  assert.equal(parseValueByType(null, 'json'), null);
});

test('parseValueByType with string', () => {
  assert.equal(parseValueByType(1, 'string'), '1');
  assert.equal(parseValueByType(null, 'string'), null);
  assert.equal(parseValueByType(true, 'string'), 'true');
  assert.equal(parseValueByType(false, 'string'), 'false');
  assert.equal(parseValueByType(' 1', 'string'), ' 1');
  assert.equal(parseValueByType([1, 2, 3], 'string'), '1,2,3');
  assert.equal(parseValueByType({ name: 'cqq' }, 'string'), '[object Object]');
  assert.equal(parseValueByType({
    name: 'quan',
    toString: () => 'cqq',
  }, 'string'), 'cqq');
});

test('parseValueByType with integer', () => {
  assert.equal(parseValueByType(null, 'integer'), null);
  assert.equal(parseValueByType('', 'integer'), null);
  assert.equal(parseValueByType(true, 'integer'), null);
  assert.equal(parseValueByType(false, 'integer'), null);
  assert.equal(parseValueByType([], 'integer'), null);
  assert.equal(parseValueByType({}, 'integer'), null);
  assert.equal(parseValueByType('aaa', 'integer'), null);
  assert.equal(parseValueByType('1', 'integer'), 1);
  assert.equal(parseValueByType('01', 'integer'), null);
  assert.equal(parseValueByType(' 1', 'integer'), null);
  assert.equal(parseValueByType('1.1', 'integer'), 1);
  assert.equal(parseValueByType('-3.1', 'integer'), -3);
  assert.equal(parseValueByType(3.1, 'integer'), 3);
  assert.equal(parseValueByType(1, 'integer'), 1);
  assert.equal(parseValueByType(NaN, 'integer'), null);
});

test('parseValueByType with number', () => {
  assert.equal(parseValueByType('1', 'number'), 1);
  assert.equal(parseValueByType('01', 'number'), null);
  assert.equal(parseValueByType(true, 'number'), null);
  assert.equal(parseValueByType(false, 'number'), null);
  assert.equal(parseValueByType([], 'number'), null);
  assert.equal(parseValueByType({}, 'number'), null);
  assert.equal(parseValueByType('', 'number'), null);
  assert.equal(parseValueByType('a', 'number'), null);
  assert.equal(parseValueByType('1a', 'number'), null);
  assert.equal(parseValueByType('0', 'number'), 0);
  assert.equal(parseValueByType('-0', 'number'), null);
  assert.equal(parseValueByType('-1', 'number'), -1);
  assert.equal(parseValueByType('-1.5', 'number'), -1.5);
  assert.equal(parseValueByType('-2.5', 'number'), -2.5);
  assert.equal(parseValueByType('2.5', 'number'), 2.5);
  assert.equal(parseValueByType('2.5a', 'number'), null);
  assert.equal(parseValueByType('2.5.', 'number'), null);
  assert.equal(parseValueByType('2.5.8', 'number'), null);
  assert.equal(parseValueByType(1, 'number'), 1);
  assert(Number.isNaN(parseValueByType(NaN, 'number')));
});

test('parseValueByType with boolean', () => {
  assert.equal(parseValueByType('', 'boolean'), null);
  assert.equal(parseValueByType('false', 'boolean'), false);
  assert.equal(parseValueByType(' false', 'boolean'), null);
  assert.equal(parseValueByType('false ', 'boolean'), null);
  assert.equal(parseValueByType('true', 'boolean'), true);
  assert.equal(parseValueByType(' true', 'boolean'), null);
  assert.equal(parseValueByType('true ', 'boolean'), null);
  assert.equal(parseValueByType(true, 'boolean'), true);
  assert.equal(parseValueByType(false, 'boolean'), false);
  assert.equal(parseValueByType(1, 'boolean'), null);
  assert.equal(parseValueByType({}, 'boolean'), null);
  assert.equal(parseValueByType([], 'boolean'), null);
  assert.equal(parseValueByType('aaa', 'boolean'), null);
});

test('parseValueByType with json', () => {
  assert.equal(parseValueByType('1', 'json'), 1);
  assert.equal(parseValueByType(' 1', 'json'), 1);
  assert.equal(parseValueByType('"1"', 'json'), '1');
  assert.equal(parseValueByType('\'1\'', 'json'), null);
  assert.equal(parseValueByType('null', 'json'), null);
  assert.equal(parseValueByType('aa', 'json'), null);
  assert.deepEqual(parseValueByType('{}', 'json'), {});
  assert.deepEqual(parseValueByType('{fail}', 'json'), null);
  assert.deepEqual(parseValueByType('{"name":"cqq"}', 'json'), { name: 'cqq' });
  assert.deepEqual(parseValueByType('[]', 'json'), []);
  assert.deepEqual(parseValueByType([], 'json'), []);
  assert.deepEqual(parseValueByType({}, 'json'), {});
  assert.deepEqual(parseValueByType(2, 'json'), null);
});

test('parseValueByType with array', () => {
  assert.deepEqual(parseValueByType(null, 'array'), []);
  assert.deepEqual(parseValueByType('[]', 'array'), []);
  assert.deepEqual(parseValueByType('[xxx]', 'array'), []);
  assert.deepEqual(parseValueByType([], 'array'), []);
  assert.deepEqual(parseValueByType([1, 2, 3], 'array'), [1, 2, 3]);
  assert.deepEqual(parseValueByType(1, 'array'), []);
  assert.deepEqual(parseValueByType({}, 'array'), []);
  assert.deepEqual(parseValueByType('1', 'array'), []);
  assert.deepEqual(parseValueByType('{}', 'array'), []);
  assert.deepEqual(parseValueByType(['12345'], 'array'), ['12345']);
  assert.deepEqual(parseValueByType(true, 'array'), []);
  assert.deepEqual(parseValueByType(false, 'array'), []);
  assert.deepEqual(parseValueByType([{ name: 'cqq' }], 'array'), [{ name: 'cqq' }]);
  assert.deepEqual(parseValueByType(JSON.stringify([{ name: 'cqq' }]), 'array'), [{ name: 'cqq' }]);
});

test('parseValueByType with object', () => {
  assert.equal(parseValueByType(null, 'object'), null);
  assert.equal(parseValueByType(1, 'object'), null);
  assert.equal(parseValueByType('aa', 'object'), null);
  assert.equal(parseValueByType('1', 'object'), null);
  assert.equal(parseValueByType(JSON.stringify('aa'), 'object'), null);
  assert.equal(parseValueByType(true, 'object'), null);
  assert.equal(parseValueByType('true', 'object'), null);
  assert.equal(parseValueByType('false', 'object'), null);
  assert.equal(parseValueByType(false, 'object'), null);
  assert.equal(parseValueByType([], 'object'), null);
  assert.equal(parseValueByType(JSON.stringify([]), 'object'), null);
  assert.deepEqual(parseValueByType({ name: 'cqq' }, 'object'), { name: 'cqq' });
  assert.deepEqual(parseValueByType(JSON.stringify({ name: 'cqq' }), 'object'), { name: 'cqq' });
  assert.deepEqual(parseValueByType('{fail}', 'object'), null);
});
