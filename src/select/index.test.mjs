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
  assert.throws(() => {
    select(['name', []]);
  });
  assert.throws(() => {
    select(['name', 'xxx']);
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
  assert.throws(() => {
    select({
      type: 'object',
    });
  });
  assert.throws(() => {
    select({
      type: 'object',
      properties: [],
    });
  });
  assert.throws(() => {
    select(['obj', {
      type: 'object',
    }]);
  });
  assert.throws(() => {
    select({
      type: 'object',
      properties: 'xxx',
    });
  });
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
  assert.deepEqual(select({
    type: 'object',
    properties: {
      obj: ['arr.0', {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          foo: ['age', { type: 'integer' }],
        },
      }],
    },
  })({
    name: 'xxxx',
    arr: [{
      name: 'aaa',
      age: '99.9',
    }],
  }), {
    obj: {
      name: 'aaa',
      foo: 99,
    },
  });
  assert.equal(select(['1', {
    type: 'number',
  }])(['44', '33.3']), 33.3);
  assert.equal(select(['1.age', {
    type: 'number',
  }])(['44', '33.3']), null);
});

test('select > index array', () => {
  assert.deepEqual(select({
    type: 'array',
    properties: ['.', {
      type: 'integer',
    }],
  })(['33.3', '22.8']), [33, 22]);
  assert.deepEqual(select({
    type: 'array',
    properties: {
      age: {
        type: 'integer',
      },
    },
  })([{ age: '33.3' }]), [{ age: 33 }]);
  assert.deepEqual(select({
    type: 'array',
    properties: {
      age: {
        type: 'integer',
      },
    },
  })({ age: '33.3' }), [{ age: 33 }]);
  assert.deepEqual(select({
    type: 'array',
    properties: ['.', { type: 'integer' }],
  })(['1.1', '3', '4']), [1, 3, 4]);
  assert.deepEqual(select({
    type: 'array',
    properties: ['age', { type: 'integer' }],
  })([
    {
      age: '1.1',
    },
    {
      age: '3',
    },
    {
      age: '4',
    },
  ]), [1, 3, 4]);
  assert.deepEqual(
    select({
      type: 'array',
      properties: ['$age', { type: 'integer' }],
    })({ name: 'aa', age: '44.4' }),
    [44],
  );
  assert.deepEqual(
    select({
      type: 'array',
      properties: ['$ages', { type: 'integer' }],
    })({ name: 'aa', age: '44.4' }),
    [],
  );
  assert.deepEqual(
    select({
      type: 'array',
      properties: ['age', { type: 'integer' }],
    })({ name: 'aa', age: '44.4' }),
    [],
  );
  assert.deepEqual(
    select({
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        arr: {
          type: 'array',
          properties: {
            name: ['$foo.name', { type: 'string' }],
            age: ['$big.age', { type: 'integer' }],
          },
        },
      },
    })({
      name: 'aaa',
      foo: {
        name: 'bbb',
      },
      big: {
        age: '99.99',
      },
    }),
    {
      name: 'aaa',
      arr: [{
        name: 'bbb',
        age: 99,
      }],
    },
  );
});

test('select > index', () => {
  assert.deepEqual(
    select({
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        quan: ['foo.big', {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            age: {
              type: 'integer',
            },
            ding: ['$cqq', { type: 'number' }],
            jj: ['$other.age', { type: 'integer' }],
          },
        }],
      },
    })({
      name: 'aaa',
      cqq: '44.44',
      other: {
        age: '66.6',
      },
      foo: {
        name: 'bbb',
        dd: 'ee',
        big: {
          name: 'cccc',
          age: '33.3',
        },
      },
    }),
    {
      name: 'aaa',
      quan: {
        name: 'cccc',
        age: 33,
        jj: 66,
        ding: 44.44,
      },
    },
  );

  assert.deepEqual(
    select({
      type: 'array',
      properties: {
        name: {
          type: 'string',
        },
      },
    })({ names: 'quan' }),
    [{ name: null }],
  );

  assert.deepEqual(
    select({
      type: 'array',
      properties: {
        name: {
          type: 'string',
        },
      },
    })({ name: 'quan' }),
    [{ name: 'quan' }],
  );

  assert.deepEqual(
    select({
      type: 'array',
      properties: {
      },
    })({ names: 'quan' }),
    [],
  );

  assert.deepEqual(
    select({
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        arr: {
          type: 'array',
          properties: {
            name: {
              type: 'string',
            },
            age: ['_age', { type: 'integer' }],
            test: ['empty', { type: 'string' }],
            big: ['$obj.big', { type: 'number' }],
          },
        },
      },
    })({
      name: 'root',
      obj: {
        big: '66.66',
      },
      arr: [
        {
          name: '11',
          _age: '22.2',
        },
        {
          name: '22',
          _age: '23.3',
        },
      ],
    }),
    {
      name: 'root',
      arr: [
        {
          name: '11',
          age: 22,
          test: null,
          big: 66.66,
        },
        {
          name: '22',
          age: 23,
          test: null,
          big: 66.66,
        },
      ],
    },
  );
});
