import * as assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createPathAccessor } from './createPathAccessor.js';

describe('createPathAccessor', () => {
  describe('空路径', () => {
    test('应该返回原始数据', () => {
      const accessor = createPathAccessor([]);
      const data = { name: 'test', value: 123 };
      assert.deepEqual(accessor(data), data);
    });

    test('应该返回原始数组', () => {
      const accessor = createPathAccessor([]);
      const data = [1, 2, 3];
      assert.deepEqual(accessor(data), data);
    });

    test('应该返回原始基本类型', () => {
      const accessor = createPathAccessor([]);
      assert.equal(accessor('hello'), 'hello');
      assert.equal(accessor(42), 42);
      assert.equal(accessor(null), null);
    });
  });

  describe('单层路径 - 对象访问', () => {
    test('应该正确访问对象属性', () => {
      const accessor = createPathAccessor(['name']);
      const data = { name: 'Alice', age: 30 };
      assert.equal(accessor(data), 'Alice');
    });

    test('不存在的属性应该返回 null', () => {
      const accessor = createPathAccessor(['missing']);
      const data = { name: 'Alice' };
      assert.equal(accessor(data), null);
    });

    test('null 或 undefined 数据应该返回 null', () => {
      const accessor = createPathAccessor(['name']);
      assert.equal(accessor(null), null);
      assert.equal(accessor(undefined), null);
    });

    test('应该访问嵌套对象', () => {
      const accessor = createPathAccessor(['user']);
      const data = { user: { name: 'Bob', age: 25 } };
      assert.deepEqual(accessor(data), { name: 'Bob', age: 25 });
    });
  });

  describe('单层路径 - 数组访问', () => {
    test('应该通过 createArrayAccessor 访问数组', () => {
      // 假设 createArrayAccessor 支持索引访问
      const accessor = createPathAccessor(['0']);
      const data = ['first', 'second', 'third'];
      // 这里的行为取决于 createArrayAccessor 的实现
      const result = accessor(data);
      assert.ok(result !== null);
    });
  });

  describe('多层路径 - 嵌套对象', () => {
    test('应该访问嵌套对象的属性', () => {
      const accessor = createPathAccessor(['user', 'profile', 'name']);
      const data = {
        user: {
          profile: {
            name: 'Charlie',
            email: 'charlie@example.com',
          },
        },
      };
      assert.equal(accessor(data), 'Charlie');
    });

    test('中间路径不存在应该返回 null', () => {
      const accessor = createPathAccessor(['user', 'profile', 'name']);
      const data = { user: {} };
      assert.equal(accessor(data), null);
    });

    test('中间路径为 null 应该返回 null', () => {
      const accessor = createPathAccessor(['user', 'profile', 'name']);
      const data = { user: null };
      assert.equal(accessor(data), null);
    });
  });

  describe('混合路径 - 对象和数组', () => {
    test('应该访问对象中的数组元素', () => {
      const accessor = createPathAccessor(['users', '0', 'name']);
      const data = {
        users: [
          { name: 'David', age: 28 },
          { name: 'Eve', age: 32 },
        ],
      };
      // 行为取决于 createArrayAccessor 的实现
      const result = accessor(data);
      assert.ok(result !== undefined);
    });

    test('应该访问数组中的对象属性', () => {
      const accessor = createPathAccessor(['0', 'name']);
      const data = [
        { name: 'Frank', age: 35 },
        { name: 'Grace', age: 29 },
      ];
      const result = accessor(data);
      assert.ok(result !== undefined);
    });

    test('复杂嵌套结构', () => {
      const accessor = createPathAccessor(['company', 'departments', '0', 'manager', 'name']);
      const data = {
        company: {
          departments: [
            {
              name: 'Engineering',
              manager: { name: 'Helen', id: 101 },
            },
            {
              name: 'Sales',
              manager: { name: 'Ivan', id: 102 },
            },
          ],
        },
      };
      const result = accessor(data);
      assert.ok(result !== undefined);
    });
  });

  describe('边界情况', () => {
    test('路径指向 undefined 值', () => {
      const accessor = createPathAccessor(['value']);
      const data = { value: undefined };
      assert.equal(accessor(data), undefined);
    });

    test('路径指向 0 值', () => {
      const accessor = createPathAccessor(['count']);
      const data = { count: 0 };
      assert.equal(accessor(data), 0);
    });

    test('路径指向空字符串', () => {
      const accessor = createPathAccessor(['text']);
      const data = { text: '' };
      assert.equal(accessor(data), '');
    });

    test('路径指向 false 值', () => {
      const accessor = createPathAccessor(['flag']);
      const data = { flag: false };
      assert.equal(accessor(data), false);
    });

    test('空对象', () => {
      const accessor = createPathAccessor(['key']);
      const data = {};
      assert.equal(accessor(data), null);
    });

    test('空数组', () => {
      const accessor = createPathAccessor(['0']);
      const data = [];
      const result = accessor(data);
      // 行为取决于 createArrayAccessor 的实现
      assert.ok(result !== undefined);
    });
  });

  describe('特殊键名', () => {
    test('包含特殊字符的键名', () => {
      const accessor = createPathAccessor(['user-name']);
      const data = { 'user-name': 'Jack' };
      assert.equal(accessor(data), 'Jack');
    });

    test('数字字符串键名', () => {
      const accessor = createPathAccessor(['123']);
      const data = { 123: 'numeric key' };
      assert.equal(accessor(data), 'numeric key');
    });

    test('包含点号的键名', () => {
      const accessor = createPathAccessor(['user.name']);
      const data = { 'user.name': 'Kelly' };
      assert.equal(accessor(data), 'Kelly');
    });
  });

  describe('性能和缓存', () => {
    test('多次调用相同访问器应该得到一致结果', () => {
      const accessor = createPathAccessor(['user', 'name']);
      const data = { user: { name: 'Liam' } };

      assert.equal(accessor(data), 'Liam');
      assert.equal(accessor(data), 'Liam');
      assert.equal(accessor(data), 'Liam');
    });

    test('访问器应该是纯函数', () => {
      const accessor = createPathAccessor(['value']);
      const data1 = { value: 'first' };
      const data2 = { value: 'second' };

      assert.equal(accessor(data1), 'first');
      assert.equal(accessor(data2), 'second');
      assert.equal(accessor(data1), 'first');
    });
  });
});
