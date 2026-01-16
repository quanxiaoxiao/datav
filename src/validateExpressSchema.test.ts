import * as assert from 'node:assert';
import { describe, test } from 'node:test';

import { validateExpressSchema, tryValidateExpressSchema } from './validateExpressSchema.js';
import { isDataVError, ERROR_CODES } from './errors.js';

type AnySchema = any;
type ExpressSchema = any;

const assertValidSchema = (schema: AnySchema) => {
  assert.doesNotThrow(() => validateExpressSchema(schema));
};

const assertInvalidSchema = (schema: AnySchema, pattern?: RegExp) => {
  assert.throws(
    () => validateExpressSchema(schema),
    pattern || /Invalid schema/
  );
};

const createObjectSchema = (properties: Record<string, AnySchema>): AnySchema => ({
  type: 'object',
  properties,
});

const createArraySchema = (properties: AnySchema): AnySchema => ({
  type: 'array',
  properties,
});

describe('validateExpressSchema', () => {
  describe('基础类型验证', () => {
    const basicTypes = ['string', 'number', 'boolean', 'integer'] as const;

    test('应该通过所有基础类型验证', () => {
      basicTypes.forEach(type => {
        assertValidSchema({ type });
      });
    });

    test('基础类型可以包含可选的 properties', () => {
      assertValidSchema({
        type: 'string',
        properties: ['dataKey'] as any,
      });
    });

    test('基础类型可以包含 resolve 函数', () => {
      basicTypes.forEach(type => {
        assertValidSchema({
          type,
          resolve: (value: unknown) => value,
        });
      });
    });
  });

  describe('对象类型验证', () => {
    test('应该通过有效的 object 类型验证', () => {
      assertValidSchema(createObjectSchema({
        name: { type: 'string' },
        age: { type: 'number' },
      }));
    });

    test('应该通过空 properties 的 object 类型验证', () => {
      assertValidSchema(createObjectSchema({}));
    });

    test('object 类型缺少 properties 应该抛出错误', () => {
      assertInvalidSchema(
        { type: 'object' },
        /must have required property "properties"/
      );
    });

    test('object 类型的 properties 必须是对象，不能是其他类型', () => {
      const invalidProperties = [
        { value: 'invalid', desc: '字符串' },
        { value: [], desc: '数组' },
        { value: 123, desc: '数字' },
        { value: true, desc: '布尔值' },
        { value: null, desc: 'null' },
      ];

      invalidProperties.forEach(({ value, desc }) => {
        assertInvalidSchema(
          { type: 'object', properties: value },
          /properties must be object/
        );
      });
    });

    test('对象类型可以包含 resolve 函数', () => {
      assertValidSchema({
        ...createObjectSchema({ name: { type: 'string' } }),
        resolve: (value: unknown) => value,
      });
    });
  });

  describe('数组类型验证', () => {
    describe('对象形式的 properties', () => {
      test('应该通过有效的对象 properties', () => {
        assertValidSchema(createArraySchema({
          items: { type: 'string' },
        }));
      });

      test('应该通过空对象 properties', () => {
        assertValidSchema(createArraySchema({}));
      });
    });

    describe('元组形式的 properties', () => {
      test('应该通过有效的元组 properties', () => {
        assertValidSchema(createArraySchema(['items', { type: 'string' }]));
      });

      test('元组长度必须为 2', () => {
        const invalidTuples = [
          [],
          ['items'],
          ['items', { type: 'string' }, 'extra'],
        ];

        invalidTuples.forEach(tuple => {
          assertInvalidSchema(
            createArraySchema(tuple),
            /properties array must have exactly 2 elements/
          );
        });
      });

      test('元组第一项必须是 string', () => {
        assertInvalidSchema(
          createArraySchema([123, { type: 'string' }]),
          /properties\[0\] must be string/
        );
      });

      test('元组第二项必须是 object', () => {
        const invalidSecondItems = ['invalid', [], 123, null];

        invalidSecondItems.forEach(item => {
          assertInvalidSchema(
            createArraySchema(['items', item]),
            /properties\[1\] must be object/
          );
        });
      });
    });

    test('array 类型缺少 properties 应该抛出错误', () => {
      assertInvalidSchema(
        { type: 'array' },
        /must have required property "properties"/
      );
    });

    test('数组类型可以包含 resolve 函数', () => {
      assertValidSchema({
        ...createArraySchema(['items', { type: 'number' }]),
        resolve: (value: unknown) => value,
      });
    });
  });

  describe('根节点验证', () => {
    test('应该拒绝非对象类型', () => {
      const invalidInputs = [null, undefined, 'string', 123, true, [], () => {}];

      invalidInputs.forEach(input => {
        assertInvalidSchema(input, /root: must be object/);
      });
    });

    test('应该拒绝空对象', () => {
      assertInvalidSchema({}, /missing required property "type"/);
    });

    test('应该拒绝缺少 type 属性', () => {
      assertInvalidSchema(
        { properties: {} },
        /missing required property "type"/
      );
    });
  });

  describe('type 属性验证', () => {
    test('应该拒绝无效的 type 值', () => {
      const invalidTypes = [
        { value: 'xxx', desc: '未知类型' },
        { value: 'json', desc: '不支持的类型' },
        { value: null, desc: 'null' },
        { value: undefined, desc: 'undefined' },
      ];

      invalidTypes.forEach(({ value, desc }) => {
        assertInvalidSchema(
          { type: value },
          /type must be one of|missing required property "type"/
        );
      });
    });

    test('应该拒绝 type 为字符串的直接传入', () => {
      assertInvalidSchema('number', /root: must be object/);
      assertInvalidSchema('integer', /root: must be object/);
    });
  });

  describe('复杂嵌套场景', () => {
    test('应该通过嵌套对象验证', () => {
      assertValidSchema(createObjectSchema({
        user: createObjectSchema({
          name: { type: 'string' },
          age: { type: 'number' },
          address: createObjectSchema({
            city: { type: 'string' },
            zipCode: { type: 'integer' },
          }),
        }),
      }));
    });

    test('应该通过嵌套数组验证', () => {
      assertValidSchema(createArraySchema({
        items: createArraySchema(['item', { type: 'string' }]),
      }));
    });

    test('应该通过混合嵌套验证', () => {
      assertValidSchema(createObjectSchema({
        users: createArraySchema({
          user: createObjectSchema({
            name: { type: 'string' },
            tags: createArraySchema(['tag', { type: 'string' }]),
          }),
        }),
      }));
    });
  });

  describe('边界情况', () => {
    test('应该接受包含额外属性的 schema', () => {
      assertValidSchema({
        type: 'string',
        extraProp: 'should be ignored',
        anotherProp: 123,
      });
    });

    test('应该处理所有类型的组合', () => {
      const allTypes: ExpressSchema[] = [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'integer' },
        createObjectSchema({}),
        createArraySchema({}),
      ];

      allTypes.forEach(schema => {
        assertValidSchema(schema);
      });
    });
  });

  describe('错误消息验证', () => {
    test('错误应该是 DataVError 类型并包含正确的错误码', () => {
      try {
        validateExpressSchema({ type: 'invalid' });
        assert.fail('应该抛出错误');
      } catch (error: unknown) {
        assert.ok(isDataVError(error));
        assert.strictEqual((error as { code: string }).code, ERROR_CODES.INVALID_SCHEMA);
        assert.match((error as Error).message, /\[INVALID_SCHEMA\]/);
      }
    });

    test('错误消息应该包含验证错误详情', () => {
      try {
        validateExpressSchema({ type: 'object' });
        assert.fail('应该抛出错误');
      } catch (error: unknown) {
        assert.ok(isDataVError(error));
        assert.match((error as Error).message, /\[INVALID_SCHEMA\]/);
        assert.match((error as Error).message, /properties/);
      }
    });
  });
});

