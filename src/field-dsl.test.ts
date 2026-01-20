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
  describe('类型系统', () => {
    it('Infer 应该正确推导 Field 类型', () => {
      type StringField = Field<string>;
      type NumberField = Field<number>;

      type InferredString = Infer<StringField>;
      type InferredNumber = Infer<NumberField>;

      assert.strictEqual<InferredString>('test' satisfies InferredString, 'test');
      assert.strictEqual<InferredNumber>((42 as number) satisfies InferredNumber, 42);
    });

    it('Infer 应该推导复合类型', () => {
      const stringField = toString('name');
      type StringFieldType = Infer<typeof stringField>;

      assert.strictEqual<StringFieldType>('John' satisfies StringFieldType, 'John');
    });
  });

  describe('toString', () => {
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

    it('应该进行类型转换', () => {
      const field = toString('value');
      assert.strictEqual(field.run({ value: 123 }), '123');
      assert.strictEqual(field.run({ value: true }), 'true');
    });

    it('路径不存在时返回 null', () => {
      const field = toString('missing');
      assert.strictEqual(field.run({ name: 'test' }), null);
    });

    it('应该处理数组索引路径', () => {
      const field = toString('users.0.name');
      assert.strictEqual(
        field.run({ users: [{ name: 'Charlie' }, { name: 'David' }] }),
        'Charlie'
      );
    });
  });

  describe('toNumber', () => {
    it('应该提取数字字段', () => {
      const field = toNumber('count');
      assert.strictEqual(field.run({ count: 42 }), 42);
    });

    it('应该进行类型转换', () => {
      const field = toNumber('value');
      assert.strictEqual(field.run({ value: '123' }), 123);
      assert.strictEqual(field.run({ value: '3.14' }), 3.14);
    });

    it('无效值应该返回 null', () => {
      const field = toNumber('value');
      assert.strictEqual(field.run({ value: 'abc' }), null);
      assert.strictEqual(field.run({ value: '12.34.56' }), null);
    });

    it('应该处理嵌套路径', () => {
      const field = toNumber('data.price');
      assert.strictEqual(field.run({ data: { price: 99.99 } }), 99.99);
    });
  });

  describe('toInteger', () => {
    it('应该提取整数字段', () => {
      const field = toInteger('count');
      assert.strictEqual(field.run({ count: 42 }), 42);
    });

    it('应该进行类型转换', () => {
      const field = toInteger('value');
      assert.strictEqual(field.run({ value: '123' }), 123);
    });

    it('浮点数应该返回 null', () => {
      const field = toInteger('value');
      assert.strictEqual(field.run({ value: 3.14 }), null);
      assert.strictEqual(field.run({ value: '3.14' }), null);
    });

    it('应该处理负数', () => {
      const field = toInteger('value');
      assert.strictEqual(field.run({ value: -456 }), -456);
      assert.strictEqual(field.run({ value: '-789' }), -789);
    });
  });

  describe('toBoolean', () => {
    it('应该提取布尔字段', () => {
      const field = toBoolean('enabled');
      assert.strictEqual(field.run({ enabled: true }), true);
      assert.strictEqual(field.run({ enabled: false }), false);
    });

    it('应该进行字符串转换', () => {
      const field = toBoolean('flag');
      assert.strictEqual(field.run({ flag: 'true' }), true);
      assert.strictEqual(field.run({ flag: 'false' }), false);
    });

    it('无效值应该返回 null', () => {
      const field = toBoolean('value');
      assert.strictEqual(field.run({ value: 'yes' }), null);
      assert.strictEqual(field.run({ value: 1 }), null);
    });
  });

  describe('toObject', () => {
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

    it('空路径应该使用根数据', () => {
      const field = toObject({
        name: toString('name'),
        age: toNumber('age'),
      });

      const result = field.run({ name: 'Charlie', age: 25 });

      assert.deepStrictEqual(result, { name: 'Charlie', age: 25 });
    });

    it('应该处理 null 输入', () => {
      const field = toObject('data', {
        name: toString('name'),
      });

      const result = field.run({ data: null });
      assert.deepStrictEqual(result, { name: null });
    });

    it('应该正确处理类型转换', () => {
      const field = toObject('config', {
        count: toNumber('count'),
        enabled: toBoolean('enabled'),
      });

      const result = field.run({
        config: { count: '42', enabled: 'true' },
      });

      assert.deepStrictEqual(result, { count: 42, enabled: true });
    });

    it('应该保持对象类型正确', () => {
      const field = toObject('obj', {
        value: toNumber('value'),
      });

      const result = field.run({ obj: { value: 100 } });

      assert.strictEqual(typeof result.value, 'number');
    });
  });

  describe('toArray', () => {
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

    it('应该处理空数组输入', () => {
      const field = toArray('items', toString('name'));
      assert.deepStrictEqual(field.run({ items: [] }), []);
    });

    it('应该处理 null 输入', () => {
      const field = toArray('items', toString('name'));
      assert.deepStrictEqual(field.run({ items: null }), []);
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
  });

  describe('compile', () => {
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

    it('应该正确包装复合字段', () => {
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

    it('应该包装 null/undefined 处理', () => {
      const field = toString('name');
      const fn = compile(field);

      assert.strictEqual(fn({ name: null }), null);
      assert.strictEqual(fn({ name: undefined }), null);
    });

    it('应该在路径不存在时返回 null 而不抛出错误', () => {
      const field = toString('value');
      const fn = compile(field);

      assert.strictEqual(fn({ missing: 'test' }), null);
    });

    it('编译的函数应该可重复使用', () => {
      const field = toString('name');
      const fn = compile(field);

      assert.strictEqual(fn({ name: 'First' }), 'First');
      assert.strictEqual(fn({ name: 'Second' }), 'Second');
      assert.strictEqual(fn({ name: 'Third' }), 'Third');
    });
  });

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
      const field = toArray('data', toObject('.', {
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
  });

  describe('边界情况', () => {
    it('应该处理路径为空的字段', () => {
      const field = toObject({
        value: toNumber('value'),
      });

      assert.strictEqual(field.run({ value: 42 }).value, 42);
    });

    it('应该处理数组路径为空的情况', () => {
      const field = toArray(toNumber('value'));

      assert.deepStrictEqual(field.run([{ value: 1 }]), [1]);
    });

    it('应该处理包含特殊字符的路径', () => {
      const field = toString('user-name');
      assert.strictEqual(field.run({ 'user-name': 'test' }), 'test');
    });

    it('应该处理数字开头的路径', () => {
      const field = toString('0name');
      assert.strictEqual(field.run({ '0name': 'test' }), 'test');
    });

    it('应该处理值为 0 的字段', () => {
      const numberField = toNumber('value');
      assert.strictEqual(numberField.run({ value: 0 }), 0);
    });

    it('应该处理值为 false 的布尔字段', () => {
      const boolField = toBoolean('value');
      assert.strictEqual(boolField.run({ value: false }), false);
    });

    it('应该处理空字符串', () => {
      const stringField = toString('value');
      assert.strictEqual(stringField.run({ value: '' }), '');
    });

    it('应该处理空的原始类型值', () => {
      const field = toObject('data', {
        name: toString('name'),
      });

      const result = field.run({ data: {} });
      assert.deepStrictEqual(result, { name: null });
      const nullResult = field.run({ data: null });
      assert.deepStrictEqual(nullResult, { name: null });
    });
  });

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
  });
});

describe('toString', () => {
  it('should convert value to string without path', () => {
    const field = toString();
    assert.strictEqual(field.run(123), '123');
    assert.strictEqual(field.run('hello'), 'hello');
    assert.strictEqual(field.run(true), 'true');
    assert.strictEqual(field.run(null), null);
  });

  it('should convert nested value to string with path', () => {
    const field = toString('user.name');
    const data = { user: { name: 'Alice' } };
    assert.strictEqual(field.run(data), 'Alice');
  });

  it('should handle undefined path gracefully', () => {
    const field = toString('missing.path');
    const data = { user: { name: 'Alice' } };
    assert.strictEqual(field.run(data), null);
  });
});

describe('toNumber', () => {
  it('should convert value to number without path', () => {
    const field = toNumber();
    assert.strictEqual(field.run('123'), 123);
    assert.strictEqual(field.run(456), 456);
    assert.strictEqual(field.run('3.14'), 3.14);
  });

  it('should convert nested value to number with path', () => {
    const field = toNumber('user.age');
    const data = { user: { age: '25' } };
    assert.strictEqual(field.run(data), 25);
  });
});

describe('toInteger', () => {
  it('should convert value to integer without path', () => {
    const field = toInteger();
    assert.strictEqual(field.run('123'), 123);
    assert.strictEqual(field.run(3.14), null);
    assert.strictEqual(field.run(3.99), null);
  });

  it('should convert negative decimals correctly', () => {
    const field = toInteger();
    assert.strictEqual(field.run(-3.14), null);
    assert.strictEqual(field.run(-3.99), null);
  });
});

describe('toBoolean', () => {
  it('should convert value to boolean without path', () => {
    const field = toBoolean();
    assert.strictEqual(field.run(true), true);
    assert.strictEqual(field.run(false), false);
    assert.strictEqual(field.run(1), null);
    assert.strictEqual(field.run(0), null);
    assert.strictEqual(field.run(''), null);
    assert.strictEqual(field.run('hello'), null);
  });

  it('should convert nested value to boolean with path', () => {
    const field = toBoolean('user.active');
    const data = { user: { active: true } };
    assert.strictEqual(field.run(data), true);
  });
});

// ============================================================================
// 对象转换测试
// ============================================================================

describe('toObject', () => {
  it('should transform object without path', () => {
    const field = toObject({
      name: toString('name'),
      age: toNumber('age'),
      active: toBoolean('active'),
    });

    const data = {
      name: 'Alice',
      age: '25',
      active: 'true',
    };

    const result = field.run(data);
    assert.deepStrictEqual(result, {
      name: 'Alice',
      age: 25,
      active: true,
    });
  });

  it('should transform nested object with path', () => {
    const field = toObject('user', {
      name: toString('name'),
      age: toNumber('age'),
    });

    const data = {
      user: {
        name: 'Bob',
        age: '30',
      },
    };

    const result = field.run(data);
    assert.deepStrictEqual(result, {
      name: 'Bob',
      age: 30,
    });
  });

  it('should handle nested objects', () => {
    const field = toObject({
      user: toObject('user', {
        name: toString('name'),
        age: toNumber('age'),
      }),
      settings: toObject('settings', {
        theme: toString('theme'),
      }),
    });

    const data = {
      user: {
        name: 'Charlie',
        age: '35',
      },
      settings: {
        theme: 'dark',
      },
    };

    const result = field.run(data);
    assert.deepStrictEqual(result, {
      user: {
        name: 'Charlie',
        age: 35,
      },
      settings: {
        theme: 'dark',
      },
    });
  });
});

// ============================================================================
// 数组转换测试
// ============================================================================

describe('toArray', () => {
  it('should transform array of primitives without path', () => {
    const field = toArray(toNumber());
    const data = ['1', '2', '3'];
    const result = field.run(data);
    assert.deepStrictEqual(result, [1, 2, 3]);
  });

  it('should transform nested array with path', () => {
    const field = toArray('items', toNumber());
    const data = { items: ['10', '20', '30'] };
    const result = field.run(data);
    assert.deepStrictEqual(result, [10, 20, 30]);
  });

  it('should transform array of objects', () => {
    const field = toArray(
      toObject({
        id: toNumber('id'),
        name: toString('name'),
      })
    );

    const data = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];

    const result = field.run(data);
    assert.deepStrictEqual(result, [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
  });

  it('should handle empty arrays', () => {
    const field = toArray(toNumber());
    const result = field.run([]);
    assert.deepStrictEqual(result, []);
  });
});

// ============================================================================
// 复杂场景测试
// ============================================================================

describe('Complex transformations', () => {
  it('should handle nested arrays and objects', () => {
    const field = toObject({
      users: toArray('users', toObject({
        name: toString('name'),
        age: toNumber('age'),
        tags: toArray('tags', toString()),
      })),
    });

    const data = {
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
    };

    const result = field.run(data);
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

  it('should handle deeply nested paths', () => {
    const field = toObject({
      value: toNumber('data.nested.deep.value'),
    });

    const data = {
      data: {
        nested: {
          deep: {
            value: '42',
          },
        },
      },
    };

    const result = field.run(data);
    assert.deepStrictEqual(result, { value: 42 });
  });
});

// ============================================================================
// compile 函数测试
// ============================================================================

describe('compile', () => {
  it('should compile field into reusable function', () => {
    const field = toObject({
      name: toString('name'),
      age: toNumber('age'),
    });

    const transform = compile(field);

    const data1 = { name: 'Alice', age: '25' };
    const data2 = { name: 'Bob', age: '30' };

    assert.deepStrictEqual(transform(data1), { name: 'Alice', age: 25 });
    assert.deepStrictEqual(transform(data2), { name: 'Bob', age: 30 });
  });

  it('should handle successful transformations', () => {
    const field = toString();
    const transform = compile(field);
    assert.strictEqual(transform(123), '123');
  });
});

// ============================================================================
// 边界情况测试
// ============================================================================

describe('Edge cases', () => {
  it('should handle null values', () => {
    const field = toString();
    assert.strictEqual(field.run(null), null);
  });

  it('should handle undefined values', () => {
    const field = toString();
    assert.strictEqual(field.run(undefined), null);
  });

  it('should handle empty strings', () => {
    const field = toString();
    assert.strictEqual(field.run(''), '');
  });

  it('should handle zero', () => {
    const field = toNumber();
    assert.strictEqual(field.run(0), 0);
  });

  it('should handle boolean false', () => {
    const field = toBoolean();
    assert.strictEqual(field.run(false), false);
  });
});

