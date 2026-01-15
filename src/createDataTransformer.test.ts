import assert from 'node:assert';
import test from 'node:test';

import { createDataTransformer } from './createDataTransformer.js';

test('createDataTransformer > index', () => {
  assert.throws(() => {
    createDataTransformer('number');
  });
  assert.throws(() => {
    createDataTransformer(['name']);
  });
  assert.throws(() => {
    createDataTransformer(['name', []]);
  });
  assert.throws(() => {
    createDataTransformer(['name', 'xxx']);
  });
  assert.equal(createDataTransformer({ type: 'number' })('1'), 1);
  assert.equal(createDataTransformer({ type: 'number' })('1.1'), 1.1);
  assert.equal(createDataTransformer({ type: 'number' })(1.1), 1.1);
  assert.equal(createDataTransformer({ type: 'integer' })('1.1'), 1);
  assert.equal(createDataTransformer({ type: 'boolean' })('true'), true);
  assert.equal(createDataTransformer({ type: 'boolean' })('false'), false);
  assert.equal(createDataTransformer({ type: 'boolean' })('true1'), null);
  assert.equal(createDataTransformer({ type: 'number' })('33.3'), 33.3);
  assert.equal(createDataTransformer({ type: 'integer' })('33.3'), 33);
  assert.deepEqual(
    createDataTransformer({
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        age: {
          type: 'integer',
        },
      },
    })({ name: 'quan', age: '22.2', foo: 'bar' }),
    { name: 'quan', age: 22 },
  );
  assert.equal(createDataTransformer(['age', { type: 'integer' }])({ age: '33.3' }), 33);
  assert.equal(createDataTransformer(['sub.age', { type: 'integer' }])({ name: 'quan', sub: { age: 33.3 } }), 33);
});

test('createDataTransformer > index, pathname', () => {
  assert.equal(createDataTransformer({
    type: 'integer',
    properties: ['age', { type: 'number' }],
  })('333.3'), 333);
  assert.equal(createDataTransformer(['age', { type: 'integer' }])({ age: '2.2' }), 2);
  assert.equal(createDataTransformer(['ages', { type: 'integer' }])({ age: '2.2' }), null);
});

test('createDataTransformer > index, []', () => {
  assert.equal(createDataTransformer(['age', { type: 'integer' }])({ age: '33.33' }), 33);
  assert.equal(createDataTransformer(['obj.age', { type: 'integer' }])({ obj: { age: '33.33' } }), 33);
});

