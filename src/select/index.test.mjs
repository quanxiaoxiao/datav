import test from 'node:test';
import assert from 'node:assert';
import select from './index.mjs';

test('select > index', () => {
  assert.throws(() => {
    select('number');
  });
  assert.throws(() => {
    select(['name']);
  });
  assert.equal(select({ type: 'number' })('1'), 1);
  assert.equal(select({ type: 'number' })('1.1'), 1.1);
  assert.equal(select({ type: 'number' })(1.1), 1.1);
  assert.equal(select({ type: 'integer' })('1.1'), 1);
  assert.equal(select({ type: 'boolean' })('true'), true);
  assert.equal(select({ type: 'boolean' })('true1'), null);
});

test('select > index, pathname', () => {
  assert.equal(select({
    type: 'integer',
    properties: ['age', { type: 'number' }],
  })('333.3'), 333);
  assert.equal(select(['age', { type: 'integer' }])({ age: '2.2' }), 2);
  assert.equal(select(['ages', { type: 'integer' }])({ age: '2.2' }), null);
});

test('select > index, []', () => {
  assert.equal(select(['age', { type: 'integer' }])({ age: '33.33' }), 33);
  assert.equal(select(['obj.age', { type: 'integer' }])({ obj: { age: '33.33' } }), 33);
});

test('select > index, type with object', () => {
  assert.deepEqual(select({
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      age: {
        type: 'integer',
      },
    },
  })({
    name: 'quan',
    age: '22.5',
    obj: {
      age: '33.3',
      big: 'xxx',
    },
  }), { name: 'quan', age: 22 });
  assert.deepEqual(select([
    'obj',
    {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        age: {
          type: 'integer',
        },
      },
    },
  ])({
    name: 'quan',
    age: '22.5',
    obj: {
      name: 'xxx',
      age: '33.3',
      big: 'foo',
    },
  }), { name: 'xxx', age: 33 });
  assert.throws(() => {
    select(['obj', {
      type: 'object',
    }]);
  });
  assert.deepEqual(select([
    'obj',
    {
      type: 'object',
      properties: {
      },
    },
  ])({
    name: 'quan',
    age: '22.5',
    obj: {
      name: 'xxx',
      age: '33.3',
      big: 'foo',
    },
  }), {});
  assert.deepEqual(select([
    'obj',
    {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    },
  ])({
    name: 'quan',
    age: '22.5',
    obj: {
      name: 'xxx',
      age: '33.3',
      big: 'foo',
    },
  }), { name: 'xxx' });
  assert.deepEqual(select({
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      age: {
        type: 'number',
      },
      obj: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          age: {
            type: 'integer',
          },
        },
      },
    },
  })({
    name: 'quan',
    age: '22.5',
    obj: {
      name: 'xxx',
      age: '33.3',
      big: 'foo',
    },
  }), {
    name: 'quan',
    age: 22.5,
    obj: {
      name: 'xxx',
      age: 33,
    },
  });
  assert.deepEqual(select({
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      ding: ['age', {
        type: 'integer',
      }],
    },
  })({
    name: 'quan',
    age: '22.5',
  }), {
    name: 'quan',
    ding: 22,
  });
  assert.deepEqual(select({
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      age: {
        type: 'number',
      },
      ding: ['obj.big', {
        type: 'string',
      }],
    },
  })({
    name: 'quan',
    age: '22.5',
    obj: {
      name: 'xxx',
      age: '33.3',
      big: 'foo',
    },
  }), {
    name: 'quan',
    age: 22.5,
    ding: 'foo',
  });
  assert.deepEqual(select({
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      age: {
        type: 'number',
      },
      sub: ['obj', {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          age: {
            type: 'integer',
          },
          cqq: ['big', { type: 'string' }],
        },
      }],
    },
  })({
    name: 'quan',
    age: '22.5',
    obj: {
      name: 'xxx',
      age: '33.3',
      big: 'foo',
    },
  }), {
    name: 'quan',
    age: 22.5,
    sub: {
      name: 'xxx',
      age: 33,
      cqq: 'foo',
    },
  });
  assert.deepEqual(select(['obj', {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      age: {
        type: 'integer',
      },
    },
  }])({
    name: 'quan',
    age: '22.5',
    obj: {
      name: 'xxx',
      age: '33.3',
      big: 'foo',
    },
  }), {
    name: 'xxx',
    age: 33,
  });
  assert.deepEqual(select(['obj', {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      bb: ['age', { type: 'number' }],
      age: {
        type: 'integer',
      },
    },
  }])({
    name: 'quan',
    age: '22.5',
    obj: {
      name: 'xxx',
      age: '33.3',
      big: 'foo',
    },
  }), {
    bb: 33.3,
    name: 'xxx',
    age: 33,
  });
});
