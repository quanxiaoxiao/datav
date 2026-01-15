import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { createDataAccessor } from './createDataAccessor.js';
import { createArrayAccessor } from './createArrayAccessor.js';
import { createPathAccessor } from './createPathAccessor.js';
import { parseDotPath } from './parseDotPath.js';

describe('createDataAccessor', () => {
  describe('当 pathname 为 null 或 undefined 时', () => {
    it('应该返回一个始终返回 null 的函数', () => {
      const accessor = createDataAccessor(null);
      assert.strictEqual(accessor({ foo: 'bar' }), null);
      assert.strictEqual(accessor([1, 2, 3]), null);
      assert.strictEqual(accessor('test'), null);
    });

    it('应该处理 undefined', () => {
      const accessor = createDataAccessor(undefined as unknown as string | number | null);
      assert.strictEqual(accessor({ foo: 'bar' }), null);
    });
  });

  describe('当 pathname 为数字时', () => {
    it('应该为数组创建索引访问器', () => {
      const accessor = createDataAccessor(2);
      const testArray = ['a', 'b', 'c'];
      assert.strictEqual(accessor(testArray), 'c');
    });

    it('当数据不是数组时应该返回 null', () => {
      const accessor = createDataAccessor(0);
      assert.strictEqual(accessor({ foo: 'bar' }), null);
      assert.strictEqual(accessor('string'), null);
      assert.strictEqual(accessor(123), null);
    });

    it('应该处理负数索引', () => {
      const accessor = createDataAccessor(-1);
      const testArray = [1, 2, 3];
      assert.strictEqual(accessor(testArray), 3);
    });
  });

  describe('当 pathname 为字符串时', () => {
    it('应该解析点路径并创建路径访问器', () => {
      const accessor = createDataAccessor('user.name');
      const result = accessor({ user: { name: 'John' } });
      assert.strictEqual(result, 'John');
    });

    it('应该处理简单的属性路径', () => {
      const accessor = createDataAccessor('name');
      const result = accessor({ name: 'Alice' });
      assert.strictEqual(result, 'Alice');
    });

    it('应该处理深层嵌套路径', () => {
      const accessor = createDataAccessor('a.b.c.d');
      const result = accessor({ a: { b: { c: { d: 'deep value' } } } });
      assert.strictEqual(result, 'deep value');
    });

    it('应该返回原数据', () => {
      const accessor = createDataAccessor('');
      const input = { name: 'John' };
      assert.strictEqual(accessor(input), input);
    });

    it('应该处理数组索引', () => {
      const accessor = createDataAccessor('0');
      const result = accessor({ 0: 'first', 1: 'second' });
      assert.strictEqual(result, 'first');
    });
  });

  describe('当 pathname 为其他类型时', () => {
    it('应该返回一个始终返回 null 的函数 (boolean)', () => {
      const accessor = createDataAccessor(true as unknown as string | number | null);
      assert.strictEqual(accessor({ foo: 'bar' }), null);
    });

    it('应该返回一个始终返回 null 的函数 (object)', () => {
      const accessor = createDataAccessor({} as unknown as string | number | null);
      assert.strictEqual(accessor({ foo: 'bar' }), null);
    });

    it('应该返回一个始终返回 null 的函数 (array)', () => {
      const accessor = createDataAccessor([] as unknown as string | number | null);
      assert.strictEqual(accessor({ foo: 'bar' }), null);
    });
  });

  describe('访问器函数的复用', () => {
    it('同一个访问器应该可以多次调用', () => {
      const accessor = createDataAccessor('value');

      accessor({ value: 1 });
      accessor({ value: 2 });
      const result = accessor({ value: 3 });

      assert.strictEqual(result, 3);
    });

    it('不同的数据类型应该正确处理', () => {
      const accessor = createDataAccessor(0);

      const result1 = accessor([1, 2, 3]);
      const result2 = accessor({ 0: 'not array' });

      assert.strictEqual(result1, 1);
      assert.strictEqual(result2, null);
    });
  });
});