describe('tryValidateExpressSchema', () => {
  test('应该返回成功结果对于有效 schema', () => {
    const validSchemas: ExpressSchema[] = [
      { type: 'string' },
      createObjectSchema({ name: { type: 'string' } }),
      createArraySchema(['item', { type: 'number' }]),
    ];

    validSchemas.forEach(schema => {
      const result = tryValidateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  test('应该返回错误结果对于无效 schema', () => {
    const invalidSchemas = [
      { schema: { type: 'object' }, pattern: /must have required property "properties"/ },
      { schema: { type: 'array' }, pattern: /must have required property "properties"/ },
      { schema: null, pattern: /root: must be object/ },
    ];

    invalidSchemas.forEach(({ schema, pattern }) => {
      const result = tryValidateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
      assert.match(result.errors[0], pattern);
    });
  });

  test('应该返回多个错误对于元组验证', () => {
    const result = tryValidateExpressSchema({
      type: 'array',
      properties: [123, 'not-object'],
    });

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length >= 2);
  });

  test('应该区分有效和无效的 schema', () => {
    const validResult = tryValidateExpressSchema({ type: 'string' });
    const invalidResult = tryValidateExpressSchema({});

    assert.strictEqual(validResult.valid, true);
    assert.strictEqual(invalidResult.valid, false);
  });
});
