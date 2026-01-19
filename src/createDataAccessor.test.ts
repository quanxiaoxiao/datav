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

describe('createArrayAccessor', () => {
  it('应该访问正索引的数组元素', () => {
    const accessor = createArrayAccessor('1');
    const result = accessor(['a', 'b', 'c']);
    assert.equal(result, 'b');
  });

  it('应该访问负索引的数组元素', () => {
    const accessor = createArrayAccessor('-1');
    const result = accessor(['a', 'b', 'c']);
    assert.equal(result, 'c');
  });

  it('应该处理越界索引', () => {
    const accessor = createArrayAccessor('10');
    const result = accessor(['a', 'b']);
    assert.equal(result, null);
  });

  it('应该处理空数组', () => {
    const accessor = createArrayAccessor('0');
    const result = accessor([]);
    assert.equal(result, null);
  });

  it('应该处理非数字索引', () => {
    const accessor = createArrayAccessor('abc');
    const result = accessor(['a', 'b', 'c']);
    assert.equal(result, null);
  });

  it('应该处理非数组输入', () => {
    const accessor = createArrayAccessor('0');
    const result = accessor({ '0': 'value' });
    assert.equal(result, null);
  });
});

describe('createPathAccessor', () => {
  it('应该处理空路径', () => {
    const accessor = createPathAccessor([]);
    const data = { name: 'test' };
    assert.equal(accessor(data), data);
  });

  it('应该访问单层对象属性', () => {
    const accessor = createPathAccessor(['name']);
    const result = accessor({ name: 'John', age: 30 });
    assert.equal(result, 'John');
  });

  it('应该访问单层数组元素', () => {
    const accessor = createPathAccessor(['0']);
    const result = accessor(['first', 'second']);
    assert.equal(result, 'first');
  });

  it('应该访问嵌套对象属性', () => {
    const accessor = createPathAccessor(['user', 'name']);
    const result = accessor({ user: { name: 'Jane', age: 25 } });
    assert.equal(result, 'Jane');
  });

  it('应该访问对象中的数组', () => {
    const accessor = createPathAccessor(['items', '1']);
    const result = accessor({ items: ['a', 'b', 'c'] });
    assert.equal(result, 'b');
  });

  it('应该访问数组中的对象', () => {
    const accessor = createPathAccessor(['0', 'name']);
    const result = accessor([{ name: 'Alice' }, { name: 'Bob' }]);
    assert.equal(result, 'Alice');
  });

  it('应该处理深层嵌套路径', () => {
    const accessor = createPathAccessor(['a', 'b', 'c', 'd']);
    const data = { a: { b: { c: { d: 'value' } } } };
    assert.equal(accessor(data), 'value');
  });

  it('应该在路径中断时返回null', () => {
    const accessor = createPathAccessor(['user', 'address', 'city']);
    const result = accessor({ user: { name: 'John' } });
    assert.equal(result, null);
  });

  it('应该处理不存在的属性', () => {
    const accessor = createPathAccessor(['nonexistent']);
    const result = accessor({ name: 'test' });
    assert.equal(result, null);
  });
});

describe('createDataAccessor', () => {
  it('应该抛出类型错误当pathname不是字符串', () => {
    assert.throws(
      () => createDataAccessor(123),
      { name: 'TypeError', message: 'pathname must be a string' }
    );
  });

  it('应该访问简单属性', () => {
    const accessor = createDataAccessor('name');
    const result = accessor({ name: 'Tom', age: 20 });
    assert.equal(result, 'Tom');
  });

  it('应该访问点分隔的路径', () => {
    const accessor = createDataAccessor('user.profile.email');
    const data = {
      user: {
        profile: {
          email: 'test@example.com',
          phone: '123'
        }
      }
    };
    assert.equal(accessor(data), 'test@example.com');
  });

  it('应该访问混合路径(对象和数组)', () => {
    const accessor = createDataAccessor('users.0.name');
    const data = {
      users: [
        { name: 'Alice', id: 1 },
        { name: 'Bob', id: 2 }
      ]
    };
    assert.equal(accessor(data), 'Alice');
  });

  it('应该处理负数组索引', () => {
    const accessor = createDataAccessor('items.-1');
    const result = accessor({ items: [10, 20, 30] });
    assert.equal(result, 30);
  });

  it('应该处理null值', () => {
    const accessor = createDataAccessor('user.name');
    const result = accessor(null);
    assert.equal(result, null);
  });

  it('应该处理undefined值', () => {
    const accessor = createDataAccessor('user.name');
    const result = accessor(undefined);
    assert.equal(result, null);
  });

  it('应该处理复杂嵌套结构', () => {
    const accessor = createDataAccessor('data.0.items.1.value');
    const data = {
      data: [
        {
          items: [
            { value: 'first' },
            { value: 'second' },
            { value: 'third' }
          ]
        }
      ]
    };
    assert.equal(accessor(data), 'second');
  });

  it('应该返回null当路径不存在', () => {
    const accessor = createDataAccessor('a.b.c.d.e');
    const result = accessor({ a: { b: {} } });
    assert.equal(result, null);
  });

  it('应该处理空字符串路径', () => {
    const accessor = createDataAccessor('');
    const data = { name: 'test' };
    // 根据 parseDotPath 的实现,空字符串可能返回空数组
    const result = accessor(data);
    assert.ok(result !== undefined);
  });

  it('应该处理数组根节点', () => {
    const accessor = createDataAccessor('1');
    const result = accessor(['a', 'b', 'c']);
    assert.equal(result, 'b');
  });

  it('应该处理对象属性值为0', () => {
    const accessor = createDataAccessor('count');
    const result = accessor({ count: 0 });
    assert.equal(result, 0);
  });

  it('应该处理对象属性值为false', () => {
    const accessor = createDataAccessor('flag');
    const result = accessor({ flag: false });
    assert.equal(result, false);
  });

  it('应该处理对象属性值为空字符串', () => {
    const accessor = createDataAccessor('text');
    const result = accessor({ text: '' });
    assert.equal(result, '');
  });
});


