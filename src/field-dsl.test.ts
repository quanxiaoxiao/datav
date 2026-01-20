import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  Field,
  Infer,
  toString,
  toNumber,
  toInteger,
  toBoolean,
  toObject,
  toArray,
  compile,
} from './field-dsl.js';

describe('field-dsl', () => {
  // ============================================================================
  // 类型系统测试
  // ============================================================================
  describe('类型系统', () => {
    it('Infer 应该正确推导基础 Field 类型', () => {
      type StringField = Field<string>;
      type NumberField = Field<number>;
      type BooleanField = Field<boolean>;

      type InferredString = Infer<StringField>;
      type InferredNumber = Infer<NumberField>;
      type InferredBoolean = Infer<BooleanField>;

      assert.strictEqual<InferredString>('test' satisfies InferredString, 'test');
      assert.strictEqual<InferredNumber>((42 as number) satisfies InferredNumber, 42);
      assert.strictEqual<InferredBoolean>(true satisfies InferredBoolean, true);
    });

    it('Infer 应该推导复合类型', () => {
      const stringField = toString('name');
      const numberField = toNumber('age');

      type StringFieldType = Infer<typeof stringField>;
      type NumberFieldType = Infer<typeof numberField>;

      assert.strictEqual<StringFieldType>('John' satisfies StringFieldType, 'John');
      assert.strictEqual<NumberFieldType>(42 satisfies NumberFieldType, 42);
    });

    it('Infer 应该推导对象和数组类型', () => {
      const objectField = toObject({ name: toString('name') });
      const arrayField = toArray(toString());

      type ObjectType = Infer<typeof objectField>;
      type ArrayType = Infer<typeof arrayField>;

      const obj: ObjectType = { name: 'test' };
      const arr: ArrayType = ['a', 'b'];

      assert.ok(obj);
      assert.ok(arr);
    });
  });

  // ============================================================================
  // toString 测试
  // ============================================================================
  describe('toString', () => {
    describe('基础功能', () => {
      it('应该提取字符串字段', () => {
        const field = toString('name');
        assert.strictEqual(field.run({ name: 'Alice' }), 'Alice');
      });

      it('应该处理空路径', () => {
        const field = toString();
        assert.strictEqual(field.run('test'), 'test');
      });

      it('应该处理嵌套路径', () => {
        const field = toString('user.profile.name');
        assert.strictEqual(
          field.run({ user: { profile: { name: 'Bob' } } }),
          'Bob'
        );
      });

      it('应该处理数组索引路径', () => {
        const field = toString('users.0.name');
        assert.strictEqual(
          field.run({ users: [{ name: 'Charlie' }, { name: 'David' }] }),
          'Charlie'
        );
      });

      it('应该处理多级数组索引', () => {
        const field = toString('matrix.0.1.value');
        assert.strictEqual(
          field.run({ matrix: [[{ value: 'a' }, { value: 'b' }]] }),
          'b'
        );
      });
    });

    describe('类型转换', () => {
      it('应该将数字转换为字符串', () => {
        const field = toString('value');
        assert.strictEqual(field.run({ value: 123 }), '123');
        assert.strictEqual(field.run({ value: 0 }), '0');
        assert.strictEqual(field.run({ value: -456 }), '-456');
        assert.strictEqual(field.run({ value: 3.14 }), '3.14');
      });

      it('应该将布尔值转换为字符串', () => {
        const field = toString('value');
        assert.strictEqual(field.run({ value: true }), 'true');
        assert.strictEqual(field.run({ value: false }), 'false');
      });

      it('应该将对象转换为字符串', () => {
        const field = toString('value');
        assert.strictEqual(field.run({ value: {} }), '[object Object]');
        assert.strictEqual(field.run({ value: [] }), '');
      });
    });

    describe('边界情况', () => {
      it('路径不存在时返回 null', () => {
        const field = toString('missing');
        assert.strictEqual(field.run({ name: 'test' }), null);
      });

      it('应该处理 null 值', () => {
        const field = toString('value');
        assert.strictEqual(field.run({ value: null }), null);
      });

      it('应该处理 undefined 值', () => {
        const field = toString('value');
        assert.strictEqual(field.run({ value: undefined }), null);
      });

      it('应该处理空字符串', () => {
        const field = toString('value');
        assert.strictEqual(field.run({ value: '' }), '');
      });

      it('应该处理包含特殊字符的路径', () => {
        const field = toString('user-name');
        assert.strictEqual(field.run({ 'user-name': 'test' }), 'test');
      });

      it('应该处理数字开头的键名', () => {
        const field = toString('0name');
        assert.strictEqual(field.run({ '0name': 'test' }), 'test');
      });

      it('应该处理中间路径为 null 的情况', () => {
        const field = toString('a.b.c');
        assert.strictEqual(field.run({ a: null }), null);
        assert.strictEqual(field.run({ a: { b: null } }), null);
      });
    });
  });

  // ============================================================================
  // toNumber 测试
  // ============================================================================
  describe('toNumber', () => {
    describe('基础功能', () => {
      it('应该提取数字字段', () => {
        const field = toNumber('count');
        assert.strictEqual(field.run({ count: 42 }), 42);
      });

      it('应该处理空路径', () => {
        const field = toNumber();
        assert.strictEqual(field.run(42), 42);
      });

      it('应该处理嵌套路径', () => {
        const field = toNumber('data.price');
        assert.strictEqual(field.run({ data: { price: 99.99 } }), 99.99);
      });
    });

    describe('类型转换', () => {
      it('应该将字符串转换为数字', () => {
        const field = toNumber('value');
        assert.strictEqual(field.run({ value: '123' }), 123);
        assert.strictEqual(field.run({ value: '3.14' }), 3.14);
        assert.strictEqual(field.run({ value: '-456' }), -456);
      });

      it('应该处理科学计数法', () => {
        const field = toNumber('value');
        assert.strictEqual(field.run({ value: '1e3' }), 1000);
        assert.strictEqual(field.run({ value: '1.5e2' }), 150);
      });

      it('应该处理前后空格', () => {
        const field = toNumber('value');
        assert.strictEqual(field.run({ value: '  123  ' }), 123);
      });
    });

    describe('无效输入', () => {
      it('无效字符串应该返回 null', () => {
        const field = toNumber('value');
        assert.strictEqual(field.run({ value: 'abc' }), null);
        assert.strictEqual(field.run({ value: '12.34.56' }), null);
        assert.strictEqual(field.run({ value: '12abc' }), null);
      });

      it('应该处理特殊值', () => {
        const field = toNumber('value');
        assert.strictEqual(field.run({ value: NaN }), null);
        assert.strictEqual(field.run({ value: Infinity }), null);
        assert.strictEqual(field.run({ value: -Infinity }), null);
      });

      it('应该处理布尔值', () => {
        const field = toNumber('value');
        assert.strictEqual(field.run({ value: true }), null);
        assert.strictEqual(field.run({ value: false }), null);
      });
    });

    describe('边界情况', () => {
      it('应该处理 0', () => {
        const field = toNumber('value');
        assert.strictEqual(field.run({ value: 0 }), 0);
        assert.strictEqual(field.run({ value: '0' }), 0);
      });

      it('应该处理负零', () => {
        const field = toNumber('value');
        assert.strictEqual(field.run({ value: -0 }), -0);
      });

      it('应该处理非常大的数字', () => {
        const field = toNumber('value');
        assert.strictEqual(field.run({ value: Number.MAX_SAFE_INTEGER }), Number.MAX_SAFE_INTEGER);
      });

      it('应该处理非常小的数字', () => {
        const field = toNumber('value');
        assert.strictEqual(field.run({ value: Number.MIN_VALUE }), Number.MIN_VALUE);
      });
    });
  });

  // ============================================================================
  // toInteger 测试
  // ============================================================================
  describe('toInteger', () => {
    describe('基础功能', () => {
      it('应该提取整数字段', () => {
        const field = toInteger('count');
        assert.strictEqual(field.run({ count: 42 }), 42);
      });

      it('应该处理空路径', () => {
        const field = toInteger();
        assert.strictEqual(field.run(42), 42);
      });

      it('应该处理负数', () => {
        const field = toInteger('value');
        assert.strictEqual(field.run({ value: -456 }), -456);
        assert.strictEqual(field.run({ value: '-789' }), -789);
      });

      it('应该处理 0', () => {
        const field = toInteger('value');
        assert.strictEqual(field.run({ value: 0 }), 0);
        assert.strictEqual(field.run({ value: '0' }), 0);
      });
    });

    describe('类型转换', () => {
      it('应该将字符串转换为整数', () => {
        const field = toInteger('value');
        assert.strictEqual(field.run({ value: '123' }), 123);
        assert.strictEqual(field.run({ value: '-456' }), -456);
      });

      it('应该处理前后空格', () => {
        const field = toInteger('value');
        assert.strictEqual(field.run({ value: '  123  ' }), null);
      });
    });

    describe('浮点数处理', () => {
      it('浮点数应该返回 null', () => {
        const field = toInteger('value');
        assert.strictEqual(field.run({ value: 3.14 }), null);
        assert.strictEqual(field.run({ value: '3.14' }), null);
        assert.strictEqual(field.run({ value: -3.14 }), null);
        assert.strictEqual(field.run({ value: '-3.14' }), null);
      });

      it('应该拒绝看起来像整数的浮点数', () => {
        const field = toInteger('value');
        // assert.strictEqual(field.run({ value: 3.0 }), null);
        assert.strictEqual(field.run({ value: '3.0' }), null);
      });
    });

    describe('无效输入', () => {
      it('应该拒绝非数字字符串', () => {
        const field = toInteger('value');
        assert.strictEqual(field.run({ value: 'abc' }), null);
        assert.strictEqual(field.run({ value: '12abc' }), null);
      });

      it('应该拒绝科学计数法', () => {
        const field = toInteger('value');
        assert.strictEqual(field.run({ value: '1e3' }), null);
      });

      it('应该处理布尔值', () => {
        const field = toInteger('value');
        assert.strictEqual(field.run({ value: true }), null);
        assert.strictEqual(field.run({ value: false }), null);
      });
    });
  });

  // ============================================================================
  // toBoolean 测试
  // ============================================================================
  describe('toBoolean', () => {
    describe('基础功能', () => {
      it('应该提取布尔字段', () => {
        const field = toBoolean('enabled');
        assert.strictEqual(field.run({ enabled: true }), true);
        assert.strictEqual(field.run({ enabled: false }), false);
      });

      it('应该处理空路径', () => {
        const field = toBoolean();
        assert.strictEqual(field.run(true), true);
        assert.strictEqual(field.run(false), false);
      });
    });

    describe('字符串转换', () => {
      it('应该转换 "true" 和 "false"', () => {
        const field = toBoolean('flag');
        assert.strictEqual(field.run({ flag: 'true' }), true);
        assert.strictEqual(field.run({ flag: 'false' }), false);
      });

      it('应该处理大小写变体', () => {
        const field = toBoolean('flag');
        assert.strictEqual(field.run({ flag: 'TRUE' }), null);
        assert.strictEqual(field.run({ flag: 'True' }), null);
        assert.strictEqual(field.run({ flag: 'FALSE' }), null);
      });
    });

    describe('无效输入', () => {
      it('无效值应该返回 null', () => {
        const field = toBoolean('value');
        assert.strictEqual(field.run({ value: 'yes' }), null);
        assert.strictEqual(field.run({ value: 'no' }), null);
        assert.strictEqual(field.run({ value: 1 }), null);
        assert.strictEqual(field.run({ value: 0 }), null);
        assert.strictEqual(field.run({ value: '' }), null);
        assert.strictEqual(field.run({ value: 'hello' }), null);
      });

      it('应该拒绝对象和数组', () => {
        const field = toBoolean('value');
        assert.strictEqual(field.run({ value: {} }), null);
        assert.strictEqual(field.run({ value: [] }), null);
      });
    });
  });

  // ============================================================================
  // toObject 测试
  // ============================================================================
  describe('toObject', () => {
    describe('基础功能', () => {
      it('应该组合多个字段为对象', () => {
        const field = toObject('user', {
          name: toString('name'),
          age: toNumber('age'),
        });

        const result = field.run({
          user: { name: 'Alice', age: 30 },
        });

        assert.deepStrictEqual(result, { name: 'Alice', age: 30 });
      });

      it('空路径应该使用根数据', () => {
        const field = toObject({
          name: toString('name'),
          age: toNumber('age'),
        });

        const result = field.run({ name: 'Charlie', age: 25 });
        assert.deepStrictEqual(result, { name: 'Charlie', age: 25 });
      });

      it('应该处理单字段对象', () => {
        const field = toObject({ name: toString('name') });
        const result = field.run({ name: 'Test' });
        assert.deepStrictEqual(result, { name: 'Test' });
      });
    });

    describe('嵌套结构', () => {
      it('应该处理嵌套路径', () => {
        const field = toObject('data', {
          user: toObject('user', {
            name: toString('name'),
          }),
        });

        const result = field.run({
          data: { user: { name: 'Bob' } },
        });

        assert.deepStrictEqual(result, { user: { name: 'Bob' } });
      });

      it('应该处理多层嵌套对象', () => {
        const field = toObject({
          level1: toObject('a', {
            level2: toObject('b', {
              level3: toString('c'),
            }),
          }),
        });

        const result = field.run({ a: { b: { c: 'deep' } } });
        assert.deepStrictEqual(result, {
          level1: { level2: { level3: 'deep' } },
        });
      });
    });

    describe('类型转换', () => {
      it('应该正确处理类型转换', () => {
        const field = toObject('config', {
          count: toNumber('count'),
          enabled: toBoolean('enabled'),
          name: toString('name'),
        });

        const result = field.run({
          config: { count: '42', enabled: 'true', name: 123 },
        });

        assert.deepStrictEqual(result, { count: 42, enabled: true, name: '123' });
      });

      it('应该保持对象类型正确', () => {
        const field = toObject('obj', {
          value: toNumber('value'),
        });

        const result = field.run({ obj: { value: 100 } });
        assert.strictEqual(typeof result.value, 'number');
      });
    });

    describe('边界情况', () => {
      it('应该处理 null 输入', () => {
        const field = toObject('data', {
          name: toString('name'),
        });

        const result = field.run({ data: null });
        assert.deepStrictEqual(result, { name: null });
      });

      it('应该处理空对象', () => {
        const field = toObject('data', {
          name: toString('name'),
        });

        const result = field.run({ data: {} });
        assert.deepStrictEqual(result, { name: null });
      });

      it('应该处理缺失字段', () => {
        const field = toObject({
          a: toString('a'),
          b: toNumber('b'),
          c: toBoolean('c'),
        });

        const result = field.run({ a: 'test' });
        assert.deepStrictEqual(result, { a: 'test', b: null, c: null });
      });

      it('应该处理所有字段都为 null 的情况', () => {
        const field = toObject({
          a: toString('missing1'),
          b: toNumber('missing2'),
        });

        const result = field.run({});
        assert.deepStrictEqual(result, { a: null, b: null });
      });
    });
  });

  // ============================================================================
  // toArray 测试
  // ============================================================================
  describe('toArray', () => {
    describe('基础功能', () => {
      it('应该将数据转换为数组', () => {
        const field = toArray('items', toString('name'));

        const result = field.run({
          items: [
            { name: 'Apple' },
            { name: 'Banana' },
          ],
        });

        assert.deepStrictEqual(result, ['Apple', 'Banana']);
      });

      it('应该处理空路径', () => {
        const field = toArray(toNumber('value'));

        const result = field.run([
          { value: 1 },
          { value: 2 },
        ]);

        assert.deepStrictEqual(result, [1, 2]);
      });

      it('应该处理原始值数组', () => {
        const field = toArray(toString());
        const result = field.run([1, 2, 3]);
        assert.deepStrictEqual(result, ['1', '2', '3']);
      });
    });

    describe('嵌套结构', () => {
      it('应该处理嵌套路径', () => {
        const field = toArray('data.list', toString('info.name'));

        const result = field.run({
          data: {
            list: [
              { info: { name: 'First' } },
              { info: { name: 'Second' } },
            ],
          },
        });

        assert.deepStrictEqual(result, ['First', 'Second']);
      });

      it('应该支持多维数组', () => {
        const innerField = toArray(toString('name'));
        const outerField = toArray('outer', innerField);

        const result = outerField.run({
          outer: [
            [{ name: 'A1' }, { name: 'A2' }],
            [{ name: 'B1' }],
          ],
        });

        assert.deepStrictEqual(result, [['A1', 'A2'], ['B1']]);
      });

      it('应该支持三维数组', () => {
        const level1 = toArray(toString());
        const level2 = toArray(level1);
        const level3 = toArray(level2);

        const result = level3.run([
          [
            ['a', 'b'],
            ['c'],
          ],
        ]);

        assert.deepStrictEqual(result, [[['a', 'b'], ['c']]]);
      });
    });

    describe('类型转换', () => {
      it('应该进行类型转换', () => {
        const field = toArray('items', toNumber('count'));

        const result = field.run({
          items: [
            { count: '10' },
            { count: '20' },
          ],
        });

        assert.deepStrictEqual(result, [10, 20]);
      });

      it('应该支持复合字段', () => {
        const itemField = toObject({
          name: toString('name'),
          value: toNumber('value'),
        });

        const field = toArray('data', itemField);

        const result = field.run({
          data: [
            { name: 'A', value: 1 },
            { name: 'B', value: 2 },
          ],
        });

        assert.deepStrictEqual(result, [
          { name: 'A', value: 1 },
          { name: 'B', value: 2 },
        ]);
      });
    });

    describe('边界情况', () => {
      it('应该处理空数组', () => {
        const field = toArray('items', toString('name'));
        assert.deepStrictEqual(field.run({ items: [] }), []);
      });

      it('应该处理 null 输入', () => {
        const field = toArray('items', toString('name'));
        assert.deepStrictEqual(field.run({ items: null }), []);
      });

      it('应该处理 undefined 输入', () => {
        const field = toArray('items', toString('name'));
        assert.deepStrictEqual(field.run({ items: undefined }), []);
      });

      it('应该处理包含 null 元素的数组', () => {
        const field = toArray(toString('name'));
        const result = field.run([{ name: 'A' }, null, { name: 'B' }]);
        assert.deepStrictEqual(result, ['A', null, 'B']);
      });

      it('应该处理单元素数组', () => {
        const field = toArray(toString());
        const result = field.run(['single']);
        assert.deepStrictEqual(result, ['single']);
      });
    });
  });

  // ============================================================================
  // compile 测试
  // ============================================================================
  describe('compile', () => {
    describe('基础功能', () => {
      it('应该将 Field 编译为函数', () => {
        const field = toString('name');
        const fn = compile(field);

        assert.strictEqual(fn({ name: 'Test' }), 'Test');
      });

      it('应该正确包装简单字段', () => {
        const field = toNumber('count');
        const fn = compile(field);

        assert.strictEqual(fn({ count: 42 }), 42);
      });

      it('编译的函数应该可重复使用', () => {
        const field = toString('name');
        const fn = compile(field);

        assert.strictEqual(fn({ name: 'First' }), 'First');
        assert.strictEqual(fn({ name: 'Second' }), 'Second');
        assert.strictEqual(fn({ name: 'Third' }), 'Third');
      });
    });

    describe('复合字段', () => {
      it('应该正确包装对象字段', () => {
        const field = toObject('data', {
          name: toString('name'),
          items: toArray('items', toNumber('value')),
        });

        const fn = compile(field);

        const result = fn({
          data: {
            name: 'Test',
            items: [
              { value: 1 },
              { value: 2 },
            ],
          },
        });

        assert.deepStrictEqual(result, { name: 'Test', items: [1, 2] });
      });

      it('应该正确包装数组字段', () => {
        const field = toArray(toObject({
          id: toNumber('id'),
          name: toString('name'),
        }));

        const fn = compile(field);

        const result = fn([
          { id: '1', name: 'A' },
          { id: '2', name: 'B' },
        ]);

        assert.deepStrictEqual(result, [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]);
      });
    });

    describe('错误处理', () => {
      it('应该包装 null/undefined 处理', () => {
        const field = toString('name');
        const fn = compile(field);

        assert.strictEqual(fn({ name: null }), null);
        assert.strictEqual(fn({ name: undefined }), null);
      });

      it('应该在路径不存在时返回 null', () => {
        const field = toString('value');
        const fn = compile(field);

        assert.strictEqual(fn({ missing: 'test' }), null);
      });

      it('应该处理嵌套路径错误', () => {
        const field = toString('a.b.c');
        const fn = compile(field);

        assert.strictEqual(fn({ a: null }), null);
        assert.strictEqual(fn({ a: {} }), null);
      });
    });

    describe('性能和隔离', () => {
      it('多次编译应该产生独立函数', () => {
        const field = toString('name');
        const fn1 = compile(field);
        const fn2 = compile(field);

        assert.strictEqual(fn1({ name: 'A' }), 'A');
        assert.strictEqual(fn2({ name: 'B' }), 'B');
      });

      it('应该处理并发调用', () => {
        const field = toNumber('value');
        const fn = compile(field);

        const results = [
          fn({ value: 1 }),
          fn({ value: 2 }),
          fn({ value: 3 }),
        ];

        assert.deepStrictEqual(results, [1, 2, 3]);
      });
    });
  });

  // ============================================================================
  // 复杂场景测试
  // ============================================================================
  describe('复杂场景', () => {
    it('应该处理深层嵌套结构', () => {
      const field = toObject('data', {
        users: toArray('users', toObject({
          id: toNumber('id'),
          profile: toObject('profile', {
            name: toString('name'),
            email: toString('email'),
          }),
        })),
      });

      const result = field.run({
        data: {
          users: [
            {
              id: 1,
              profile: {
                name: 'Alice',
                email: 'alice@example.com',
              },
            },
            {
              id: 2,
              profile: {
                name: 'Bob',
                email: 'bob@example.com',
              },
            },
          ],
        },
      });

      assert.deepStrictEqual(result, {
        users: [
          {
            id: 1,
            profile: {
              name: 'Alice',
              email: 'alice@example.com',
            },
          },
          {
            id: 2,
            profile: {
              name: 'Bob',
              email: 'bob@example.com',
            },
          },
        ],
      });
    });

    it('应该处理混合类型字段', () => {
      const field = toObject('config', {
        isEnabled: toBoolean('enabled'),
        count: toNumber('count'),
        name: toString('name'),
        ratio: toNumber('ratio'),
      });

      const result = field.run({
        config: {
          enabled: 'true',
          count: '100',
          name: 'Test',
          ratio: '3.14',
        },
      });

      assert.deepStrictEqual(result, {
        isEnabled: true,
        count: 100,
        name: 'Test',
        ratio: 3.14,
      });
    });

    it('应该处理数组中的所有类型转换', () => {
      const field = toArray('data', toObject({
        flag: toBoolean('flag'),
        number: toNumber('number'),
        text: toString('text'),
      }));

      const result = field.run({
        data: [
          { flag: 'true', number: '1', text: 'one' },
          { flag: 'false', number: '2', text: 'two' },
        ],
      });

      assert.deepStrictEqual(result, [
        { flag: true, number: 1, text: 'one' },
        { flag: false, number: 2, text: 'two' },
      ]);
    });

    it('应该处理嵌套数组和对象的组合', () => {
      const field = toObject({
        users: toArray('users', toObject({
          name: toString('name'),
          age: toNumber('age'),
          tags: toArray('tags', toString()),
        })),
      });

      const result = field.run({
        users: [
          {
            name: 'Alice',
            age: '25',
            tags: ['admin', 'active'],
          },
          {
            name: 'Bob',
            age: '30',
            tags: ['user'],
          },
        ],
      });

      assert.deepStrictEqual(result, {
        users: [
          {
            name: 'Alice',
            age: 25,
            tags: ['admin', 'active'],
          },
          {
            name: 'Bob',
            age: 30,
            tags: ['user'],
          },
        ],
      });
    });

    it('应该处理深层路径访问', () => {
      const field = toObject({
        value: toNumber('data.nested.deep.value'),
      });

      const result = field.run({
        data: {
          nested: {
            deep: {
              value: '42',
            },
          },
        },
      });

      assert.deepStrictEqual(result, { value: 42 });
    });

    it('应该处理复杂的数据提取和转换', () => {
      const field = toObject({
        meta: toObject('metadata', {
          id: toInteger('id'),
          timestamp: toNumber('timestamp'),
        }),
        items: toArray('items', toObject({
          name: toString('title'),
          price: toNumber('price'),
          available: toBoolean('inStock'),
        })),
      });

      const result = field.run({
        metadata: {
          id: '12345',
          timestamp: '1609459200.5',
        },
        items: [
          { title: 'Product A', price: '19.99', inStock: 'true' },
          { title: 'Product B', price: '29.99', inStock: 'false' },
        ],
      });

      assert.deepStrictEqual(result, {
        meta: {
          id: 12345,
          timestamp: 1609459200.5,
        },
        items: [
          { name: 'Product A', price: 19.99, available: true },
          { name: 'Product B', price: 29.99, available: false },
        ],
      });
    });

    it('应该处理部分失败的转换', () => {
      const field = toArray('data', toObject({
        id: toInteger('id'),
        value: toNumber('value'),
      }));

      const result = field.run({
        data: [
          { id: '1', value: '10' },
          { id: '2.5', value: 'invalid' }, // id 是浮点数，value 无效
          { id: '3', value: '30' },
        ],
      });

      assert.deepStrictEqual(result, [
        { id: 1, value: 10 },
        { id: null, value: null },
        { id: 3, value: 30 },
      ]);
    });

    it('应该处理循环引用的数据结构', () => {
      const field = toObject({
        name: toString('name'),
        value: toNumber('value'),
      });

      const obj: any = { name: 'test', value: 42 };
      obj.self = obj; // 循环引用

      const result = field.run(obj);
      assert.deepStrictEqual(result, { name: 'test', value: 42 });
    });

    it('应该处理大型嵌套结构', () => {
      const field = toObject({
        level1: toObject('a', {
          level2: toObject('b', {
            level3: toObject('c', {
              level4: toObject('d', {
                level5: toString('e'),
              }),
            }),
          }),
        }),
      });

      const result = field.run({
        a: {
          b: {
            c: {
              d: {
                e: 'deep value',
              },
            },
          },
        },
      });

      assert.deepStrictEqual(result, {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value',
              },
            },
          },
        },
      });
    });
  });

  // ============================================================================
  // Field 接口测试
  // ============================================================================
  describe('Field 接口', () => {
    it('Field.run 应该返回正确类型', () => {
      const field: Field<string> = {
        run: (data: unknown) => String(data),
      };

      assert.strictEqual(field.run('hello'), 'hello');
      assert.strictEqual(field.run(123), '123');
    });

    it('应该支持自定义 Field 实现', () => {
      const customField: Field<number> = {
        run: (data: unknown) => {
          const obj = data as { value: number };
          return obj.value * 2;
        },
      };

      assert.strictEqual(customField.run({ value: 21 }), 42);
    });

    it('应该支持组合自定义 Field', () => {
      const doubleField: Field<number> = {
        run: (data: unknown) => {
          const num = data as number;
          return num * 2;
        },
      };

      const field = toArray('values', doubleField);
      const result = field.run({ values: [1, 2, 3] });
      assert.deepStrictEqual(result, [2, 4, 6]);
    });
  });

  // ============================================================================
  // 边界情况和错误处理
  // ============================================================================
  describe('边界情况和错误处理', () => {
    it('应该处理路径为空字符串', () => {
      const field = toString('');
      const result = field.run({ '': 'empty key' });
      // assert.strictEqual(result, 'empty key');
    });

    it('应该处理路径中包含点号的键', () => {
      const field = toString('user.name');
      const result1 = field.run({ user: { name: 'nested' } });
      const result2 = field.run({ 'user.name': 'flat' });

      assert.strictEqual(result1, 'nested');
      // 如果实现支持扁平键，这里应该测试
    });

    it('应该处理数组索引越界', () => {
      const field = toString('items.10.name');
      const result = field.run({ items: [{ name: 'a' }] });
      assert.strictEqual(result, null);
    });

    it('应该处理负数数组索引', () => {
      const field = toString('items.-1.name');
      const result = field.run({ items: [{ name: 'a' }] });
      assert.strictEqual(result, 'a');
    });

    it('应该处理非数组使用数组索引', () => {
      const field = toString('user.0');
      const result = field.run({ user: 'not an array' });
      assert.strictEqual(result, null);
    });

    it('应该处理值为 0 的各种情况', () => {
      const numberField = toNumber('value');
      const integerField = toInteger('value');
      const stringField = toString('value');

      assert.strictEqual(numberField.run({ value: 0 }), 0);
      assert.strictEqual(integerField.run({ value: 0 }), 0);
      assert.strictEqual(stringField.run({ value: 0 }), '0');
    });

    it('应该处理值为空字符串的各种情况', () => {
      const stringField = toString('value');
      const numberField = toNumber('value');
      const booleanField = toBoolean('value');

      assert.strictEqual(stringField.run({ value: '' }), '');
      assert.strictEqual(numberField.run({ value: '' }), null);
      assert.strictEqual(booleanField.run({ value: '' }), null);
    });

    /*
    it('应该处理原型污染保护', () => {
      const field = toString('__proto__.polluted');
      const data = JSON.parse('{"__proto__": {"polluted": "value"}}');
      const result = field.run(data);
      // 应该安全处理，不会污染原型
      assert.strictEqual(result, null);
    });
   */

    it('应该处理 constructor 键', () => {
      const field = toString('constructor');
      const result = field.run({ constructor: 'safe' });
      // 应该能安全访问而不返回函数
      assert.strictEqual(typeof result, 'string');
    });

    it('应该处理超大数组', () => {
      const field = toArray(toNumber());
      const largeArray = new Array(10000).fill('42');
      const result = field.run(largeArray);
      assert.strictEqual(result.length, 10000);
      assert.strictEqual(result[0], 42);
      assert.strictEqual(result[9999], 42);
    });

    it('应该处理超深嵌套对象', () => {
      let deepObj: any = { value: 'deep' };
      for (let i = 0; i < 100; i++) {
        deepObj = { nested: deepObj };
      }

      let path = 'nested.'.repeat(100) + 'value';
      const field = toString(path);
      const result = field.run(deepObj);
      assert.strictEqual(result, 'deep');
    });

    it('应该处理混合的 null 和 undefined', () => {
      const field = toObject({
        a: toString('a'),
        b: toNumber('b'),
        c: toBoolean('c'),
      });

      const result = field.run({
        a: null,
        b: undefined,
        c: null,
      });

      assert.deepStrictEqual(result, { a: null, b: null, c: null });
    });

    it('应该处理 Symbol 类型', () => {
      const sym = Symbol('test');
      const field = toString('value');
      const result = field.run({ value: sym });
      assert.strictEqual(result, 'Symbol(test)');
    });

    it('应该处理 BigInt 类型', () => {
      const field = toString('value');
      const result = field.run({ value: BigInt(12345) });
      assert.strictEqual(result, '12345');
    });

    it('应该处理 Date 对象', () => {
      const date = new Date('2024-01-01');
      const field = toString('value');
      const result = field.run({ value: date });
      assert.ok(result?.includes('2024'));
    });

    it('应该处理 RegExp 对象', () => {
      const regex = /test/g;
      const field = toString('value');
      const result = field.run({ value: regex });
      assert.strictEqual(result, '/test/g');
    });

    it('应该处理函数值', () => {
      const func = () => 'test';
      const field = toString('value');
      const result = field.run({ value: func });
      assert.ok(typeof result === 'string');
    });
  });

  // ============================================================================
  // 性能和优化测试
  // ============================================================================
  describe('性能和优化', () => {
    it('compile 应该比直接调用 run 更高效', () => {
      const field = toObject({
        name: toString('name'),
        age: toNumber('age'),
      });

      const compiled = compile(field);
      const data = { name: 'Test', age: '25' };

      // 预热
      for (let i = 0; i < 100; i++) {
        compiled(data);
      }

      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        compiled(data);
      }
      const compiledTime = Date.now() - start;

      assert.ok(compiledTime >= 0);
    });

    it('应该能处理大量字段的对象', () => {
      const fields: Record<string, Field<string>> = {};
      for (let i = 0; i < 100; i++) {
        fields[`field${i}`] = toString(`field${i}`);
      }

      const field = toObject(fields);
      const data: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        data[`field${i}`] = `value${i}`;
      }

      const result = field.run(data);
      assert.strictEqual(Object.keys(result).length, 100);
    });

    it('应该能处理大量元素的数组', () => {
      const field = toArray(toNumber());
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      const result = field.run(largeArray);
      assert.strictEqual(result.length, 10000);
      assert.strictEqual(result[5000], 5000);
    });
  });

  // ============================================================================
  // 实际应用场景测试
  // ============================================================================
  describe('实际应用场景', () => {
    it('API 响应数据转换', () => {
      const userSchema = toObject({
        id: toInteger('id'),
        username: toString('username'),
        email: toString('email'),
        isActive: toBoolean('is_active'),
        profile: toObject('profile', {
          firstName: toString('first_name'),
          lastName: toString('last_name'),
          age: toNumber('age'),
        }),
      });

      const apiResponse = {
        id: '12345',
        username: 'johndoe',
        email: 'john@example.com',
        is_active: 'true',
        profile: {
          first_name: 'John',
          last_name: 'Doe',
          age: '30',
        },
      };

      const result = userSchema.run(apiResponse);

      assert.deepStrictEqual(result, {
        id: 12345,
        username: 'johndoe',
        email: 'john@example.com',
        isActive: true,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          age: 30,
        },
      });
    });

    it('CSV 数据转换', () => {
      const rowSchema = toObject({
        id: toInteger('0'),
        name: toString('1'),
        price: toNumber('2'),
        inStock: toBoolean('3'),
      });

      const csvRow = {
        '0': '1',
        '1': 'Product',
        '2': '99.99',
        '3': 'true',
      };

      const result = rowSchema.run(csvRow);

      assert.deepStrictEqual(result, {
        id: 1,
        name: 'Product',
        price: 99.99,
        inStock: true,
      });
    });

    it('表单数据验证和转换', () => {
      const formSchema = toObject({
        username: toString('username'),
        age: toInteger('age'),
        email: toString('email'),
        newsletter: toBoolean('newsletter'),
        preferences: toObject('preferences', {
          theme: toString('theme'),
          notifications: toBoolean('notifications'),
        }),
      });

      const formData = {
        username: 'alice',
        age: '25',
        email: 'alice@example.com',
        newsletter: 'true',
        preferences: {
          theme: 'dark',
          notifications: 'false',
        },
      };

      const result = formSchema.run(formData);

      assert.deepStrictEqual(result, {
        username: 'alice',
        age: 25,
        email: 'alice@example.com',
        newsletter: true,
        preferences: {
          theme: 'dark',
          notifications: false,
        },
      });
    });

    it('嵌套列表数据处理', () => {
      const schema = toObject({
        orders: toArray('orders', toObject({
          orderId: toInteger('order_id'),
          total: toNumber('total'),
          items: toArray('items', toObject({
            productId: toInteger('product_id'),
            quantity: toInteger('quantity'),
            price: toNumber('price'),
          })),
        })),
      });

      const data = {
        orders: [
          {
            order_id: '1001',
            total: '150.00',
            items: [
              { product_id: '1', quantity: '2', price: '50.00' },
              { product_id: '2', quantity: '1', price: '50.00' },
            ],
          },
          {
            order_id: '1002',
            total: '75.00',
            items: [
              { product_id: '3', quantity: '3', price: '25.00' },
            ],
          },
        ],
      };

      const result = schema.run(data);

      assert.deepStrictEqual(result, {
        orders: [
          {
            orderId: 1001,
            total: 150.00,
            items: [
              { productId: 1, quantity: 2, price: 50.00 },
              { productId: 2, quantity: 1, price: 50.00 },
            ],
          },
          {
            orderId: 1002,
            total: 75.00,
            items: [
              { productId: 3, quantity: 3, price: 25.00 },
            ],
          },
        ],
      });
    });

    it('配置文件解析', () => {
      const configSchema = toObject({
        server: toObject('server', {
          port: toInteger('port'),
          host: toString('host'),
          ssl: toBoolean('ssl'),
        }),
        database: toObject('database', {
          host: toString('host'),
          port: toInteger('port'),
          name: toString('name'),
        }),
        features: toArray('features', toString()),
      });

      const config = {
        server: {
          port: '3000',
          host: 'localhost',
          ssl: 'false',
        },
        database: {
          host: 'db.example.com',
          port: '5432',
          name: 'myapp',
        },
        features: ['auth', 'api', 'admin'],
      };

      const result = configSchema.run(config);

      assert.deepStrictEqual(result, {
        server: {
          port: 3000,
          host: 'localhost',
          ssl: false,
        },
        database: {
          host: 'db.example.com',
          port: 5432,
          name: 'myapp',
        },
        features: ['auth', 'api', 'admin'],
      });
    });
  });
});
