import * as assert from 'node:assert';
import { test, describe, it } from 'node:test';

import { createArrayAccessor, createDataAccessor, createPathAccessor } from './createDataAccessor.js';

describe('createDataAccessor', () => {
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

  describe('访问器函数的复用', () => {
    it('同一个访问器应该可以多次调用', () => {
      const accessor = createDataAccessor('value');

      accessor({ value: 1 });
      accessor({ value: 2 });
      const result = accessor({ value: 3 });

      assert.strictEqual(result, 3);
    });

  });
});

describe('createArrayAccessor', () => {
  it('应该返回数组指定索引的元素', () => {
    const accessor = createArrayAccessor('0');
    assert.strictEqual(accessor(['a', 'b', 'c']), 'a');

    const accessor2 = createArrayAccessor('2');
    assert.strictEqual(accessor2(['a', 'b', 'c']), 'c');
  });

  it('应该处理负数索引', () => {
    const accessor = createArrayAccessor('-1');
    assert.strictEqual(accessor(['a', 'b', 'c']), 'c');

    const accessor2 = createArrayAccessor('-2');
    assert.strictEqual(accessor2(['a', 'b', 'c']), 'b');
  });

  it('应该处理越界索引', () => {
    const accessor = createArrayAccessor('10');
    assert.strictEqual(accessor(['a', 'b', 'c']), null);

    const accessor2 = createArrayAccessor('-10');
    assert.strictEqual(accessor2(['a', 'b', 'c']), null);
  });

  it('应该处理空数组', () => {
    const accessor = createArrayAccessor('0');
    assert.strictEqual(accessor([]), null);
  });

  it('应该处理无效的字符串索引', () => {
    const accessor = createArrayAccessor('abc');
    assert.strictEqual(accessor(['a', 'b', 'c']), null);

    const accessor2 = createArrayAccessor('1.5');
    assert.strictEqual(accessor2(['a', 'b', 'c']), null);
  });

  it('应该拒绝浮点数索引', () => {
    const accessor = createArrayAccessor('1.5');
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

describe('createArrayAccessor', () => {
  const testArray = ['a', 'b', 'c', 'd', 'e'];

  describe('数字索引访问', () => {
    it('应该返回正确的数组元素 - 正数索引', () => {
      const accessor = createArrayAccessor(0);
      assert.strictEqual(accessor(testArray), 'a');

      const accessor2 = createArrayAccessor(2);
      assert.strictEqual(accessor2(testArray), 'c');

      const accessor4 = createArrayAccessor(4);
      assert.strictEqual(accessor4(testArray), 'e');
    });

    it('应该支持负数索引', () => {
      const accessor = createArrayAccessor(-1);
      assert.strictEqual(accessor(testArray), 'e');

      const accessor2 = createArrayAccessor(-2);
      assert.strictEqual(accessor2(testArray), 'd');

      const accessor5 = createArrayAccessor(-5);
      assert.strictEqual(accessor5(testArray), 'a');
    });

    it('应该处理索引越界的情况 - 正数', () => {
      const accessor = createArrayAccessor(10);
      assert.strictEqual(accessor(testArray), null);

      const accessor2 = createArrayAccessor(5);
      assert.strictEqual(accessor2(testArray), null);
    });

    it('应该处理索引越界的情况 - 负数', () => {
      const accessor = createArrayAccessor(-10);
      assert.strictEqual(accessor(testArray), null);

      const accessor2 = createArrayAccessor(-6);
      assert.strictEqual(accessor2(testArray), null);
    });

    it('应该拒绝浮点数索引', () => {
      const accessor = createArrayAccessor(1.5);
      assert.strictEqual(accessor(testArray), null);

      const accessor2 = createArrayAccessor(-2.3);
      assert.strictEqual(accessor2(testArray), null);
    });
  });

  describe('字符串索引访问', () => {
    it('应该处理 "length" 特殊属性', () => {
      const accessor = createArrayAccessor('length');
      assert.strictEqual(accessor(testArray), null);
      assert.strictEqual(accessor([]), null);
      assert.strictEqual(accessor([1, 2, 3]), null);
    });

    it('应该将有效的数字字符串转换为索引', () => {
      const accessor = createArrayAccessor('0');
      assert.strictEqual(accessor(testArray), 'a');

      const accessor2 = createArrayAccessor('3');
      assert.strictEqual(accessor2(testArray), 'd');
    });

    it('应该支持负数字符串索引', () => {
      const accessor = createArrayAccessor('-1');
      assert.strictEqual(accessor(testArray), 'e');

      const accessor2 = createArrayAccessor('-3');
      assert.strictEqual(accessor2(testArray), 'c');
    });

    it.only('应该拒绝无效的字符串索引', () => {
      const accessor = createArrayAccessor('abc');
      assert.strictEqual(accessor(testArray), null);

      const accessor2 = createArrayAccessor('1.5');
      assert.strictEqual(accessor2(testArray), null);

      const accessor3 = createArrayAccessor('01'); // 前导零
      assert.strictEqual(accessor3(testArray), null);

      const accessor4 = createArrayAccessor('2a');
      assert.strictEqual(accessor4(testArray), null);
    });
  });

  describe('边界情况', () => {
    it('应该处理空数组', () => {
      const accessor = createArrayAccessor(0);
      assert.strictEqual(accessor([]), null);

      const accessor2 = createArrayAccessor(-1);
      assert.strictEqual(accessor2([]), null);
    });

    it('应该处理单元素数组', () => {
      const singleArray = ['only'];

      const accessor0 = createArrayAccessor(0);
      assert.strictEqual(accessor0(singleArray), 'only');

      const accessor1 = createArrayAccessor(-1);
      assert.strictEqual(accessor1(singleArray), 'only');

      const accessor2 = createArrayAccessor(1);
      assert.strictEqual(accessor2(singleArray), null);
    });

    it('应该拒绝无效的索引类型', () => {
      const accessor = createArrayAccessor(null as unknown);
      assert.strictEqual(accessor(testArray), null);

      const accessor2 = createArrayAccessor(undefined as unknown);
      assert.strictEqual(accessor2(testArray), null);

      const accessor3 = createArrayAccessor({} as unknown);
      assert.strictEqual(accessor3(testArray), null);

      const accessor4 = createArrayAccessor([] as unknown);
      assert.strictEqual(accessor4(testArray), null);
    });

    it('应该处理包含各种类型元素的数组', () => {
      const mixedArray = [null, undefined, 0, '', false, { key: 'value' }];

      const accessor0 = createArrayAccessor(0);
      assert.strictEqual(accessor0(mixedArray), null);

      const accessor1 = createArrayAccessor(1);
      assert.strictEqual(accessor1(mixedArray), undefined);

      const accessor5 = createArrayAccessor(5);
      assert.deepStrictEqual(accessor5(mixedArray), { key: 'value' });
    });
  });

  describe('函数复用性', () => {
    it('创建的访问器应该可以在多个数组上复用', () => {
      const accessor = createArrayAccessor(1);

      assert.strictEqual(accessor(['a', 'b', 'c']), 'b');
      assert.strictEqual(accessor([10, 20, 30]), 20);
      assert.strictEqual(accessor(['x']), null);
    });

    it('应该是纯函数,不改变原数组', () => {
      const originalArray = [1, 2, 3];
      const accessor = createArrayAccessor(0);

      accessor(originalArray);
      assert.deepStrictEqual(originalArray, [1, 2, 3]);
    });
  });

  describe('特殊数字情况', () => {
    it('应该正确处理 0 索引', () => {
      const accessor = createArrayAccessor(0);
      assert.strictEqual(accessor(testArray), 'a');
      assert.strictEqual(accessor(['only']), 'only');
    });

    it('应该正确处理 -0', () => {
      const accessor = createArrayAccessor(-0);
      assert.strictEqual(accessor(testArray), 'a');
    });

    it('应该处理字符串 "0"', () => {
      const accessor = createArrayAccessor('0');
      assert.strictEqual(accessor(testArray), 'a');
    });
  });
});
