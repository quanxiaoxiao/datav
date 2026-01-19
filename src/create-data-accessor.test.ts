import * as assert from 'node:assert';
import { test, describe, it } from 'node:test';

import { createArrayAccessor, createDataAccessor, createPathAccessor } from './create-data-accessor.js';

describe('createDataAccessor', () => {
  describe('类型验证', () => {
    it('应抛出类型错误当pathname不是字符串', () => {
      assert.throws(
        () => createDataAccessor(123 as any),
        { name: 'TypeError', message: 'pathname must be a string' }
      );
    });
  });

  describe('字符串路径解析', () => {
    it('应该解析点路径并创建路径访问器', () => {
      const accessor = createDataAccessor('user.name');
      assert.strictEqual(accessor({ user: { name: 'John' } }), 'John');
    });

    it('应该处理简单的属性路径', () => {
      const accessor = createDataAccessor('name');
      assert.strictEqual(accessor({ name: 'Alice' }), 'Alice');
    });

    it('应该处理深层嵌套路径', () => {
      const accessor = createDataAccessor('a.b.c.d');
      assert.strictEqual(accessor({ a: { b: { c: { d: 'deep value' } } } }), 'deep value');
    });

    it('应该处理空字符串路径', () => {
      const accessor = createDataAccessor('');
      const input = { name: 'John' };
      assert.strictEqual(accessor(input), input);
    });
  });

  describe('混合路径访问', () => {
    it('应该访问对象中的数组元素', () => {
      const accessor = createDataAccessor('users.0.name');
      const data = {
        users: [
          { name: 'Alice', id: 1 },
          { name: 'Bob', id: 2 }
        ]
      };
      assert.strictEqual(accessor(data), 'Alice');
    });

    it('应该处理负数组索引', () => {
      const accessor = createDataAccessor('items.-1');
      assert.strictEqual(accessor({ items: [10, 20, 30] }), 30);
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
      assert.strictEqual(accessor(data), 'second');
    });

    it('应该处理数组根节点', () => {
      const accessor = createDataAccessor('1');
      assert.strictEqual(accessor(['a', 'b', 'c']), 'b');
    });
  });

  describe('边界情况', () => {
    it('应该处理null值', () => {
      const accessor = createDataAccessor('user.name');
      assert.strictEqual(accessor(null), null);
    });

    it('应该处理undefined值', () => {
      const accessor = createDataAccessor('user.name');
      assert.strictEqual(accessor(undefined), null);
    });

    it('应该返回null当路径不存在', () => {
      const accessor = createDataAccessor('a.b.c.d.e');
      assert.strictEqual(accessor({ a: { b: {} } }), null);
    });

    it('应该处理值为0的属性', () => {
      const accessor = createDataAccessor('count');
      assert.strictEqual(accessor({ count: 0 }), 0);
    });

    it('应该处理值为false的属性', () => {
      const accessor = createDataAccessor('flag');
      assert.strictEqual(accessor({ flag: false }), false);
    });

    it('应该处理值为空字符串的属性', () => {
      const accessor = createDataAccessor('text');
      assert.strictEqual(accessor({ text: '' }), '');
    });
  });

  describe('访问器复用', () => {
    it('同一个访问器应该可以多次调用', () => {
      const accessor = createDataAccessor('value');

      assert.strictEqual(accessor({ value: 1 }), 1);
      assert.strictEqual(accessor({ value: 2 }), 2);
      assert.strictEqual(accessor({ value: 3 }), 3);
    });
  });

  describe('根路径引用 ($)', () => {
    it('应该解析单个 $ 并返回原始数据', () => {
      const accessor = createDataAccessor('$');
      const data = { name: 'John', age: 30 };
      assert.deepStrictEqual(accessor(data), data);
    });

    it('应该使用 $. 访问根数据中的嵌套属性', () => {
      const accessor = createDataAccessor('$.user.name');
      const data = {
        user: { name: 'Alice', age: 25 },
        settings: { theme: 'dark' }
      };
      assert.strictEqual(accessor(data), 'Alice');
    });

    it('应该使用 $. 访问根数据中的数组元素', () => {
      const accessor = createDataAccessor('$.0');
      const data = ['first', 'second', 'third'];
      assert.strictEqual(accessor(data), 'first');
    });

    it('应该支持 $. 后跟复杂嵌套路径', () => {
      const accessor = createDataAccessor('$.data.items.0.name');
      const data = {
        data: {
          items: [
            { name: 'Item1', value: 100 },
            { name: 'Item2', value: 200 }
          ]
        },
        other: { value: 'ignored' }
      };
      assert.strictEqual(accessor(data), 'Item1');
    });

    it('应该支持混合使用 $ 和普通路径', () => {
      const accessor = createDataAccessor('$.user');
      const data = { user: { name: 'Bob' }, other: { name: 'ignored' } };
      assert.deepStrictEqual(accessor(data), { name: 'Bob' });
    });

    it('应该处理 $ 路径访问不存在的属性', () => {
      const accessor = createDataAccessor('$.missing');
      const data = { name: 'test' };
      assert.strictEqual(accessor(data), null);
    });

    it('应该处理 $ 路径访问 null 数据', () => {
      const accessor = createDataAccessor('$.user.name');
      assert.strictEqual(accessor(null), null);
    });

    it('应该处理 $ 路径访问 undefined 数据', () => {
      const accessor = createDataAccessor('$.user.name');
      assert.strictEqual(accessor(undefined), null);
    });

    it('应该支持 $ 路径中的负索引', () => {
      const accessor = createDataAccessor('$.items.-1');
      const data = { items: ['a', 'b', 'c'] };
      assert.strictEqual(accessor(data), 'c');
    });
  });
});