describe('createArrayAccessor', () => {
  it('应该返回数组指定索引的元素', () => {
    const accessor = createArrayAccessor(0);
    assert.strictEqual(accessor(['a', 'b', 'c']), 'a');

    const accessor2 = createArrayAccessor(2);
    assert.strictEqual(accessor2(['a', 'b', 'c']), 'c');
  });

  it('应该处理负数索引', () => {
    const accessor = createArrayAccessor(-1);
    assert.strictEqual(accessor(['a', 'b', 'c']), 'c');

    const accessor2 = createArrayAccessor(-2);
    assert.strictEqual(accessor2(['a', 'b', 'c']), 'b');
  });

  it('应该处理越界索引', () => {
    const accessor = createArrayAccessor(10);
    assert.strictEqual(accessor(['a', 'b', 'c']), null);

    const accessor2 = createArrayAccessor(-10);
    assert.strictEqual(accessor2(['a', 'b', 'c']), null);
  });

  it('应该处理空数组', () => {
    const accessor = createArrayAccessor(0);
    assert.strictEqual(accessor([]), null);
  });

  it('应该返回数组长度', () => {
    const accessor = createArrayAccessor('length');
    assert.strictEqual(accessor(['a', 'b', 'c']), 3);
  });

  it('应该处理无效的字符串索引', () => {
    const accessor = createArrayAccessor('abc');
    assert.strictEqual(accessor(['a', 'b', 'c']), null);

    const accessor2 = createArrayAccessor('1.5');
    assert.strictEqual(accessor2(['a', 'b', 'c']), null);
  });

  it('应该拒绝浮点数索引', () => {
    const accessor = createArrayAccessor(1.5);
    assert.strictEqual(accessor(['a', 'b', 'c']), null);
  });
});

describe('createPathAccessor', () => {
  it('应该访问单个键', () => {
    const accessor = createPathAccessor(['name']);
    assert.strictEqual(accessor({ name: 'John' }), 'John');
  });

  it('应该访问嵌套路径', () => {
    const accessor = createPathAccessor(['user', 'profile', 'name']);
    assert.strictEqual(accessor({ user: { profile: { name: 'John' } } }), 'John');
  });

  it('应该处理不存在的路径', () => {
    const accessor = createPathAccessor(['nonexistent']);
    assert.strictEqual(accessor({ name: 'John' }), null);
  });

    it('应该返回原数据', () => {
      const accessor = createPathAccessor([]);
      const input = { name: 'John' };
      assert.strictEqual(accessor(input), input);
    });

  it('应该处理数组访问', () => {
    const accessor = createPathAccessor(['items', '0', 'name']);
    assert.strictEqual(accessor({ items: [{ name: 'first' }, { name: 'second' }] }), 'first');
  });
});

describe('parseDotPath', () => {
  it('应该解析简单路径', () => {
    assert.deepStrictEqual(parseDotPath('user.name'), ['user', 'name']);
    assert.deepStrictEqual(parseDotPath('a.b.c'), ['a', 'b', 'c']);
  });

  it('应该处理前导点', () => {
    assert.deepStrictEqual(parseDotPath('.user.name'), ['user', 'name']);
  });

  it('应该处理空字符串', () => {
    assert.deepStrictEqual(parseDotPath(''), []);
  });

  it('应该处理单个段', () => {
    assert.deepStrictEqual(parseDotPath('name'), ['name']);
  });

  it('应该处理转义点号', () => {
    assert.deepStrictEqual(parseDotPath('user\\.name'), ['user.name']);
    assert.deepStrictEqual(parseDotPath('a\\.b.c'), ['a.b', 'c']);
  });

  it('应该处理前导点后无内容', () => {
    assert.deepStrictEqual(parseDotPath('.'), []);
  });
});