test('createDataTransformer > index, type with object', () => {
  assert.throws(() => {
    createDataTransformer({
      type: 'object',
    });
  });
  assert.throws(() => {
    createDataTransformer({
      type: 'object',
      properties: [],
    });
  });
  assert.throws(() => {
    createDataTransformer(['obj', {
      type: 'object',
    }]);
  });
  assert.throws(() => {
    createDataTransformer({
      type: 'object',
      properties: 'xxx',
    });
  });
  assert.deepEqual(createDataTransformer({
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
  assert.deepEqual(createDataTransformer([
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
  assert.deepEqual(createDataTransformer([
    'obj',
    {
      type: 'object',
      properties: {},
    },
  ])({
    name: 'quan',
    age: '22.5',
    obj: {
      name: 'xxx',
      age: '33.3',
      big: 'foo',
    },
  }), {
    name: 'xxx',
    age: '33.3',
    big: 'foo',
  });
  assert.deepEqual(createDataTransformer([
    'obj',
    {
      type: 'object',
      properties: {},
    },
  ])({
    name: 'quan',
    age: '22.5',
    obj: 'aaa',
  }), {});
  assert.deepEqual(createDataTransformer(
    {
      type: 'object',
      properties: {},
    },
  )({
    name: 'quan',
    age: '22.5',
    obj: 'aaa',
  }), {
    name: 'quan',
    age: '22.5',
    obj: 'aaa',
  });
  assert.deepEqual(createDataTransformer([
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
  assert.deepEqual(createDataTransformer({
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
  assert.deepEqual(createDataTransformer({
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
  assert.deepEqual(createDataTransformer({
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
  assert.deepEqual(createDataTransformer({
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      age: {
        type: 'number',
      },
      ddd: ['obj.name', { type: 'string' }],
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
    ddd: 'xxx',
    sub: {
      name: 'xxx',
      age: 33,
      cqq: 'foo',
    },
  });
  assert.deepEqual(createDataTransformer(['obj', {
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
  assert.deepEqual(createDataTransformer(['obj', {
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
  assert.deepEqual(createDataTransformer({
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
  assert.equal(createDataTransformer(['1', {
    type: 'number',
  }])(['44', '33.3']), 33.3);
  assert.equal(createDataTransformer(['1.age', {
    type: 'number',
  }])(['44', '33.3']), null);
});

test('createDataTransformer > index array', () => {
  assert.deepEqual(createDataTransformer({
    type: 'array',
    properties: ['.', {
      type: 'integer',
    }],
  })(['33.3', '22.8']), [33, 22]);
  assert.deepEqual(createDataTransformer({
    type: 'array',
    properties: {
      age: {
        type: 'integer',
      },
    },
  })([{ age: '33.3' }]), [{ age: 33 }]);
  assert.deepEqual(createDataTransformer({
    type: 'array',
    properties: {
      age: {
        type: 'integer',
      },
    },
  })({ age: '33.3' }), [{ age: 33 }]);
  assert.deepEqual(createDataTransformer({
    type: 'array',
    properties: ['.', { type: 'integer' }],
  })(['1.1', '3', '4']), [1, 3, 4]);
  assert.deepEqual(createDataTransformer({
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
    createDataTransformer({
      type: 'array',
      properties: ['$age', { type: 'integer' }],
    })({ name: 'aa', age: '44.4' }),
    [44],
  );
  assert.deepEqual(
    createDataTransformer({
      type: 'array',
      properties: ['$ages', { type: 'integer' }],
    })({ name: 'aa', age: '44.4' }),
    [],
  );
  assert.deepEqual(
    createDataTransformer({
      type: 'array',
      properties: ['age', { type: 'integer' }],
    })({ name: 'aa', age: '44.4' }),
    [],
  );
  assert.deepEqual(
    createDataTransformer({
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

test('createDataTransformer > index, array to object', () => {
  assert.deepEqual(
    createDataTransformer(
      ['0', {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          id: {
            type: 'number',
          },
          _id: ['id', { type: 'string' }],
        },
      }],
    )([{ name: 'quan', id: 11 }]),
    { name: 'quan', id: 11, _id: '11' },
  );
  assert.deepEqual(
    createDataTransformer(
      ['0', {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          id: {
            type: 'number',
          },
          _id: ['id', { type: 'string' }],
        },
      }],
    )([]),
    { name: null, id: null, _id: null },
  );
});

test('createDataTransformer > index', () => {
  assert.deepEqual(
    createDataTransformer({
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
    createDataTransformer({
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
    createDataTransformer({
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
    createDataTransformer({
      type: 'array',
      properties: {
      },
    })({ names: 'quan' }),
    [],
  );

  assert.deepEqual(
    createDataTransformer({
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

test('createDataTransformer > index, resolve', () => {
  assert.equal(
    createDataTransformer({
      type: 'integer',
      resolve: (v) => (v as number) + 1,
    })(88),
    89,
  );
  assert.equal(
    createDataTransformer(['age', {
      type: 'integer',
      resolve: (v) => `${(v as number) + 1}`,
    }])({ age: 88 }),
    89,
  );
  assert.deepEqual(
    createDataTransformer({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          resolve: (a, b) => `${a}_${(b as Record<string, string>).aa}`,
        },
        age: {
          type: 'integer',
          resolve: (a) => (a as number) + 1,
        },
      },
    })({
      name: 'quan',
      aa: 'xx',
      age: 33,
    }),
    {
      name: 'quan_xx',
      age: 34,
    },
  );
  assert.deepEqual(
    createDataTransformer({
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        age: {
          type: 'integer',
          resolve: () => 99,
        },
      },
    })({
      name: 'quan',
    }),
    {
      name: 'quan',
      age: 99,
    },
  );
  assert.deepEqual(
    createDataTransformer({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          resolve: (a, b) => `${a}_${(b as Record<string, string>).aa}`,
        },
        age: ['big', {
          type: 'integer',
          resolve: (a) => (a as number) + 1,
        }],
      },
    })({
      name: 'quan',
      aa: 'xx',
      big: 33,
    }),
    {
      name: 'quan_xx',
      age: 34,
    },
  );
  assert.deepEqual(
    createDataTransformer({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          resolve: (a, b) => `${a}_${(b as Record<string, string>).aa}`,
        },
        obj: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            age: ['big', {
              type: 'integer',
              resolve: (a) => (a as number) + 1,
            }],
            ding: {
              type: 'string',
              resolve: (a, b) => `${(b as Record<string, string>).name}_${a}`,
            },
          },
        },
      },
    })({
      name: 'quan',
      aa: 'xx',
      obj: {
        name: 'rice',
        big: 33,
        ding: 'aaa',
      },
    }),
    {
      name: 'quan_xx',
      obj: {
        name: 'rice',
        age: 34,
        ding: 'quan_aaa',
      },
    },
  );
  assert.deepEqual(
    createDataTransformer(
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          resolve: {
            type: 'string',
          },
        },
      },
    )({ name: 'aaa', resolve: 'resolve' }),
    { name: 'aaa', resolve: 'resolve' },
  );
  assert.deepEqual(
    createDataTransformer(
      {
        type: 'object',
        resolve: () => ({ name: 'xxx' }),
        properties: {
          name: {
            type: 'string',
          },
          resolve: {
            type: 'string',
          },
        },
      },
    )({ name: 'aaa', resolve: 'resolve' }),
    { name: 'aaa', resolve: 'resolve' },
  );
});

test('createDataTransformer > index, resolve pathList', () => {
  const ret = createDataTransformer(
    {
      type: 'object',
      properties: {
        count: {
          type: 'integer',
        },
        list: {
          type: 'array',
          properties: {
            token: ['.', {
              type: 'string',
              resolve: (d) => `${(d as Record<string, string>).name}_${(d as Record<string, number>).age}`,
            }],
            name: {
              type: 'string',
            },
          },
        },
      },
    },
  )({
    count: 20,
    list: [
      {
        name: 'big',
        age: 11,
      },
      {
        name: 'bar',
        age: 22,
      },
    ],
  });
  assert.deepEqual(ret, {
    count: 20,
    list: [
      {
        name: 'big',
        token: 'big_11',
      },
      {
        name: 'bar',
        token: 'bar_22',
      },
    ],
  });
});

test('createDataTransformer > index, resolve pathList 2', () => {
  const ret = createDataTransformer(
    {
      type: 'object',
      properties: {
        count: {
          type: 'integer',
        },
        list: {
          type: 'array',
          properties: ['.name', {
            type: 'string',
          }],
        },
      },
    },
  )({
    count: 20,
    list: [
      {
        name: 'big',
        age: 11,
      },
      {
        name: 'bar',
        age: 22,
      },
    ],
  });
  assert.deepEqual(ret, {
    count: 20,
    list: ['big', 'bar'],
  });
});

test('createDataTransformer array222', () => {
  const data = {
    data: [
      {
        name: 'aa',
        age: 22,
      },
      {
        name: 'bb',
        age: 33,
      },
    ],
  };
  const ret = createDataTransformer(['.data', {
    type: 'array',
    properties: {
      name: {
        type: 'string',
      },
    },
  }])(data);
  assert.deepEqual(ret, [{ name: 'aa' }, { name: 'bb' }]);
});

test('createDataTransformer array array array', () => {
  const array = [[['11', 22], ['33', 44]], [[1], [2]]];
  const ret = createDataTransformer({
    type: 'array',
    properties: ['.', {
      type: 'array',
      properties: ['.', {
        type: 'array',
        properties: ['.', { type: 'number' }],
      }],
    }],
  })(array);
  assert.deepEqual(ret, [[[11, 22], [33, 44]], [[1], [2]]]);
});

test('createDataTransformer object array array array', () => {
  const obj = {
    name: 'xxx',
    arr: [[['11', 22], ['33', 44]], [[1], [2]]],
  };
  const ret = createDataTransformer({
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      arr: ['arr', {
        type: 'array',
        properties: ['.', {
          type: 'array',
          properties: ['.', {
            type: 'array',
            properties: ['.', { type: 'number' }],
          }],
        }],
      }],
    },
  })(obj);
  assert.deepEqual(ret.arr, [[[11, 22], [33, 44]], [[1], [2]]]);
});

test('createDataTransformer 222', () => {
  const obj = {
    data: {
      key: 'aaaabbb',
    },
  };
  assert.equal(createDataTransformer(['.data.key', { type: 'string' }])(obj), obj.data.key);
});

test('createDataTransformer 333', () => {
  const obj = {
    data: ['222', '333'],
  };
  assert.deepEqual(createDataTransformer(['.data', { type: 'array', properties: ['.', { type: 'string' }] }])(obj), obj.data);
});

test('createDataTransformer 444', () => {
  const key = '111222';

  const ret = createDataTransformer({
    type: 'object',
    properties: {
      name: ['.', {
        type: 'string',
      }],
    },
  })(key);
  assert.deepEqual(ret, { name: key });
});

test('createDataTransformer 5555', () => {
  const data = {
    deviceId: '101007351946',
    channelId: '2',
    sn: '286329',
    name: null,
    sumNum: 4,
    count: 4,
    lastTime: null,
    recordList: [
      {
        deviceId: '101007351946',
        startTime: '2024-06-25 10:09:37',
        endTime: '2024-06-25 13:45:32',
      },
      {
        deviceId: '101007351946',
        startTime: '2024-06-25 13:47:16',
        endTime: '2024-06-25 17:01:19',
      },
      {
        deviceId: '101007351946',
        startTime: '2024-06-25 17:01:19',
        endTime: '2024-06-25 17:01:21',
      },
      {
        deviceId: '101007351946',
        startTime: '2024-06-25 17:01:21',
        endTime: '2024-06-25 18:11:39',
      },
    ],
  };
  const ret = createDataTransformer(['.recordList', {
    type: 'array',
    properties: {
      dateTimeNameStart: ['.startTime', { type: 'string' }],
      dateTimeNameEnd: ['.endTime', { type: 'string' }],
    },
  }])(data);
  assert.deepEqual(
    ret,
    data.recordList.map((d) => ({
      dateTimeNameStart: d.startTime,
      dateTimeNameEnd: d.endTime,
    })),
  );
});

test('createDataTransformer 666', () => {
  const ret = createDataTransformer({
    type: 'object',
    properties: {
      chl: {
        type: 'array',
        properties: ['$channel', { type: 'string' }],
      },
    },
  })({
    channel: '1',
  });
  assert.deepEqual(ret, { chl: ['1'] });
});

test('createDataTransformer 777', () => {
  const ret = createDataTransformer({
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      params: {
        type: 'array',
        properties: {
          task: ['$taskId', { type: 'number' }],
          date: ['$dateName', { type: 'string' }],
        },
      },
    },
  })({
    key: '123',
    taskId: '999',
    dateName: '2024-06-06',
  });
  assert.deepEqual(ret, {
    key: '123',
    params: [
      {
        task: '999',
        date: '2024-06-06',
      },
    ],
  });
});

test('createDataTransformer 888', () => {
  const ret = createDataTransformer({
    type: 'object',
    properties: {
      dir: ['.data.0.dir', { type: 'string' }],
      name: ['.data.0.name', { type: 'string' }],
    },
  })({
    data: [
      {
        dir: 'QzpcVmlkZW9ccXExMjM0XDIwMTctMDYtMTlccmVjb3JkXDE=',
        name: 'qq1234-170619-000000-002000-01p401000000.264',
      },
      {
        dir: 'QzpcVmlkZW9ccXExMjM0XDIwMTctMDYtMTlccmVjb3JkXDE=',
        name: 'qq1234-170619-000000-002000-01p401000000.mp4',
      },
    ],
    errorcode: 200,
  });
  assert.deepEqual(ret, {
    dir: 'QzpcVmlkZW9ccXExMjM0XDIwMTctMDYtMTlccmVjb3JkXDE=',
    name: 'qq1234-170619-000000-002000-01p401000000.264',
  });
});

test('createDataTransformer object empty properties', () => {
  const data = {
    code: 0,
    data: {
      name: 'data111',
      '/aaa': {
        name: '123',
        '/ccc': {
          name: 'ccc',
        },
      },
      '/sss': {
        name: '999',
      },
    },
  };
  const ret = createDataTransformer({
    type: 'object',
    properties: {
      route: ['.data', {
        type: 'object',
        properties: {},
      }],
    },
  })(data);
  assert.deepEqual(
    {
      route: data.data,
    },
    ret,
  );
});

describe('createDataTransformer', () => {

  describe('基础类型转换', () => {
    test('应该正确转换 string 类型', () => {
      const schema = { type: 'string' };
      const transform = createDataTransformer(schema);

      assert.strictEqual(transform(123), '123');
      assert.strictEqual(transform('hello'), 'hello');
      assert.strictEqual(transform(null), null);
    });

    test('应该正确转换 number 类型', () => {
      const schema = { type: 'number' };
      const transform = createDataTransformer(schema);

      assert.strictEqual(transform('123'), 123);
      assert.strictEqual(transform(456), 456);
      assert.strictEqual(transform('3.14'), 3.14);
    });

    test('应该正确转换 integer 类型', () => {
      const schema = { type: 'integer' };
      const transform = createDataTransformer(schema);

      assert.strictEqual(transform('123'), 123);
      assert.strictEqual(transform(456.78), 456);
    });

    test('应该正确转换 boolean 类型', () => {
      const schema = { type: 'boolean' };
      const transform = createDataTransformer(schema);

      assert.strictEqual(transform(1), true);
      assert.strictEqual(transform(0), false);
      assert.strictEqual(transform('true'), true);
    });

    test('应该支持 resolve 函数', () => {
      const schema = {
        type: 'string',
        resolve: (value: unknown) => `prefix_${value}`
      };
      const transform = createDataTransformer(schema);

      assert.strictEqual(transform('test'), 'prefix_test');
    });

    test('resolve 函数应该接收 root 参数', () => {
      const schema = {
        type: 'string',
        resolve: (value: unknown, root: any) => root.prefix + value
      };
      const transform = createDataTransformer(schema);
      const data = { prefix: 'pre_', value: 'test' };

      assert.strictEqual(transform('test', data), 'pre_test');
    });
  });

  describe('对象类型转换', () => {
    test('应该转换简单对象', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      };
      const transform = createDataTransformer(schema);
      const data = { name: 'Alice', age: '25' };

      const result = transform(data);
      assert.deepStrictEqual(result, { name: 'Alice', age: 25 });
    });

    test('应该处理嵌套对象', () => {
      const schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' }
            }
          }
        }
      };
      const transform = createDataTransformer(schema);
      const data = {
        user: { name: 'Bob', age: '30' }
      };

      const result = transform(data);
      assert.deepStrictEqual(result, {
        user: { name: 'Bob', age: 30 }
      });
    });

    test('应该处理空 properties 的对象', () => {
      const schema = { type: 'object', properties: {} };
      const transform = createDataTransformer(schema);

      assert.deepStrictEqual(transform({ a: 1, b: 2 }), { a: 1, b: 2 });
      assert.deepStrictEqual(transform('not an object'), {});
    });

    test('应该处理 null 或 undefined 数据', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      };
      const transform = createDataTransformer(schema);

      const result = transform(null);
      assert.ok(result);
      assert.strictEqual(result.name, null);
    });
  });

  describe('数组类型转换', () => {
    test('应该转换基础类型数组', () => {
      const schema = {
        type: 'array',
        properties: ['', { type: 'number' }]
      };
      const transform = createDataTransformer(schema);
      const data = ['1', '2', '3'];

      const result = transform(data);
      assert.deepStrictEqual(result, [1, 2, 3]);
    });

    test('应该转换对象数组', () => {
      const schema = {
        type: 'array',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      };
      const transform = createDataTransformer(schema);
      const data = [
        { name: 'Alice', age: '25' },
        { name: 'Bob', age: '30' }
      ];

      const result = transform(data);
      assert.deepStrictEqual(result, [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 }
      ]);
    });

    test('应该处理带路径的数组项', () => {
      const schema = {
        type: 'array',
        properties: ['user.name', { type: 'string' }]
      };
      const transform = createDataTransformer(schema);
      const data = [
        { user: { name: 'Alice' } },
        { user: { name: 'Bob' } }
      ];

      const result = transform(data);
      assert.deepStrictEqual(result, ['Alice', 'Bob']);
    });

    test('应该处理非数组数据（对象形式）', () => {
      const schema = {
        type: 'array',
        properties: {
          name: { type: 'string' }
        }
      };
      const transform = createDataTransformer(schema);
      const data = { name: 'Alice' };

      const result = transform(data);
      assert.deepStrictEqual(result, [{ name: 'Alice' }]);
    });

    test('应该处理非数组数据（tuple 形式）', () => {
      const schema = {
        type: 'array',
        properties: ['', { type: 'string' }]
      };
      const transform = createDataTransformer(schema);

      const result = transform('not an array');
      assert.deepStrictEqual(result, []);
    });

    test('应该处理空 properties 数组', () => {
      const schema = {
        type: 'array',
        properties: {}
      };
      const transform = createDataTransformer(schema);

      assert.deepStrictEqual(transform('not an array'), []);
      assert.deepStrictEqual(transform([1, 2]), [1, 2]);
    });
  });

  describe('路径访问 (pathname)', () => {
    test('应该支持相对路径访问', () => {
      const schema = ['user.name', { type: 'string' }];
      const transform = createDataTransformer(schema);
      const data = { user: { name: 'Alice' } };

      const result = transform(data);
      assert.strictEqual(result, 'Alice');
    });

    test('应该支持根路径访问 ($)', () => {
      const schema = ['$root.config', { type: 'string' }];
      const transform = createDataTransformer(schema);
      const data = { user: 'Alice' };
      const root = { root: { config: 'test' } };

      const result = transform(data, root);
      assert.strictEqual(result, 'test');
    });

    test('应该支持数组中的根路径访问', () => {
      const schema = {
        type: 'array',
        properties: ['$globalValue', { type: 'string' }]
      };
      const transform = createDataTransformer(schema);
      const data = [1, 2, 3];
      const root = { globalValue: 'shared' };

      const result = transform(data, root);
      assert.deepStrictEqual(result, ['shared', 'shared', 'shared']);
    });

    test('应该处理点号路径', () => {
      const schema = {
        type: 'array',
        properties: ['.', { type: 'number' }]
      };
      const transform = createDataTransformer(schema);
      const data = [1, 2, 3];

      const result = transform(data);
      assert.deepStrictEqual(result, [1, 2, 3]);
    });

    test('应该在 pathname 中处理 null 返回值', () => {
      const schema = {
        type: 'array',
        properties: ['$missing.path', { type: 'string' }]
      };
      const transform = createDataTransformer(schema);
      const data = [1, 2, 3];
      const root = { other: 'value' };

      const result = transform(data, root);
      assert.deepStrictEqual(result, []);
    });
  });

  describe('复杂场景', () => {
    test('应该处理深度嵌套结构', () => {
      const schema = {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            properties: {
              name: { type: 'string' },
              profile: {
                type: 'object',
                properties: {
                  age: { type: 'number' },
                  active: { type: 'boolean' }
                }
              }
            }
          }
        }
      };
      const transform = createDataTransformer(schema);
      const data = {
        users: [
          {
            name: 'Alice',
            profile: { age: '25', active: 1 }
          },
          {
            name: 'Bob',
            profile: { age: '30', active: 0 }
          }
        ]
      };

      const result = transform(data);
      assert.deepStrictEqual(result, {
        users: [
          {
            name: 'Alice',
            profile: { age: 25, active: true }
          },
          {
            name: 'Bob',
            profile: { age: 30, active: false }
          }
        ]
      });
    });

    test('应该在嵌套结构中正确传递 root', () => {
      const schema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            properties: {
              value: {
                type: 'string',
                resolve: (value: unknown, root: any) => `${root.prefix}_${value}`
              }
            }
          }
        }
      };
      const transform = createDataTransformer(schema);
      const data = {
        prefix: 'test',
        items: [{ value: 'a' }, { value: 'b' }]
      };

      const result = transform(data);
      assert.deepStrictEqual(result, {
        items: [
          { value: 'test_a' },
          { value: 'test_b' }
        ]
      });
    });
  });

  describe('错误处理', () => {
    test('应该在 pathname 格式错误时抛出异常', () => {
      const invalidSchema = [123, { type: 'string' }];

      assert.throws(
        () => createDataTransformer(invalidSchema as any),
        /Invalid schema expression/
      );
    });

    test('应该在 pathname 数组第二项不是对象时抛出异常', () => {
      const invalidSchema = ['path', 'not an object'];

      assert.throws(
        () => createDataTransformer(invalidSchema as any),
        /Invalid schema expression/
      );
    });

    test('应该在使用 resolve 于 array/object 时发出警告', () => {
      const consoleWarnSpy = mock.method(console, 'warn');

      const schema = {
        type: 'array',
        properties: {},
        resolve: () => {}
      };

      createDataTransformer(schema);

      assert.strictEqual(consoleWarnSpy.mock.calls.length, 1);
      assert.match(
        consoleWarnSpy.mock.calls[0].arguments[0] as string,
        /does not support resolve/
      );

      consoleWarnSpy.mock.restore();
    });
  });

  describe('边界情况', () => {
    test('应该处理空数组', () => {
      const schema = {
        type: 'array',
        properties: {
          name: { type: 'string' }
        }
      };
      const transform = createDataTransformer(schema);

      const result = transform([]);
      assert.deepStrictEqual(result, []);
    });

    test('应该处理包含 null 元素的数组', () => {
      const schema = {
        type: 'array',
        properties: ['', { type: 'string' }]
      };
      const transform = createDataTransformer(schema);
      const data = [null, 'test', undefined];

      const result = transform(data);
      assert.deepStrictEqual(result, [null, 'test', null]);
    });

    test('应该处理缺失字段', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          email: { type: 'string' }
        }
      };
      const transform = createDataTransformer(schema);
      const data = { name: 'Alice' };

      const result = transform(data);
      assert.strictEqual(result.name, 'Alice');
      assert.strictEqual(result.age, null);
      assert.strictEqual(result.email, null);
    });
  });
});

