import * as assert from 'node:assert';
import { test, describe } from 'node:test';

import { createTransform, validateExpressSchema, SchemaExpress, transform } from './transformer.js';

describe('validateExpressSchema', () => {
  describe('Basic validation', () => {
    test('should fail when data is not an object', () => {
      const result = validateExpressSchema(null);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 1);
      assert.match(result.errors[0], /Must be an object/);
    });

    test('should fail when data is a primitive', () => {
      const result = validateExpressSchema('string');
      assert.strictEqual(result.valid, false);
      assert.match(result.errors[0], /Must be an object/);
    });

    test('should fail when path field is missing', () => {
      const schema = { type: 'string' };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(err => err.includes("Missing or invalid 'path' field")));
    });

    test('should fail when path field is not a string', () => {
      const schema = { path: 123, type: 'string' };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(err => err.includes("Missing or invalid 'path' field")));
    });

    test('should fail when type field is invalid', () => {
      const schema = { path: 'test', type: 'invalid' };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(err => err.includes("Invalid 'type' field")));
    });
  });

  describe('Primitive types validation', () => {
    test('should validate string type successfully', () => {
      const schema: SchemaExpress = {
        path: 'user.name',
        type: 'string'
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should validate number type successfully', () => {
      const schema: SchemaExpress = {
        path: 'user.age',
        type: 'number'
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should validate boolean type successfully', () => {
      const schema: SchemaExpress = {
        path: 'user.active',
        type: 'boolean'
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should validate integer type successfully', () => {
      const schema: SchemaExpress = {
        path: 'user.count',
        type: 'integer'
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe('Object type validation', () => {
    test('should fail when object type missing properties field', () => {
      const schema = {
        path: 'user',
        type: 'object'
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(err => err.includes("must include a 'properties' object")));
    });

    test('should fail when properties is null', () => {
      const schema = {
        path: 'user',
        type: 'object',
        properties: null
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(err => err.includes("must include a 'properties' object")));
    });

    test('should validate simple object schema successfully', () => {
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
      assert.strictEqual(result.errors.length, 0);
    });

    test('should fail when nested property is invalid', () => {
      const schema = {
        path: 'user',
        type: 'object',
        properties: {
          name: { path: 'user.name', type: 'string' },
          invalid: { path: 'user.invalid', type: 'badtype' }
        }
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(err => err.includes("Invalid 'type' field")));
    });

    test('should validate deeply nested object schema', () => {
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
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe('Array type validation', () => {
    test('should fail when array type missing items field', () => {
      const schema = {
        path: 'users',
        type: 'array'
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(err => err.includes("must include an 'items' object")));
    });

    test('should fail when items is null', () => {
      const schema = {
        path: 'users',
        type: 'array',
        items: null
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(err => err.includes("must include an 'items' object")));
    });

    test('should validate array of primitives successfully', () => {
      const schema: SchemaExpress = {
        path: 'tags',
        type: 'array',
        items: { path: 'tags[]', type: 'string' }
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should validate array of objects successfully', () => {
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
      assert.strictEqual(result.errors.length, 0);
    });

    test('should fail when array items schema is invalid', () => {
      const schema = {
        path: 'data',
        type: 'array',
        items: { path: 'data[]', type: 'invalid' }
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(err => err.includes("Invalid 'type' field")));
    });

    test('should validate nested arrays successfully', () => {
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
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe('Complex schemas', () => {
    test('should validate complex nested schema', () => {
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
      assert.strictEqual(result.errors.length, 0);
    });

    test('should collect multiple errors', () => {
      const schema = {
        path: 'root',
        type: 'object',
        properties: {
          field1: { type: 'string' }, // missing path
          field2: { path: 'root.field2', type: 'invalid' }, // invalid type
          field3: { path: 'root.field3', type: 'array' } // missing items
        }
      };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length >= 3);
    });
  });

  describe('Context path tracking', () => {
    test('should use default context path', () => {
      const schema = { type: 'string' };
      const result = validateExpressSchema(schema);
      assert.ok(result.errors.some(err => err.includes('[root]')));
    });

    test('should use custom context path', () => {
      const schema = { type: 'string' };
      const result = validateExpressSchema(schema, 'custom.path');
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

describe('Schema Transformer Tests', () => {
  describe('validateExpressSchema', () => {
    test('should validate valid string schema', () => {
      const schema: SchemaExpress = {
        path: '.name',
        type: 'string',
      };

      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should validate valid object schema', () => {
      const schema: SchemaExpress = {
        path: '.',
        type: 'object',
        properties: {
          name: { path: '.name', type: 'string' },
          age: { path: '.age', type: 'integer' },
        },
      };

      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should validate valid array schema', () => {
      const schema: SchemaExpress = {
        path: '.items',
        type: 'array',
        items: { path: '.', type: 'string' },
      };

      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should fail when schema is not an object', () => {
      const result = validateExpressSchema(null);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((err) => err.includes('Must be an object')));
    });

    test('should fail when path is missing', () => {
      const schema = { type: 'string' };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((err) => err.includes('Missing or invalid')));
    });

    test('should fail when type is invalid', () => {
      const schema = { path: '.', type: 'invalid' };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((err) => err.includes('Invalid \'type\' field')));
    });

    test('should fail when object schema missing properties', () => {
      const schema = { path: '.', type: 'object' };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((err) => err.includes('must include a \'properties\' object')));
    });

    test('should fail when array schema missing items', () => {
      const schema = { path: '.', type: 'array' };
      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((err) => err.includes('must include an \'items\' object')));
    });

    test('should validate nested object schema', () => {
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
            },
          },
        },
      };

      const result = validateExpressSchema(schema);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe('createTransform', () => {
    test('should throw error for invalid schema', () => {
      const invalidSchema = { path: '.', type: 'invalid' } as any;

      assert.throws(
        () => createTransform(invalidSchema),
        /Invalid schema/
      );
    });

    test('should create transform function for valid schema', () => {
      const schema: SchemaExpress = {
        path: '.name',
        type: 'string',
      };

      const transformer = createTransform(schema);
      assert.strictEqual(typeof transformer, 'function');
    });
  });

  describe('transform - Basic Types', () => {
    test('should transform string type', () => {
      const schema: SchemaExpress = {
        path: '.name',
        type: 'string',
      };

      const data = { name: 'John Doe' };
      const result = transform(schema, data);
      assert.strictEqual(result, 'John Doe');
    });

    test('should transform number type', () => {
      const schema: SchemaExpress = {
        path: '.value',
        type: 'number',
      };

      const data = { value: '123.45' };
      const result = transform(schema, data);
      assert.strictEqual(result, 123.45);
    });

    test('should transform integer type', () => {
      const schema: SchemaExpress = {
        path: '.age',
        type: 'integer',
      };

      const data = { age: '30' };
      const result = transform(schema, data);
      assert.strictEqual(result, 30);
    });

    test('should transform boolean type', () => {
      const schema: SchemaExpress = {
        path: '.active',
        type: 'boolean',
      };

      const data = { active: 'true' };
      const result = transform(schema, data);
      assert.strictEqual(result, true);
    });

    test('should handle type conversion from number to string', () => {
      const schema: SchemaExpress = {
        path: '.id',
        type: 'string',
      };

      const data = { id: 12345 };
      const result = transform(schema, data);
      assert.strictEqual(result, '12345');
    });
  });

  describe('transform - Array Type', () => {
    test('should transform array of strings', () => {
      const schema: SchemaExpress = {
        path: '.tags',
        type: 'array',
        items: { path: '.', type: 'string' },
      };

      const data = { tags: [1, 2, 'three'] };
      const result = transform(schema, data) as string[];

      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 3);
      assert.deepStrictEqual(result, ['1', '2', 'three']);
    });

    test('should transform array of integers', () => {
      const schema: SchemaExpress = {
        path: '.scores',
        type: 'array',
        items: { path: '.', type: 'integer' },
      };

      const data = { scores: ['10', '20.5', 30] };
      const result = transform(schema, data) as number[];

      assert.deepStrictEqual(result, [10, null, 30]);
    });

    test('should transform array of objects', () => {
      const schema: SchemaExpress = {
        path: '.users',
        type: 'array',
        items: {
          path: '.',
          type: 'object',
          properties: {
            name: { path: '.name', type: 'string' },
            age: { path: '.age', type: 'integer' },
          },
        },
      };

      const data = {
        users: [
          { name: 'Alice', age: '25' },
          { name: 'Bob', age: '30' },
        ],
      };

      const result = transform(schema, data) as any[];

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].name, 'Alice');
      assert.strictEqual(result[0].age, 25);
      assert.strictEqual(result[1].name, 'Bob');
      assert.strictEqual(result[1].age, 30);
    });

    test('should handle empty array', () => {
      const schema: SchemaExpress = {
        path: '.items',
        type: 'array',
        items: { path: '.', type: 'string' },
      };

      const data = { items: [] };
      const result = transform(schema, data) as any[];

      assert.deepStrictEqual(result, []);
    });
  });

  describe('transform - Object Type', () => {
    test('should transform simple object', () => {
      const schema: SchemaExpress = {
        path: '.',
        type: 'object',
        properties: {
          name: { path: '.user.name', type: 'string' },
          age: { path: '.user.age', type: 'integer' },
        },
      };

      const data = {
        user: {
          name: 'John',
          age: '30',
        },
      };

      const result = transform(schema, data) as any;

      assert.strictEqual(result.name, 'John');
      assert.strictEqual(result.age, 30);
    });

    test('should transform nested object', () => {
      const schema: SchemaExpress = {
        path: '.',
        type: 'object',
        properties: {
          user: {
            path: '.data.user',
            type: 'object',
            properties: {
              name: { path: '.name', type: 'string' },
              age: { path: '.age', type: 'integer' },
            },
          },
        },
      };

      const data = {
        data: {
          user: {
            name: 'Alice',
            age: '28',
          },
        },
      };

      const result = transform(schema, data) as any;

      assert.strictEqual(result.user.name, 'Alice');
      assert.strictEqual(result.user.age, 28);
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

      const data = {
        id: 123,
        count: '45',
        price: '99.99',
        active: 1,
      };

      const result = transform(schema, data) as any;

      assert.strictEqual(result.id, '123');
      assert.strictEqual(result.count, 45);
      assert.strictEqual(result.price, 99.99);
      assert.strictEqual(result.active, null);
    });
  });

  describe('transform - Complex Nested Structures', () => {
    test('should transform complex nested structure', () => {
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

      const data = {
        user: {
          name: 'John Doe',
          age: '30',
          tags: [1, 2, 'developer'],
          address: {
            city: 'New York',
            zip: '10001',
          },
        },
      };

      const result = transform(schema, data) as any;

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

      const data = {
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
      };

      const result = transform(schema, data) as any[];

      assert.strictEqual(result[0].orderId, '1001');
      assert.strictEqual(result[0].total, 99.99);
      assert.strictEqual(result[0].items[0].name, 'Book');
      assert.strictEqual(result[0].items[0].quantity, 2);
    });
  });

  describe('transform - Edge Cases', () => {
    test('should handle null values', () => {
      const schema: SchemaExpress = {
        path: '.value',
        type: 'string',
      };

      const data = { value: null };
      const result = transform(schema, data);
      assert.strictEqual(result, null);
    });

    test('should handle undefined values', () => {
      const schema: SchemaExpress = {
        path: '.missing',
        type: 'string',
      };

      const data = {};
      const result = transform(schema, data);
      assert.strictEqual(result, null);
    });

    test('should handle deeply nested paths', () => {
      const schema: SchemaExpress = {
        path: '.level1.level2.level3.value',
        type: 'string',
      };

      const data = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      const result = transform(schema, data);
      assert.strictEqual(result, 'deep');
    });
  });
});

