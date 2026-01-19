import * as assert from 'node:assert';
import { test, describe } from 'node:test';

import { validateExpressSchema, SchemaExpress } from './transformer.js';

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
