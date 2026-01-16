import * as assert from 'node:assert';
import { test } from 'node:test';

import {
  toString,
  toNumber,
  toInteger,
  toBoolean,
  toObject,
  toArray,
  optional,
  required,
  rename,
  transform,
  defaultTo,
  fromRoot,
  pluck,
  mapArray,
  omit,
  pick,
  pipeline,
  cond,
  when,
  constant,
  lazy,
  f,
} from './schema.js';
import { createDataTransformer } from './createDataTransformer.js';

test('基础类型工厂函数', async (t) => {
  await t.test('toString() 应该创建正确的 schema', () => {
    const field = toString();
    assert.deepStrictEqual(field, { type: 'string' });
  });

  await t.test('toString(path) 应该创建路径形式的 schema', () => {
    const field = toString('.name');
    assert.deepStrictEqual(field, ['.name', { type: 'string' }]);
  });

  await t.test('toString(path, resolve) 应该包含 resolve', () => {
    const resolver = (v: unknown) => String(v);
    const field = toString('.name', resolver);
    assert.strictEqual(field[0], '.name');
    assert.strictEqual((field[1] as { type: string }).type, 'string');
    assert.strictEqual((field[1] as { resolve: unknown }).resolve, resolver);
  });

  await t.test('toNumber() 应该创建正确的 schema', () => {
    const field = toNumber();
    assert.deepStrictEqual(field, { type: 'number' });
  });

  await t.test('toNumber(path) 应该创建路径形式的 schema', () => {
    const field = toNumber('.price');
    assert.deepStrictEqual(field, ['.price', { type: 'number' }]);
  });

  await t.test('toInteger() 应该创建正确的 schema', () => {
    const field = toInteger();
    assert.deepStrictEqual(field, { type: 'integer' });
  });

  await t.test('toInteger(path) 应该创建路径形式的 schema', () => {
    const field = toInteger('.count');
    assert.deepStrictEqual(field, ['.count', { type: 'integer' }]);
  });

  await t.test('toBoolean() 应该创建正确的 schema', () => {
    const field = toBoolean();
    assert.deepStrictEqual(field, { type: 'boolean' });
  });

  await t.test('toBoolean(path) 应该创建路径形式的 schema', () => {
    const field = toBoolean('.active');
    assert.deepStrictEqual(field, ['.active', { type: 'boolean' }]);
  });
});

test('对象和数组工厂函数', async (t) => {
  await t.test('toObject() 应该创建正确的对象 schema', () => {
    const schema = toObject({
      name: toString(),
      age: toInteger(),
    });
    assert.deepStrictEqual(schema, {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
    });
  });

  await t.test('toArray() 应该创建正确的数组 schema', () => {
    const schema = toArray({
      items: toString(),
    });
    assert.deepStrictEqual(schema, {
      type: 'array',
      properties: {
        items: { type: 'string' },
      },
    });
  });

  await t.test('toArray() 支持元组形式', () => {
    const schema = toArray(['.', toString()]);
    assert.deepStrictEqual(schema, {
      type: 'array',
      properties: ['.', { type: 'string' }],
    });
  });
});

test('辅助函数', async (t) => {
  await t.test('optional() 应该处理字符串路径', () => {
    const field = optional('.other');
    assert.deepStrictEqual(field, ['.other', { type: 'string' }]);
  });

  await t.test('optional() 应该透传已有 schema', () => {
    const existingSchema = { type: 'string' };
    const result = optional(existingSchema);
    assert.strictEqual(result, existingSchema);
  });

  await t.test('required() 应该透传字段', () => {
    const field = { type: 'string' };
    const result = required(field);
    assert.strictEqual(result, field);
  });

  await t.test('rename() 应该重命名字段', () => {
    const field = { type: 'string' };
    const result = rename('newName', field);
    assert.strictEqual(result, field);

    const pathField = ['oldName', { type: 'string' }];
    const renamedPath = rename('newName', pathField);
    assert.deepStrictEqual(renamedPath, ['newName', { type: 'string' }]);
  });

  await t.test('transform() 应该添加 resolve', () => {
    const field = { type: 'string' };
    const resolver = (v: unknown) => String(v).toUpperCase();
    const result = transform(field, resolver);
    assert.ok('resolve' in result);
    assert.strictEqual(result.resolve, resolver);
  });

  await t.test('defaultTo() 应该设置默认值', () => {
    const field = toString();
    const result = defaultTo(field, 'N/A');
    assert.ok('resolve' in result);
  });

  await t.test('fromRoot() 应该创建根路径引用', () => {
    const field = toString();
    const result = fromRoot(field);
    assert.deepStrictEqual(result, ['$', field]);
  });

  await t.test('pluck() 应该创建路径提取', () => {
    const field = toString();
    const result = pluck('.user.name', field);
    assert.deepStrictEqual(result, ['.user.name', field]);
  });

  await t.test('mapArray() 应该创建数组映射', () => {
    const field = toString();
    const result = mapArray(field);
    assert.deepStrictEqual(result, ['.', field]);
  });

  await t.test('omit() 应该排除指定键', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = omit(obj, ['b']);
    assert.deepStrictEqual(result, { a: 1, c: 3 });
  });

  await t.test('pick() 应该只保留指定键', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = pick(obj, ['a', 'c']);
    assert.deepStrictEqual(result, { a: 1, c: 3 });
  });

  await t.test('pipeline() 应该组合函数', () => {
    const addOne = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    const pipelineFn = pipeline(addOne, double);
    assert.strictEqual(pipelineFn(5), 12);
  });

  await t.test('cond() 应该根据条件选择值', () => {
    const isActive = (v: unknown) => v === true;
    const activeSchema = { type: 'string', resolve: (v: unknown) => `Active: ${v}` };
    const inactiveSchema = { type: 'string', resolve: (v: unknown) => `Inactive: ${v}` };
    const result = cond(activeSchema, isActive, inactiveSchema);
    assert.ok('resolve' in result);
  });

  await t.test('when() 应该与 cond() 相同', () => {
    const isActive = (v: unknown) => v === true;
    const activeSchema = { type: 'string' };
    const inactiveSchema = { type: 'string' };
    const result = when(activeSchema, isActive, inactiveSchema);
    assert.ok('resolve' in result);
  });

  await t.test('constant() 应该返回常量值', () => {
    const result = constant(42);
    assert.strictEqual(result.resolve(), 42);
  });

  await t.test('lazy() 应该延迟求值', () => {
    let callCount = 0;
    const result = lazy(() => {
      callCount++;
      return callCount;
    });
    assert.strictEqual(result.resolve(), 1);
  });
});