// ==================== createArrayAccessor 测试 ====================

describe('createArrayAccessor', () => {
  const testArray = ['a', 'b', 'c', 'd', 'e'];

  describe('数字索引访问', () => {
    it('应该返回正确的数组元素 - 正数索引', () => {
      assert.strictEqual(createArrayAccessor(0)(testArray), 'a');
      assert.strictEqual(createArrayAccessor(2)(testArray), 'c');
      assert.strictEqual(createArrayAccessor(4)(testArray), 'e');
    });

    it('应该支持负数索引', () => {
      assert.strictEqual(createArrayAccessor(-1)(testArray), 'e');
      assert.strictEqual(createArrayAccessor(-2)(testArray), 'd');
      assert.strictEqual(createArrayAccessor(-5)(testArray), 'a');
    });

    it('应该处理索引越界 - 正数', () => {
      assert.strictEqual(createArrayAccessor(10)(testArray), null);
      assert.strictEqual(createArrayAccessor(5)(testArray), null);
    });

    it('应该处理索引越界 - 负数', () => {
      assert.strictEqual(createArrayAccessor(-10)(testArray), null);
      assert.strictEqual(createArrayAccessor(-6)(testArray), null);
    });

    it('应该拒绝浮点数索引', () => {
      assert.strictEqual(createArrayAccessor(1.5)(testArray), null);
      assert.strictEqual(createArrayAccessor(-2.3)(testArray), null);
    });

    it('应该正确处理特殊数字', () => {
      assert.strictEqual(createArrayAccessor(0)(testArray), 'a');
      assert.strictEqual(createArrayAccessor(-0)(testArray), 'a');
    });
  });

  describe('字符串索引访问', () => {
    it('应该将有效的数字字符串转换为索引', () => {
      assert.strictEqual(createArrayAccessor('0')(testArray), 'a');
      assert.strictEqual(createArrayAccessor('3')(testArray), 'd');
    });

    it('应该支持负数字符串索引', () => {
      assert.strictEqual(createArrayAccessor('-1')(testArray), 'e');
      assert.strictEqual(createArrayAccessor('-3')(testArray), 'c');
    });

    it('应该拒绝无效的字符串索引', () => {
      assert.strictEqual(createArrayAccessor('abc')(testArray), null);
      assert.strictEqual(createArrayAccessor('1.5')(testArray), null);
      assert.strictEqual(createArrayAccessor('01')(testArray), null);
      assert.strictEqual(createArrayAccessor('2a')(testArray), null);
    });

    it('应该处理 "length" 特殊属性', () => {
      assert.strictEqual(createArrayAccessor('length')(testArray), null);
      assert.strictEqual(createArrayAccessor('length')([]), null);
    });
  });

  describe('边界情况', () => {
    it('应该处理空数组', () => {
      assert.strictEqual(createArrayAccessor(0)([]), null);
      assert.strictEqual(createArrayAccessor(-1)([]), null);
    });

    it('应该处理单元素数组', () => {
      const singleArray = ['only'];
      assert.strictEqual(createArrayAccessor(0)(singleArray), 'only');
      assert.strictEqual(createArrayAccessor(-1)(singleArray), 'only');
      assert.strictEqual(createArrayAccessor(1)(singleArray), null);
    });

    it('应该拒绝无效的索引类型', () => {
      assert.strictEqual(createArrayAccessor(null as any)(testArray), null);
      assert.strictEqual(createArrayAccessor(undefined as any)(testArray), null);
      assert.strictEqual(createArrayAccessor({} as any)(testArray), null);
      assert.strictEqual(createArrayAccessor([] as any)(testArray), null);
    });

    it('应该处理非数组输入', () => {
      assert.strictEqual(createArrayAccessor('0')({ '0': 'value' } as any), null);
      assert.strictEqual(createArrayAccessor('0')(null as any), null);
    });

    it('应该处理包含各种类型元素的数组', () => {
      const mixedArray = [null, undefined, 0, '', false, { key: 'value' }];
      assert.strictEqual(createArrayAccessor(0)(mixedArray), null);
      assert.strictEqual(createArrayAccessor(1)(mixedArray), undefined);
      assert.deepStrictEqual(createArrayAccessor(5)(mixedArray), { key: 'value' });
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
});

// ==================== createPathAccessor 测试 ====================

describe('createPathAccessor', () => {
  describe('空路径', () => {
    it('应该返回原始数据', () => {
      const accessor = createPathAccessor([]);
      const data = { name: 'test', value: 123 };
      assert.deepEqual(accessor(data), data);
    });

    it('应该返回原始数组', () => {
      const accessor = createPathAccessor([]);
      const data = [1, 2, 3];
      assert.deepEqual(accessor(data), data);
    });

    it('应该返回原始基本类型', () => {
      const accessor = createPathAccessor([]);
      assert.equal(accessor('hello'), 'hello');
      assert.equal(accessor(42), 42);
      assert.equal(accessor(null), null);
    });
  });

  describe('单层路径 - 对象访问', () => {
    it('应该正确访问对象属性', () => {
      const accessor = createPathAccessor(['name']);
      assert.equal(accessor({ name: 'Alice', age: 30 }), 'Alice');
    });

    it('不存在的属性应该返回 null', () => {
      const accessor = createPathAccessor(['missing']);
      assert.equal(accessor({ name: 'Alice' }), null);
    });

    it('null 或 undefined 数据应该返回 null', () => {
      const accessor = createPathAccessor(['name']);
      assert.equal(accessor(null), null);
      assert.equal(accessor(undefined), null);
    });

    it('应该访问嵌套对象', () => {
      const accessor = createPathAccessor(['user']);
      assert.deepEqual(accessor({ user: { name: 'Bob', age: 25 } }), { name: 'Bob', age: 25 });
    });
  });

  describe('单层路径 - 数组访问', () => {
    it('应该通过数组索引访问元素', () => {
      const accessor = createPathAccessor(['0']);
      assert.equal(accessor(['first', 'second', 'third']), 'first');
    });

    it('应该处理空数组', () => {
      const accessor = createPathAccessor(['0']);
      assert.equal(accessor([]), null);
    });
  });

  describe('多层路径 - 嵌套对象', () => {
    it('应该访问嵌套对象的属性', () => {
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

    it('中间路径不存在应该返回 null', () => {
      const accessor = createPathAccessor(['user', 'profile', 'name']);
      assert.equal(accessor({ user: {} }), null);
    });

    it('中间路径为 null 应该返回 null', () => {
      const accessor = createPathAccessor(['user', 'profile', 'name']);
      assert.equal(accessor({ user: null }), null);
    });
  });

  describe('混合路径 - 对象和数组', () => {
    it('应该访问对象中的数组元素', () => {
      const accessor = createPathAccessor(['users', '0', 'name']);
      const data = {
        users: [
          { name: 'David', age: 28 },
          { name: 'Eve', age: 32 },
        ],
      };
      assert.equal(accessor(data), 'David');
    });

    it('应该访问数组中的对象属性', () => {
      const accessor = createPathAccessor(['0', 'name']);
      const data = [
        { name: 'Frank', age: 35 },
        { name: 'Grace', age: 29 },
      ];
      assert.equal(accessor(data), 'Frank');
    });

    it('复杂嵌套结构', () => {
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
      assert.equal(accessor(data), 'Helen');
    });

    it('应该支持负数组索引', () => {
      const accessor = createPathAccessor(['items', '-1']);
      assert.equal(accessor({ items: ['a', 'b', 'c'] }), 'c');
    });
  });

  describe('边界情况', () => {
    it('路径指向 undefined 值', () => {
      const accessor = createPathAccessor(['value']);
      assert.equal(accessor({ value: undefined }), undefined);
    });

    it('路径指向 0 值', () => {
      const accessor = createPathAccessor(['count']);
      assert.equal(accessor({ count: 0 }), 0);
    });

    it('路径指向空字符串', () => {
      const accessor = createPathAccessor(['text']);
      assert.equal(accessor({ text: '' }), '');
    });

    it('路径指向 false 值', () => {
      const accessor = createPathAccessor(['flag']);
      assert.equal(accessor({ flag: false }), false);
    });

    it('空对象', () => {
      const accessor = createPathAccessor(['key']);
      assert.equal(accessor({}), null);
    });
  });

  describe('特殊键名', () => {
    it('包含特殊字符的键名', () => {
      const accessor = createPathAccessor(['user-name']);
      assert.equal(accessor({ 'user-name': 'Jack' }), 'Jack');
    });

    it('数字字符串键名', () => {
      const accessor = createPathAccessor(['123']);
      assert.equal(accessor({ 123: 'numeric key' }), 'numeric key');
    });

    it('包含点号的键名', () => {
      const accessor = createPathAccessor(['user.name']);
      assert.equal(accessor({ 'user.name': 'Kelly' }), 'Kelly');
    });
  });

  describe('性能和缓存', () => {
    it('多次调用相同访问器应该得到一致结果', () => {
      const accessor = createPathAccessor(['user', 'name']);
      const data = { user: { name: 'Liam' } };

      assert.equal(accessor(data), 'Liam');
      assert.equal(accessor(data), 'Liam');
      assert.equal(accessor(data), 'Liam');
    });

    it('访问器应该是纯函数', () => {
      const accessor = createPathAccessor(['value']);
      const data1 = { value: 'first' };
      const data2 = { value: 'second' };

      assert.equal(accessor(data1), 'first');
      assert.equal(accessor(data2), 'second');
      assert.equal(accessor(data1), 'first');
    });
  });

  describe('安全性', () => {
    it('应忽略原型链属性', () => {
      const accessor = createPathAccessor(['toString']);
      assert.equal(accessor({}), null);
    });
  });
});
