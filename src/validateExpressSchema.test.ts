import * as assert from 'node:assert';
import { describe, test } from 'node:test';

import { validateExpressSchema } from './validateExpressSchema.js';
import { isDataVError, ERROR_CODES } from './errors.js';

// 用于测试无效类型输入
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = any;

describe('validateExpressSchema', () => {
  describe('基础类型验证', () => {
    const basicTypes = ['string', 'number', 'boolean', 'integer'] as const;

    basicTypes.forEach(type => {
      test(`应该通过 ${type} 类型验证`, () => {
        assert.doesNotThrow(() => {
          validateExpressSchema({ type });
        });
      });
    });

    test('基础类型可以包含可选的 properties', () => {
      assert.doesNotThrow(() => {
        validateExpressSchema({
          type: 'string',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          properties: ['dataKey'] as any,
        });
      });
    });
  });

  describe('对象类型验证', () => {
    test('应该通过有效的 object 类型验证', () => {
      assert.doesNotThrow(() => {
        validateExpressSchema({
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
        });
      });
    });

    test('应该通过空 properties 的 object 类型验证', () => {
      assert.doesNotThrow(() => {
        validateExpressSchema({
          type: 'object',
          properties: {},
        });
      });
    });

    test('object 类型缺少 properties 应该抛出错误', () => {
      assert.throws(
        () => validateExpressSchema({ type: 'object' } as AnySchema),
        /Invalid schema/,
      );
    });

    test('object 类型的 properties 必须是对象', () => {
      assert.throws(
        () => validateExpressSchema({
          type: 'object',
          properties: 'invalid',
        } as AnySchema),
        /Invalid schema/,
      );
    });

    test('object 类型的 properties 不能是数组', () => {
      assert.throws(
        () => validateExpressSchema({
          type: 'object',
          properties: [],
        } as AnySchema),
        /Invalid schema/,
      );
    });
  });

  describe('数组类型验证', () => {
    test('应该通过 properties 为对象的 array 类型验证', () => {
      assert.doesNotThrow(() => {
        validateExpressSchema({
          type: 'array',
          properties: {
            items: { type: 'string' },
          },
        });
      });
    });

    test('应该通过 properties 为元组的 array 类型验证', () => {
      assert.doesNotThrow(() => {
        validateExpressSchema({
          type: 'array',
          properties: ['items', { type: 'string' }],
        });
      });
    });

    test('应该通过空 properties 对象的 array 类型验证', () => {
      assert.doesNotThrow(() => {
        validateExpressSchema({
          type: 'array',
          properties: {},
        });
      });
    });

    test('array 类型缺少 properties 应该抛出错误', () => {
      assert.throws(
        () => validateExpressSchema({ type: 'array' } as AnySchema),
        /Invalid schema/,
      );
    });

    describe('元组 properties 验证', () => {
      test('元组长度必须为 2', () => {
        assert.throws(
          () => validateExpressSchema({
            type: 'array',
            properties: ['items'],
          } as AnySchema),
          /Invalid schema/,
        );

        assert.throws(
          () => validateExpressSchema({
            type: 'array',
            properties: ['items', { type: 'string' }, 'extra'],
          } as AnySchema),
          /Invalid schema/,
        );
      });

      test('元组第一项必须是 string', () => {
        assert.throws(
          () => validateExpressSchema({
            type: 'array',
            properties: [123, { type: 'string' }],
          } as AnySchema),
          /Invalid schema/,
        );
      });

      test('元组第二项必须是 object', () => {
        assert.throws(
          () => validateExpressSchema({
            type: 'array',
            properties: ['items', 'invalid'],
          } as AnySchema),
          /Invalid schema/,
        );

        assert.throws(
          () => validateExpressSchema({
            type: 'array',
            properties: ['items', []],
          } as AnySchema),
          /Invalid schema/,
        );
      });
    });
  });

  describe('无效输入验证', () => {
    const invalidInputs = [
      { input: [], description: '空数组' },
      { input: 'number', description: '字符串' },
      { input: 'integer', description: '字符串 integer' },
      { input: {}, description: '空对象' },
      { input: { type: 'xxx' }, description: '无效的 type' },
      { input: { type: 'json' }, description: '不支持的 type: json' },
      { input: { type: null }, description: 'type 为 null' },
      { input: { type: undefined }, description: 'type 为 undefined' },
    ];

    invalidInputs.forEach(({ input, description }) => {
      test(`${description}应该抛出错误`, () => {
        assert.throws(
          () => validateExpressSchema(input as AnySchema),
          /Invalid schema/,
        );
      });
    });
  });

  describe('可选的 resolve 函数', () => {
    const typesWithResolve = [
      { type: 'string', properties: undefined },
      { type: 'object', properties: { name: { type: 'string' } } },
      { type: 'array', properties: ['items', { type: 'number' }] },
    ];

    typesWithResolve.forEach(schema => {
      test(`${schema.type} 类型应该允许包含 resolve 函数`, () => {
        assert.doesNotThrow(() => {
          validateExpressSchema({
            ...schema,
            resolve: (value: unknown) => value,
          } as AnySchema);
        });
      });
    });
  });

  describe('复杂嵌套场景', () => {
    test('应该通过嵌套对象验证', () => {
      assert.doesNotThrow(() => {
        validateExpressSchema({
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                age: { type: 'number' },
                address: {
                  type: 'object',
                  properties: {
                    city: { type: 'string' },
                    zipCode: { type: 'integer' },
                  },
                },
              },
            },
          },
        });
      });
    });

    test('应该通过嵌套数组验证', () => {
      assert.doesNotThrow(() => {
        validateExpressSchema({
          type: 'array',
          properties: {
            items: {
              type: 'array',
              properties: ['item', { type: 'string' }],
            },
          },
        });
      });
    });

    test('应该通过混合嵌套验证', () => {
      assert.doesNotThrow(() => {
        validateExpressSchema({
          type: 'object',
          properties: {
            users: {
              type: 'array',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    tags: {
                      type: 'array',
                      properties: ['tag', { type: 'string' }],
                    },
                  },
                },
              },
            },
          },
        });
      });
    });
  });

  describe('错误消息验证', () => {
    test('错误消息应该包含无效的 schema 信息', () => {
      try {
        validateExpressSchema({ type: 'invalid' } as AnySchema);
        assert.fail('应该抛出错误');
      } catch (error: unknown) {
        assert.ok(isDataVError(error), 'Should be a DataVError');
        assert.strictEqual((error as { code: string }).code, ERROR_CODES.INVALID_SCHEMA);
        assert.match((error as Error).message, /\[INVALID_SCHEMA\]/);
      }
    });

    test('错误消息应该包含验证错误详情', () => {
      try {
        validateExpressSchema({ type: 'object' } as AnySchema);
        assert.fail('应该抛出错误');
      } catch (error: unknown) {
        assert.ok(isDataVError(error), 'Should be a DataVError');
        assert.match((error as Error).message, /\[INVALID_SCHEMA\]/);
        assert.match((error as Error).message, /properties/);
      }
    });
  });
});