test('工厂函数与 createDataTransformer 集成', async (t) => {
  await t.test('使用工厂函数创建简单转换器', () => {
    const transformer = createDataTransformer(
      toObject({
        name: toString('.user.name'),
        age: toInteger('.user.age'),
        email: toString(),
      }) as any,
    );

    const input = {
      user: { name: '张三', age: '25' },
      email: 'zhangsan@example.com',
    };

    const result = transformer(input);
    assert.deepStrictEqual(result, {
      name: '张三',
      age: 25,
      email: 'zhangsan@example.com',
    });
  });

  await t.test('使用工厂函数创建嵌套对象', () => {
    const transformer = createDataTransformer(
      toObject({
        user: toObject({
          name: toString(),
          profile: toObject({
            age: toInteger(),
            city: toString(),
          }),
        }),
      }) as any,
    );

    const input = {
      user: {
        name: '李四',
        profile: { age: '30', city: '北京' },
      },
    };

    const result = transformer(input);
    assert.deepStrictEqual(result, {
      user: {
        name: '李四',
        profile: { age: 30, city: '北京' },
      },
    });
  });

  await t.test('使用工厂函数创建数组转换', () => {
    const transformer = createDataTransformer(
      toObject({
        items: toArray({
          name: toString(),
          price: toNumber(),
        }),
      }) as any,
    );

    const input = {
      items: [
        { name: '商品A', price: '100' },
        { name: '商品B', price: '200' },
      ],
    };

    const result = transformer(input);
    assert.deepStrictEqual(result, {
      items: [
        { name: '商品A', price: 100 },
        { name: '商品B', price: 200 },
      ],
    });
  });

  await t.test('使用工厂函数带 resolve', () => {
    const transformer = createDataTransformer(
      toObject({
        fullName: toString('.name', (v: unknown, r: unknown) => `${(r as { prefix: string }).prefix}${v}`),
        total: toNumber('.price', (v: unknown) => Math.round((v as number) * 1.1)),
      }) as any,
    );

    const input = {
      name: '王五',
      prefix: '用户-',
      price: 100,
    };

    const result = transformer(input);
    assert.deepStrictEqual(result, {
      fullName: '用户-王五',
      total: 110,
    });
  });

  await t.test('使用 f 对象访问工厂函数', () => {
    const transformer = createDataTransformer(
      f.toObject({
        name: f.toString(),
        count: f.toInteger(),
      }) as any,
    );

    const result = transformer({ name: 'test', count: '10' });
    assert.deepStrictEqual(result, { name: 'test', count: 10 });
  });

  await t.test('工厂函数组合：rename 和 pluck', () => {
    const transformer = createDataTransformer(
      toObject({
        userName: pluck('.user.name', toString()),
        userAge: pluck('.user.age', toInteger()),
      }) as any,
    );

    const input = { user: { name: '赵六', age: '28' } };
    const result = transformer(input);
    assert.deepStrictEqual(result, { userName: '赵六', userAge: 28 });
  });

  await t.test('工厂函数：defaultTo 提供默认值', () => {
    const transformer = createDataTransformer(
      toObject({
        name: toString(),
        nickname: defaultTo(toString(), 'Anonymous'),
      }) as any,
    );

    const input1 = { name: '张三' };
    const result1 = transformer(input1);
    assert.deepStrictEqual(result1, { name: '张三', nickname: 'Anonymous' });

    const input2 = { name: '李四', nickname: '李大夫' };
    const result2 = transformer(input2);
    assert.deepStrictEqual(result2, { name: '李四', nickname: '李大夫' });
  });

  await t.test('工厂函数：fromRoot 访问根路径', () => {
    const transformer = createDataTransformer(
      toObject({
        userId: fromRoot('id', toInteger()),
        userName: fromRoot('userName', toString()),
      }) as any,
    );

    const input = {
      id: '1001',
      userName: '张三',
    };

    const result = transformer(input);
    assert.deepStrictEqual(result, {
      userId: 1001,
      userName: '张三',
    });
  });

  await t.test('工厂函数：mapArray 转换数组元素', () => {
    const transformer = createDataTransformer(
      toObject({
        ids: toArray(['.', toInteger()]),
      }) as any,
    );

    const input = { ids: ['1', '2', '3'] };
    const result = transformer(input);
    assert.deepStrictEqual(result, { ids: [1, 2, 3] });
  });
});
