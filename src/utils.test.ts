import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isEmpty, isPlainObject } from './utils.js';

describe('isPlainObject', () => {
  it('应该返回 true 对于普通对象', () => {
    assert.strictEqual(isPlainObject({}), true);
    assert.strictEqual(isPlainObject({ name: 'test' }), true);
    assert.strictEqual(isPlainObject({ a: 1, b: 2 }), true);
  });

  it('应该返回 false 对于非对象类型', () => {
    assert.strictEqual(isPlainObject(null), false);
    assert.strictEqual(isPlainObject(undefined), false);
    assert.strictEqual(isPlainObject(123), false);
    assert.strictEqual(isPlainObject('string'), false);
    assert.strictEqual(isPlainObject(true), false);
    assert.strictEqual(isPlainObject(0), false);
    assert.strictEqual(isPlainObject(''), false);
  });

  it('应该返回 false 对于数组', () => {
    assert.strictEqual(isPlainObject([]), false);
    assert.strictEqual(isPlainObject([1, 2, 3]), false);
    assert.strictEqual(isPlainObject(['a', 'b']), false);
  });

  it('应该返回 false 对于函数', () => {
    assert.strictEqual(isPlainObject(function () {}), false);
    assert.strictEqual(isPlainObject(() => {}), false);
  });

  it('应该返回 false 对于 Date 对象', () => {
    assert.strictEqual(isPlainObject(new Date()), false);
  });

  it('应该返回 false 对于 RegExp 对象', () => {
    assert.strictEqual(isPlainObject(/test/), false);
  });
});

describe('isEmpty', () => {
  it('应该返回 true 对于 null 和 undefined', () => {
    assert.strictEqual(isEmpty(null), true);
    assert.strictEqual(isEmpty(undefined), true);
  });

  it('应该返回 true 对于空数组', () => {
    assert.strictEqual(isEmpty([]), true);
  });

  it('应该返回 false 对于非空数组', () => {
    assert.strictEqual(isEmpty([1]), false);
    assert.strictEqual(isEmpty(['a', 'b']), false);
  });

  it('应该返回 true 对于空对象', () => {
    assert.strictEqual(isEmpty({}), true);
  });

  it('应该返回 false 对于非空对象', () => {
    assert.strictEqual(isEmpty({ name: 'test' }), false);
    assert.strictEqual(isEmpty({ a: 1, b: 2 }), false);
  });

  it('应该返回 false 对于空字符串', () => {
    assert.strictEqual(isEmpty(''), false);
  });

  it('应该返回 false 对于非空字符串', () => {
    assert.strictEqual(isEmpty('test'), false);
    assert.strictEqual(isEmpty('a'), false);
  });

  it('应该返回 false 对于数字', () => {
    assert.strictEqual(isEmpty(0), false);
    assert.strictEqual(isEmpty(123), false);
  });

  it('应该返回 false 对于布尔值', () => {
    assert.strictEqual(isEmpty(true), false);
    assert.strictEqual(isEmpty(false), false);
  });
});