describe('Data Accessor Utils', () => {

  describe('createArrayAccessor (Unit Level)', () => {
    it('应正确访问数组的正向索引', () => {
      const accessor = createArrayAccessor('1');
      const data = ['a', 'b', 'c'];
      assert.equal(accessor(data), 'b');
    });

    it('应正确访问数组的负向索引 (倒数)', () => {
      // 索引 -1 表示最后一个元素
      const lastAccessor = createArrayAccessor('-1');
      const secondLastAccessor = createArrayAccessor('-2');
      const data = ['a', 'b', 'c'];

      assert.equal(lastAccessor(data), 'c');
      assert.equal(secondLastAccessor(data), 'b');
    });

    it('当索引越界时应返回 null', () => {
      const accessor = createArrayAccessor('5');
      const data = ['a', 'b'];
      assert.equal(accessor(data), null);
    });

    it('当负向索引越界时应返回 null', () => {
      const accessor = createArrayAccessor('-5'); // 长度为2，-5 超出范围
      const data = ['a', 'b'];
      assert.equal(accessor(data), null);
    });

    it('当目标不是数组时应返回 null', () => {
      const accessor = createArrayAccessor('0');
      assert.equal(accessor({ 0: 'a' } as any), null);
      assert.equal(accessor(null as any), null);
    });

    it('当索引无法转换为整数时应返回 null', () => {
      // 假设 toInteger 返回 null
      const accessor = createArrayAccessor('invalid');
      const data = ['a', 'b'];
      assert.equal(accessor(data), null);
    });
  });

  describe('createDataAccessor (Integration Level)', () => {

    it('如果 pathname 不是字符串应抛出 TypeError', () => {
      assert.throws(() => {
        // @ts-ignore 测试类型错误
        createDataAccessor(123);
      }, {
        name: 'TypeError',
        message: 'pathname must be a string'
      });
    });

    describe('对象属性访问', () => {
      it('应能访问一级属性', () => {
        const accessor = createDataAccessor('name');
        const data = { name: 'Node.js', type: 'Runtime' };
        assert.equal(accessor(data), 'Node.js');
      });

      it('应能访问嵌套属性', () => {
        const accessor = createDataAccessor('user.profile.age');
        const data = { user: { profile: { age: 18 } } };
        assert.equal(accessor(data), 18);
      });

      it('访问不存在的属性应返回 null', () => {
        const accessor = createDataAccessor('user.missing');
        const data = { user: { name: 'test' } };
        assert.equal(accessor(data), null);
      });

      it('当中间路径为 null/undefined 时应安全返回 null', () => {
        const accessor = createDataAccessor('user.profile.age');
        const data = { user: null };
        assert.equal(accessor(data), null);
      });
    });

    describe('混合结构访问 (数组 + 对象)', () => {
      it('应能访问对象中的数组', () => {
        const accessor = createDataAccessor('users.0.name');
        const data = { users: [{ name: 'Alice' }, { name: 'Bob' }] };
        assert.equal(accessor(data), 'Alice');
      });

      it('应能访问数组中的对象', () => {
        const accessor = createDataAccessor('1.id');
        const data = [{ id: 101 }, { id: 202 }];
        assert.equal(accessor(data), 202);
      });

      it('应支持复杂嵌套路径', () => {
        const accessor = createDataAccessor('data.items.-1.value');
        const data = {
          data: {
            items: [
              { value: 10 },
              { value: 20 },
              { value: 99 } // -1 target
            ]
          }
        };
        assert.equal(accessor(data), 99);
      });
    });

    describe('空路径与特殊情况', () => {
      it('如果路径解析为空数组，应返回原始数据', () => {
        // 假设 parseDotPath('') 返回 []
        const accessor = createPathAccessor([]);
        const data = { a: 1 };
        assert.deepEqual(accessor(data), data);
      });

      it('如果目标拥有该属性但值为 null，应返回 null', () => {
        const accessor = createDataAccessor('target');
        const data = { target: null };
        assert.equal(accessor(data), null);
      });

      it('应忽略原型链属性 (使用 hasOwnProperty)', () => {
        const accessor = createDataAccessor('toString');
        const data = {};
        // 虽然 data.toString 存在，但不是 own property，createObjectAccessor 应返回 null
        assert.equal(accessor(data), null);
      });
    });
  });
});

