import assert from 'node:assert';
import test from 'node:test';

import checkout from './checkout.js';

test('checkout invalid data type', () => {
  assert.throws(() => {
    checkout('aaa', 'bbb');
  });
  assert.throws(() => {
    checkout('aaa');
  });
});

test('checkout with data value null', () => {
  assert.deepEqual(checkout(null, 'array'), []);
  assert.equal(checkout(null, 'object'), null);
  assert.equal(checkout(null, 'string'), null);
  assert.equal(checkout(null, 'number'), null);
  assert.equal(checkout(null, 'integer'), null);
  assert.equal(checkout(null, 'boolean'), null);
  assert.equal(checkout(null, 'json'), null);
});

test('checkout with string', () => {
  assert.equal(checkout(1, 'string'), '1');
  assert.equal(checkout(null, 'string'), null);
  assert.equal(checkout(true, 'string'), 'true');
  assert.equal(checkout(false, 'string'), 'false');
  assert.equal(checkout(' 1', 'string'), ' 1');
  assert.equal(checkout([1, 2, 3], 'string'), '1,2,3');
  assert.equal(checkout({ name: 'cqq' }, 'string'), '[object Object]');
  assert.equal(checkout({
    name: 'quan',
    toString: () => 'cqq',
  }, 'string'), 'cqq');
});

test('checkout with integer', () => {
  assert.equal(checkout(null, 'integer'), null);
  assert.equal(checkout('', 'integer'), null);
  assert.equal(checkout(true, 'integer'), null);
  assert.equal(checkout(false, 'integer'), null);
  assert.equal(checkout([], 'integer'), null);
  assert.equal(checkout({}, 'integer'), null);
  assert.equal(checkout('aaa', 'integer'), null);
  assert.equal(checkout('1', 'integer'), 1);
  assert.equal(checkout('01', 'integer'), null);
  assert.equal(checkout(' 1', 'integer'), null);
  assert.equal(checkout('1.1', 'integer'), 1);
  assert.equal(checkout('-3.1', 'integer'), -3);
  assert.equal(checkout(3.1, 'integer'), 3);
  assert.equal(checkout(1, 'integer'), 1);
  assert(Number.isNaN(checkout(NaN, 'integer')));
});

test('checkout with number', () => {
  assert.equal(checkout('1', 'number'), 1);
  assert.equal(checkout('01', 'number'), null);
  assert.equal(checkout(true, 'number'), null);
  assert.equal(checkout(false, 'number'), null);
  assert.equal(checkout([], 'number'), null);
  assert.equal(checkout({}, 'number'), null);
  assert.equal(checkout('', 'number'), null);
  assert.equal(checkout('a', 'number'), null);
  assert.equal(checkout('1a', 'number'), null);
  assert.equal(checkout('0', 'number'), 0);
  assert.equal(checkout('-0', 'number'), null);
  assert.equal(checkout('-1', 'number'), -1);
  assert.equal(checkout('-1.5', 'number'), -1.5);
  assert.equal(checkout('-2.5', 'number'), -2.5);
  assert.equal(checkout('2.5', 'number'), 2.5);
  assert.equal(checkout('2.5a', 'number'), null);
  assert.equal(checkout('2.5.', 'number'), null);
  assert.equal(checkout('2.5.8', 'number'), null);
  assert.equal(checkout(1, 'number'), 1);
  assert(Number.isNaN(checkout(NaN, 'number')));
});

test('checkout with boolean', () => {
  assert.equal(checkout('', 'boolean'), null);
  assert.equal(checkout('false', 'boolean'), false);
  assert.equal(checkout(' false', 'boolean'), null);
  assert.equal(checkout('false ', 'boolean'), null);
  assert.equal(checkout('true', 'boolean'), true);
  assert.equal(checkout(' true', 'boolean'), null);
  assert.equal(checkout('true ', 'boolean'), null);
  assert.equal(checkout(true, 'boolean'), true);
  assert.equal(checkout(false, 'boolean'), false);
  assert.equal(checkout(1, 'boolean'), null);
  assert.equal(checkout({}, 'boolean'), null);
  assert.equal(checkout([], 'boolean'), null);
  assert.equal(checkout('aaa', 'boolean'), null);
});

test('checkout with json', () => {
  assert.equal(checkout('1', 'json'), 1);
  assert.equal(checkout(' 1', 'json'), 1);
  assert.equal(checkout('"1"', 'json'), '1');
  assert.equal(checkout('\'1\'', 'json'), null);
  assert.equal(checkout('null', 'json'), null);
  assert.equal(checkout('aa', 'json'), null);
  assert.deepEqual(checkout('{}', 'json'), {});
  assert.deepEqual(checkout('{fail}', 'json'), null);
  assert.deepEqual(checkout('{"name":"cqq"}', 'json'), { name: 'cqq' });
  assert.deepEqual(checkout('[]', 'json'), []);
  assert.deepEqual(checkout([], 'json'), []);
  assert.deepEqual(checkout({}, 'json'), {});
  assert.deepEqual(checkout(2, 'json'), null);
});

test('checkout with array', () => {
  assert.deepEqual(checkout(null, 'array'), []);
  assert.deepEqual(checkout('[]', 'array'), []);
  assert.deepEqual(checkout('[xxx]', 'array'), []);
  assert.deepEqual(checkout([], 'array'), []);
  assert.deepEqual(checkout([1, 2, 3], 'array'), [1, 2, 3]);
  assert.deepEqual(checkout(1, 'array'), []);
  assert.deepEqual(checkout({}, 'array'), []);
  assert.deepEqual(checkout('1', 'array'), []);
  assert.deepEqual(checkout('{}', 'array'), []);
  assert.deepEqual(checkout(['12345'], 'array'), ['12345']);
  assert.deepEqual(checkout(true, 'array'), []);
  assert.deepEqual(checkout(false, 'array'), []);
  assert.deepEqual(checkout([{ name: 'cqq' }], 'array'), [{ name: 'cqq' }]);
  assert.deepEqual(checkout(JSON.stringify([{ name: 'cqq' }]), 'array'), [{ name: 'cqq' }]);
});

test('checkout with object', () => {
  assert.equal(checkout(null, 'object'), null);
  assert.equal(checkout(1, 'object'), null);
  assert.equal(checkout('aa', 'object'), null);
  assert.equal(checkout('1', 'object'), null);
  assert.equal(checkout(JSON.stringify('aa'), 'object'), null);
  assert.equal(checkout(true, 'object'), null);
  assert.equal(checkout('true', 'object'), null);
  assert.equal(checkout('false', 'object'), null);
  assert.equal(checkout(false, 'object'), null);
  assert.equal(checkout([], 'object'), null);
  assert.equal(checkout(JSON.stringify([]), 'object'), null);
  assert.deepEqual(checkout({ name: 'cqq' }, 'object'), { name: 'cqq' });
  assert.deepEqual(checkout(JSON.stringify({ name: 'cqq' }), 'object'), { name: 'cqq' });
  assert.deepEqual(checkout('{fail}', 'object'), null);
});
