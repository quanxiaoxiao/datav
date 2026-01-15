import { describe, it, mock } from 'node:test';
import * as assert from 'node:assert';
import { createDataAccessor } from './createDataAccessor.js';
import { arrayAccessorModule } from './createArrayAccessor.js';
import { pathAccessorModule } from './createPathAccessor.js';
import { dotPathModule } from './parseDotPath.js';

describe('createDataAccessor', () => {
  describe('当 pathname 为 null 或 undefined 时', () => {
    it('应该返回一个始终返回 null 的函数', () => {
      const accessor = createDataAccessor(null);
      assert.strictEqual(accessor({ foo: 'bar' }), null);
      assert.strictEqual(accessor([1, 2, 3]), null);
      assert.strictEqual(accessor('test'), null);
    });

    it('应该处理 undefined', () => {
      const accessor = createDataAccessor(undefined);
      assert.strictEqual(accessor({ foo: 'bar' }), null);
    });
  });

  describe('当 pathname 为数字时', () => {
    it('应该为数组创建索引访问器', () => {
      const mockArrayAccessor = mock.fn((data) => data[2]);
      mock.method(arrayAccessorModule, 'createArrayAccessor', () => mockArrayAccessor);

      const accessor = createDataAccessor(2);
      const testArray = ['a', 'b', 'c'];
      const result = accessor(testArray);

      assert.strictEqual(result, 'c');
      assert.strictEqual(mockArrayAccessor.mock.calls.length, 1);
    });

    it('当数据不是数组时应该返回 null', () => {
      mock.method(arrayAccessorModule, 'createArrayAccessor', () => mock.fn());

      const accessor = createDataAccessor(0);
      assert.strictEqual(accessor({ foo: 'bar' }), null);
      assert.strictEqual(accessor('string'), null);
      assert.strictEqual(accessor(123), null);
    });

    it('应该处理负数索引', () => {
      const mockArrayAccessor = mock.fn((data) => data[data.length - 1]);
      mock.method(arrayAccessorModule, 'createArrayAccessor', () => mockArrayAccessor);

      const accessor = createDataAccessor(-1);
      const testArray = [1, 2, 3];
      accessor(testArray);

      assert.strictEqual(mockArrayAccessor.mock.calls.length, 1);
    });
  });

  describe('当 pathname 为字符串时', () => {
    it('应该解析点路径并创建路径访问器', () => {
      const parsedPath = ['user', 'name'];
      const mockPathAccessor = mock.fn(() => 'John');

      mock.method(dotPathModule, 'parseDotPath', () => parsedPath);
      mock.method(pathAccessorModule, 'createPathAccessor', () => mockPathAccessor);

      const accessor = createDataAccessor('user.name');
      const result = accessor({ user: { name: 'John' } });

      assert.strictEqual(result, 'John');
      assert.strictEqual(dotPathModule.parseDotPath.mock.calls.length, 1);
      assert.strictEqual(dotPathModule.parseDotPath.mock.calls[0].arguments[0], 'user.name');
      assert.strictEqual(pathAccessorModule.createPathAccessor.mock.calls.length, 1);
    });

    it('应该处理简单的属性路径', () => {
      const parsedPath = ['name'];
      const mockPathAccessor = mock.fn(() => 'Alice');

      mock.method(dotPathModule, 'parseDotPath', () => parsedPath);
      mock.method(pathAccessorModule, 'createPathAccessor', () => mockPathAccessor);

      const accessor = createDataAccessor('name');
      const result = accessor({ name: 'Alice' });

      assert.strictEqual(result, 'Alice');
    });

    it('应该处理深层嵌套路径', () => {
      const parsedPath = ['a', 'b', 'c', 'd'];
      const mockPathAccessor = mock.fn(() => 'deep value');

      mock.method(dotPathModule, 'parseDotPath', () => parsedPath);
      mock.method(pathAccessorModule, 'createPathAccessor', () => mockPathAccessor);

      const accessor = createDataAccessor('a.b.c.d');
      const result = accessor({ a: { b: { c: { d: 'deep value' } } } });

      assert.strictEqual(result, 'deep value');
    });

    it('应该处理空字符串', () => {
      const parsedPath = [];
      const mockPathAccessor = mock.fn(() => null);

      mock.method(dotPathModule, 'parseDotPath', () => parsedPath);
      mock.method(pathAccessorModule, 'createPathAccessor', () => mockPathAccessor);

      const accessor = createDataAccessor('');
      accessor({});

      assert.strictEqual(dotPathModule.parseDotPath.mock.calls[0].arguments[0], '');
    });
  });

  describe('当 pathname 为其他类型时', () => {
    it('应该返回一个始终返回 null 的函数 (boolean)', () => {
      const accessor = createDataAccessor(true);
      assert.strictEqual(accessor({ foo: 'bar' }), null);
    });

    it('应该返回一个始终返回 null 的函数 (object)', () => {
      const accessor = createDataAccessor({});
      assert.strictEqual(accessor({ foo: 'bar' }), null);
    });

    it('应该返回一个始终返回 null 的函数 (array)', () => {
      const accessor = createDataAccessor([]);
      assert.strictEqual(accessor({ foo: 'bar' }), null);
    });
  });

  describe('访问器函数的复用', () => {
    it('同一个访问器应该可以多次调用', () => {
      const mockPathAccessor = mock.fn((data) => data?.value);
      mock.method(dotPathModule, 'parseDotPath', () => ['value']);
      mock.method(pathAccessorModule, 'createPathAccessor', () => mockPathAccessor);

      const accessor = createDataAccessor('value');

      accessor({ value: 1 });
      accessor({ value: 2 });
      accessor({ value: 3 });

      assert.strictEqual(mockPathAccessor.mock.calls.length, 3);
    });

    it('不同的数据类型应该正确处理', () => {
      const mockArrayAccessor = mock.fn((data) => data[0]);
      mock.method(arrayAccessorModule, 'createArrayAccessor', () => mockArrayAccessor);

      const accessor = createDataAccessor(0);

      const result1 = accessor([1, 2, 3]);
      const result2 = accessor({ 0: 'not array' });

      assert.strictEqual(result1, 1);
      assert.strictEqual(result2, null);
    });
  });
});
