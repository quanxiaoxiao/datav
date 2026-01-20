import * as assert from 'node:assert';
import { test, describe } from 'node:test';

import { createTransform, validateExpressSchema, SchemaExpress, transform } from './transformer.js';

// ============================================================================
// Test Helpers & Fixtures
// ============================================================================

const createValidSchema = (overrides: Partial<SchemaExpress> = {}): SchemaExpress => {
  const base: SchemaExpress = {
    path: 'test',
    type: 'string',
  };
  return { ...base, ...overrides } as SchemaExpress;
};

const assertValidationError = (result: any, errorPattern: string | RegExp) => {
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((err: string) =>
    typeof errorPattern === 'string'
      ? err.includes(errorPattern)
      : errorPattern.test(err)
  ));
};

// ============================================================================
// Schema Validation Tests
// ============================================================================

describe('validateExpressSchema', () => {
  describe('Basic validation', () => {
    const invalidInputs = [
      { input: null, desc: 'null' },
      { input: 'string', desc: 'primitive string' },
      { input: 123, desc: 'number' },
      { input: [], desc: 'array' },
    ];

    invalidInputs.forEach(({ input, desc }) => {
      test(`should reject ${desc}`, () => {
        const result = validateExpressSchema(input);
        assert.strictEqual(result.valid, false);
        assert.ok(result.errors.length > 0);
      });
    });

    test('should reject missing path field', () => {
      const result = validateExpressSchema({ type: 'string' });
      assertValidationError(result, "Missing or invalid 'path' field");
    });

    test('should reject non-string path field', () => {
      const result = validateExpressSchema({ path: 123, type: 'string' });
      assertValidationError(result, "Missing or invalid 'path' field");
    });

    test('should reject invalid type field', () => {
      const result = validateExpressSchema({ path: 'test', type: 'invalid' });
      assertValidationError(result, "Invalid 'type' field");
    });
  });

  describe('Primitive types', () => {
    const primitiveTypes = ['string', 'number', 'boolean', 'integer'] as const;

    primitiveTypes.forEach((type) => {
      test(`should validate ${type} type`, () => {
        const schema = createValidSchema({
          path: `user.${type}Field`,
          type
        });
        const result = validateExpressSchema(schema);
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.errors.length, 0);
      });
    });
  });

  describe('Object type', () => {
    test('should reject object without properties', () => {
      const result = validateExpressSchema({ path: 'user', type: 'object' });
      assertValidationError(result, "must include a 'properties' object");
    });

    test('should reject object with null properties', () => {
      const result = validateExpressSchema({
        path: 'user',
        type: 'object',
        properties: null
      });
      assertValidationError(result, "must include a 'properties' object");
    });

    test('should validate simple object schema', () => {
      const schema: SchemaExpress = {
        path: 'user',
        type: 'object',
        properties: {
          name: { path: 'user.name', type: 'string' },
          age: { path: 'user.age', type: 'number' }
        }
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
    });

    test('should reject object with invalid nested property', () => {
      const schema = {
        path: 'user',
        type: 'object',
        properties: {
          name: { path: 'user.name', type: 'string' },
          invalid: { path: 'user.invalid', type: 'badtype' }
        }
      };
      const result = validateExpressSchema(schema);
      assertValidationError(result, "Invalid 'type' field");
    });

    test('should validate deeply nested objects', () => {
      const schema: SchemaExpress = {
        path: 'company',
        type: 'object',
        properties: {
          name: { path: 'company.name', type: 'string' },
          address: {
            path: 'company.address',
            type: 'object',
            properties: {
              street: { path: 'company.address.street', type: 'string' },
              city: { path: 'company.address.city', type: 'string' }
            }
          }
        }
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
    });
  });

  describe('Array type', () => {
    test('should reject array without items', () => {
      const result = validateExpressSchema({ path: 'users', type: 'array' });
      assertValidationError(result, "must include an 'items' object");
    });

    test('should reject array with null items', () => {
      const result = validateExpressSchema({
        path: 'users',
        type: 'array',
        items: null
      });
      assertValidationError(result, "must include an 'items' object");
    });

    test('should validate array of primitives', () => {
      const schema: SchemaExpress = {
        path: 'tags',
        type: 'array',
        items: { path: 'tags[]', type: 'string' }
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
    });

    test('should validate array of objects', () => {
      const schema: SchemaExpress = {
        path: 'users',
        type: 'array',
        items: {
          path: 'users[]',
          type: 'object',
          properties: {
            name: { path: 'users[].name', type: 'string' },
            age: { path: 'users[].age', type: 'integer' }
          }
        }
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
    });

    test('should reject array with invalid items schema', () => {
      const result = validateExpressSchema({
        path: 'data',
        type: 'array',
        items: { path: 'data[]', type: 'invalid' }
      });
      assertValidationError(result, "Invalid 'type' field");
    });

    test('should validate nested arrays', () => {
      const schema: SchemaExpress = {
        path: 'matrix',
        type: 'array',
        items: {
          path: 'matrix[]',
          type: 'array',
          items: { path: 'matrix[][]', type: 'number' }
        }
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
    });
  });

  describe('Complex schemas', () => {
    test('should validate complex nested structure', () => {
      const schema: SchemaExpress = {
        path: 'response',
        type: 'object',
        properties: {
          status: { path: 'response.status', type: 'integer' },
          data: {
            path: 'response.data',
            type: 'array',
            items: {
              path: 'response.data[]',
              type: 'object',
              properties: {
                id: { path: 'response.data[].id', type: 'string' },
                tags: {
                  path: 'response.data[].tags',
                  type: 'array',
                  items: { path: 'response.data[].tags[]', type: 'string' }
                }
              }
            }
          }
        }
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
    });

    test('should collect multiple errors', () => {
      const schema = {
        path: 'root',
        type: 'object',
        properties: {
          field1: { type: 'string' },
          field2: { path: 'root.field2', type: 'invalid' },
          field3: { path: 'root.field3', type: 'array' }
        }
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length >= 3);
    });
  });

  describe('Context path tracking', () => {
    test('should use default context path', () => {
      const result = validateExpressSchema({ type: 'string' });
      assert.ok(result.errors.some(err => err.includes('[root]')));
    });

    test('should use custom context path', () => {
      const result = validateExpressSchema({ type: 'string' }, 'custom.path');
      assert.ok(result.errors.some(err => err.includes('[custom.path]')));
    });

    test('should track nested context paths', () => {
      const schema = {
        path: 'parent',
        type: 'object',
        properties: {
          child: { type: 'invalid' }
        }
      };
      const result = validateExpressSchema(schema);
      assert.ok(result.errors.some(err => err.includes('root.properties.child')));
    });
  });
});

// ============================================================================
// Transform Function Tests
// ============================================================================

describe('createTransform', () => {
  test('should throw error for invalid schema', () => {
    const invalidSchema = { path: 'x', type: 'object' } as any;
    assert.throws(
      () => createTransform(invalidSchema),
      /Invalid schema/
    );
  });

  test('should create transform function for valid schema', () => {
    const schema = createValidSchema();
    const transformer = createTransform(schema);
    assert.strictEqual(typeof transformer, 'function');
  });
});

describe('transform', () => {
  describe('Primitive types', () => {
    test('should transform all primitive types', () => {
      const schema: SchemaExpress = {
        path: '.',
        type: 'object',
        properties: {
          name: { path: 'name', type: 'string' },
          age: { path: 'age', type: 'integer' },
          score: { path: 'score', type: 'number' },
          active: { path: 'active', type: 'boolean' },
        },
      };

      const result = transform(schema, {
        name: 123,
        age: '18',
        score: '99.5',
        active: 'true',
      });

      assert.deepStrictEqual(result, {
        name: '123',
        age: 18,
        score: 99.5,
        active: true,
      });
    });

    test('should handle type conversion from number to string', () => {
      const schema = createValidSchema({ path: '.id', type: 'string' });
      const result = transform(schema, { id: 12345 });
      assert.strictEqual(result, '12345');
    });

    test('should handle invalid integer conversion', () => {
      const schema = createValidSchema({ path: '.age', type: 'integer' });
      const result = transform(schema, { age: '20.5' });
      assert.strictEqual(result, null);
    });
  });

  describe('Objects', () => {
    test('should transform simple object', () => {
      const schema: SchemaExpress = {
        path: '.',
        type: 'object',
        properties: {
          name: { path: '.user.name', type: 'string' },
          age: { path: '.user.age', type: 'integer' },
        },
      };

      const result = transform(schema, {
        user: { name: 'John', age: '30' },
      });

      assert.deepStrictEqual(result, { name: 'John', age: 30 });
    });

    test('should transform nested objects', () => {
      const schema: SchemaExpress = {
        path: '.',
        type: 'object',
        properties: {
          user: {
            path: 'user',
            type: 'object',
            properties: {
              id: { path: 'id', type: 'integer' },
              name: { path: 'name', type: 'string' },
            },
          },
        },
      };

      const result = transform(schema, {
        user: { id: '42', name: 'Alice' },
      });

      assert.deepStrictEqual(result, {
        user: { id: 42, name: 'Alice' },
      });
    });

    test('should transform object with mixed types', () => {
      const schema: SchemaExpress = {
        path: '.',
        type: 'object',
        properties: {
          id: { path: '.id', type: 'string' },
          count: { path: '.count', type: 'integer' },
          price: { path: '.price', type: 'number' },
          active: { path: '.active', type: 'boolean' },
        },
      };

      const result = transform(schema, {
        id: 123,
        count: '45',
        price: '99.99',
        active: 1,
      });

      assert.deepStrictEqual(result, {
        id: '123',
        count: 45,
        price: 99.99,
        active: null,
      });
    });
  });

  describe('Arrays', () => {
    test('should transform array of primitives', () => {
      const schema: SchemaExpress = {
        path: 'items',
        type: 'array',
        items: { path: '.', type: 'integer' },
      };

      const result = transform(schema, { items: ['1', 2, '3'] });
      assert.deepStrictEqual(result, [1, 2, 3]);
    });

    test('should transform array of strings with type coercion', () => {
      const schema: SchemaExpress = {
        path: '.tags',
        type: 'array',
        items: { path: '.', type: 'string' },
      };

      const result = transform(schema, { tags: [1, 2, 'three'] });
      assert.deepStrictEqual(result, ['1', '2', 'three']);
    });

    test('should transform array of objects', () => {
      const schema: SchemaExpress = {
        path: 'users',
        type: 'array',
        items: {
          path: '.',
          type: 'object',
          properties: {
            id: { path: 'id', type: 'integer' },
            name: { path: 'name', type: 'string' },
          },
        },
      };

      const result = transform(schema, {
        users: [
          { id: '1', name: 'A' },
          { id: '2', name: 'B' },
        ],
      });

      assert.deepStrictEqual(result, [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ]);
    });

    test('should handle empty array', () => {
      const schema: SchemaExpress = {
        path: '.items',
        type: 'array',
        items: { path: '.', type: 'string' },
      };

      const result = transform(schema, { items: [] });
      assert.deepStrictEqual(result, []);
    });
  });

  describe('Complex nested structures', () => {
    test('should transform deeply nested structure', () => {
      const schema: SchemaExpress = {
        path: '.',
        type: 'object',
        properties: {
          user: {
            path: '.user',
            type: 'object',
            properties: {
              name: { path: '.name', type: 'string' },
              age: { path: '.age', type: 'integer' },
              tags: {
                path: '.tags',
                type: 'array',
                items: { path: '.', type: 'string' },
              },
              address: {
                path: '.address',
                type: 'object',
                properties: {
                  city: { path: '.city', type: 'string' },
                  zipCode: { path: '.zip', type: 'integer' },
                },
              },
            },
          },
        },
      };

      const result = transform(schema, {
        user: {
          name: 'John Doe',
          age: '30',
          tags: [1, 2, 'developer'],
          address: { city: 'New York', zip: '10001' },
        },
      }) as any;

      assert.strictEqual(result.user.name, 'John Doe');
      assert.strictEqual(result.user.age, 30);
      assert.deepStrictEqual(result.user.tags, ['1', '2', 'developer']);
      assert.strictEqual(result.user.address.city, 'New York');
      assert.strictEqual(result.user.address.zipCode, 10001);
    });

    test('should transform array of nested objects', () => {
      const schema: SchemaExpress = {
        path: '.orders',
        type: 'array',
        items: {
          path: '.',
          type: 'object',
          properties: {
            orderId: { path: '.id', type: 'string' },
            total: { path: '.total', type: 'number' },
            items: {
              path: '.items',
              type: 'array',
              items: {
                path: '.',
                type: 'object',
                properties: {
                  name: { path: '.name', type: 'string' },
                  quantity: { path: '.qty', type: 'integer' },
                },
              },
            },
          },
        },
      };

      const result = transform(schema, {
        orders: [
          {
            id: 1001,
            total: '99.99',
            items: [
              { name: 'Book', qty: '2' },
              { name: 'Pen', qty: '5' },
            ],
          },
        ],
      }) as any[];

      assert.strictEqual(result[0].orderId, '1001');
      assert.strictEqual(result[0].total, 99.99);
      assert.strictEqual(result[0].items[0].name, 'Book');
      assert.strictEqual(result[0].items[0].quantity, 2);
    });
  });

  describe('Edge cases', () => {
    const edgeCases = [
      { value: null, desc: 'null' },
      { value: undefined, desc: 'undefined' },
    ];

    edgeCases.forEach(({ value, desc }) => {
      test(`should handle ${desc} values`, () => {
        const schema = createValidSchema({ path: '.value', type: 'string' });
        const result = transform(schema, { value });
        assert.strictEqual(result, null);
      });
    });

    test('should handle missing path', () => {
      const schema = createValidSchema({ path: '.missing', type: 'string' });
      const result = transform(schema, {});
      assert.strictEqual(result, null);
    });

    test('should handle deeply nested paths', () => {
      const schema = createValidSchema({
        path: '.level1.level2.level3.value',
        type: 'string',
      });

      const result = transform(schema, {
        level1: { level2: { level3: { value: 'deep' } } },
      });

      assert.strictEqual(result, 'deep');
    });
  });

  describe('Root path reference ($)', () => {
    test('should use $ to access root data', () => {
      const schema: SchemaExpress = {
        path: '$.name',
        type: 'string',
      };

      const result = transform(schema, {
        name: 'John',
        age: 30,
      });

      assert.strictEqual(result, 'John');
    });

    test('should use $ to access nested root data', () => {
      const schema: SchemaExpress = {
        path: '$.user.profile.name',
        type: 'string',
      };

      const result = transform(schema, {
        user: { profile: { name: 'Alice' } },
        settings: { theme: 'dark' },
      });

      assert.strictEqual(result, 'Alice');
    });

    test('should use $ to access array element from root', () => {
      const schema: SchemaExpress = {
        path: '$.0',
        type: 'string',
      };

      const result = transform(schema, ['first', 'second', 'third']);

      assert.strictEqual(result, 'first');
    });

    test('should use $ in object properties to access root', () => {
      const schema: SchemaExpress = {
        path: 'result',
        type: 'object',
        properties: {
          name: { path: '$.user.name', type: 'string' },
          email: { path: '$.contact.email', type: 'string' },
        },
      };

      const result = transform(schema, {
        user: { name: 'Bob', id: 1 },
        contact: { email: 'bob@example.com' },
        other: { data: 'ignored' },
      }) as any;

      assert.strictEqual(result.name, 'Bob');
      assert.strictEqual(result.email, 'bob@example.com');
    });

    test('should use $ in array items to access root', () => {
      const schema: SchemaExpress = {
        path: 'items',
        type: 'array',
        items: {
          path: '.',
          type: 'object',
          properties: {
            id: { path: '$.originalId', type: 'integer' },
            displayName: { path: 'name', type: 'string' },
          },
        },
      };

      const result = transform(schema, {
        originalId: '100',
        items: [
          { name: 'Item1' },
          { name: 'Item2' },
        ],
      }) as any[];

      assert.strictEqual(result[0].id, 100);
      assert.strictEqual(result[0].displayName, 'Item1');
      assert.strictEqual(result[1].id, 100);
      assert.strictEqual(result[1].displayName, 'Item2');
    });

    test('should handle $ with missing path', () => {
      const schema: SchemaExpress = {
        path: '$.missing.field',
        type: 'string',
      };

      const result = transform(schema, { other: 'value' });

      assert.strictEqual(result, null);
    });

    test('should handle $ with null data', () => {
      const schema: SchemaExpress = {
        path: '$.user.name',
        type: 'string',
      };

      const result = transform(schema, null);

      assert.strictEqual(result, null);
    });

    test('should handle $ with complex nested structure', () => {
      const schema: SchemaExpress = {
        path: 'data',
        type: 'object',
        properties: {
          title: { path: '$.title', type: 'string' },
          authorName: { path: '$.author.name', type: 'string' },
          firstTag: { path: '$.tags.0', type: 'string' },
        },
      };

      const result = transform(schema, {
        title: 'My Article',
        author: { name: 'Charlie' },
        tags: ['tech', 'coding', 'typescript'],
        meta: { views: 1000 },
      }) as any;

      assert.strictEqual(result.title, 'My Article');
      assert.strictEqual(result.authorName, 'Charlie');
      assert.strictEqual(result.firstTag, 'tech');
    });
  });

  describe('Resolve function', () => {
    test('should apply resolve function to transform value', () => {
      const schema: SchemaExpress = {
        path: '.amount',
        type: 'number',
        resolve: (value) => (value as number) * 2,
      };

      const result = transform(schema, { amount: 10 });
      assert.strictEqual(result, 20);
    });

    test('should receive context with data, rootData, and path', () => {
      let receivedContext: any = null;

      const schema: SchemaExpress = {
        path: '.value',
        type: 'string',
        resolve: (value, ctx) => {
          receivedContext = ctx;
          return `processed:${value}`;
        },
      };

      const data = { value: 'test', extra: 'data' };
      transform(schema, data);

      assert.ok(receivedContext !== null);
      assert.strictEqual(receivedContext.data, data);
      assert.strictEqual(receivedContext.rootData, data);
      assert.strictEqual(receivedContext.path, '.value');
    });

    test('should resolve to different type', () => {
      const schema: SchemaExpress = {
        path: '.items',
        type: 'string',
        resolve: (value) => `count:${(value as any[]).length}`,
      };

      const result = transform(schema, { items: [1, 2, 3] });
      assert.strictEqual(result, 'count:3');
    });

    test('should access rootData in resolve function', () => {
      const schema: SchemaExpress = {
        path: '.price',
        type: 'number',
        resolve: (_value, ctx) => {
          const multiplier = (ctx.rootData as any).multiplier || 1;
          return (_value as number) * multiplier;
        },
      };

      const result = transform(schema, { price: 100, multiplier: 1.5 });
      assert.strictEqual(result, 150);
    });

    test('should work with resolve in object properties', () => {
      const schema: SchemaExpress = {
        path: '.',
        type: 'object',
        properties: {
          original: { path: '.value', type: 'string' },
          doubled: {
            path: '.value',
            type: 'number',
            resolve: (value) => parseFloat(value as string) * 2,
          } as SchemaExpress,
        },
      };

      const result = transform(schema, { value: '25' }) as any;
      assert.strictEqual(result.original, '25');
      assert.strictEqual(result.doubled, 50);
    });

    test('should work with resolve in array items', () => {
      const schema: SchemaExpress = {
        path: '.prices',
        type: 'array',
        items: {
          path: '.',
          type: 'number',
          resolve: (value) => (value as number) + 10,
        } as SchemaExpress,
      };

      const result = transform(schema, { prices: [100, 200, 300] });
      assert.deepStrictEqual(result, [110, 210, 310]);
    });

    test('should receive original data context in nested resolve', () => {
      const receivedContexts: any[] = [];

      const schema: SchemaExpress = {
        path: '.items',
        type: 'array',
        items: {
          path: '.',
          type: 'object',
          properties: {
            id: { path: '.id', type: 'integer' },
            computed: {
              path: '.value',
              type: 'number',
              resolve: (value, ctx) => {
                receivedContexts.push(ctx.data);
                return (value as number) * (ctx.data as any).multiplier;
              },
            } as SchemaExpress,
          },
        } as SchemaExpress,
      };

      transform(schema, {
        items: [
          { id: 1, value: 10, multiplier: 2 },
          { id: 2, value: 20, multiplier: 3 },
        ],
      });

      assert.strictEqual(receivedContexts.length, 2);
      assert.strictEqual(receivedContexts[0].multiplier, 2);
      assert.strictEqual(receivedContexts[1].multiplier, 3);
    });

    test('should call resolve even when path is missing', () => {
      let resolveCalled = false;

      const schema: SchemaExpress = {
        path: '.missing',
        type: 'string',
        resolve: () => {
          resolveCalled = true;
          return 'resolved value';
        },
      };

      const result = transform(schema, { other: 'value' });
      assert.strictEqual(resolveCalled, true);
      assert.strictEqual(result, 'resolved value');
    });

    test('should handle resolve returning undefined', () => {
      const schema: SchemaExpress = {
        path: '.value',
        type: 'string',
        resolve: () => undefined,
      };

      const result = transform(schema, { value: 'test' });
      assert.strictEqual(result, null);
    });

    test('should handle resolve error gracefully', () => {
      const schema: SchemaExpress = {
        path: '.value',
        type: 'string',
        resolve: () => {
          throw new Error('Resolve failed');
        },
      };

      assert.throws(
        () => transform(schema, { value: 'test' }),
        /Resolve failed/
      );
    });

    test('should work with resolve and $ path reference', () => {
      const schema: SchemaExpress = {
        path: '.localValue',
        type: 'string',
        resolve: (value, ctx) => `${value} (ref: ${(ctx.rootData as any).ref})`,
      };

      const result = transform(schema, { localValue: 'test', ref: 'REF123' });
      assert.strictEqual(result, 'test (ref: REF123)');
    });
  });
});
