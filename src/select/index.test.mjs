import assert from 'node:assert';
import test from 'node:test';

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
  assert.equal(select({ type: 'boolean' })('false'), false);
  assert.equal(select({ type: 'boolean' })('true1'), null);
  assert.equal(select({ type: 'number' })('33.3'), 33.3);
  assert.equal(select({ type: 'integer' })('33.3'), 33);
  assert.deepEqual(
    select({
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
  assert.equal(select(['age', { type: 'integer' }])({ age: '33.3' }), 33);
  assert.equal(select(['sub.age', { type: 'integer' }])({ name: 'quan', sub: { age: 33.3 } }), 33);
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
  assert.deepEqual(select([
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
  assert.deepEqual(select(
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

test('select > index, array to object', () => {
  assert.deepEqual(
    select(
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
    select(
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

test('select > index, resolve', () => {
  assert.equal(
    select({
      type: 'integer',
      resolve: (v) => v + 1,
    })(88),
    89,
  );
  assert.equal(
    select(['age', {
      type: 'integer',
      resolve: (v) => `${v + 1}`,
    }])({ age: 88 }),
    89,
  );
  assert.deepEqual(
    select({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          resolve: (a, b) => `${a}_${b.aa}`,
        },
        age: {
          type: 'integer',
          resolve: (a) => a + 1,
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
    select({
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
    select({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          resolve: (a, b) => `${a}_${b.aa}`,
        },
        age: ['big', {
          type: 'integer',
          resolve: (a) => a + 1,
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
    select({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          resolve: (a, b) => `${a}_${b.aa}`,
        },
        obj: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            age: ['big', {
              type: 'integer',
              resolve: (a) => a + 1,
            }],
            ding: {
              type: 'string',
              resolve: (a, b) => `${b.name}_${a}`,
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
    select(
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
    select(
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

test('select > index, resolve pathList', () => {
  const ret = select(
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
              resolve: (d) => `${d.name}_${d.age}`,
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

test('select > index, resolve pathList 2', () => {
  const ret = select(
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

test('select array222', () => {
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
  const ret = select(['.data', {
    type: 'array',
    properties: {
      name: {
        type: 'string',
      },
    },
  }])(data);
  assert.deepEqual(ret, [{ name: 'aa' }, { name: 'bb' }]);
});

test('select array array array', () => {
  const array = [[['11', 22], ['33', 44]], [[1], [2]]];
  const ret = select({
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

test('select object array array array', () => {
  const obj = {
    name: 'xxx',
    arr: [[['11', 22], ['33', 44]], [[1], [2]]],
  };
  const ret = select({
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

test('select 222', () => {
  const obj = {
    data: {
      key: 'aaaabbb',
    },
  };
  assert.equal(select(['.data.key', { type: 'string' }])(obj), obj.data.key);
});

test('select 333', () => {
  const obj = {
    data: ['222', '333'],
  };
  assert.deepEqual(select(['.data', { type: 'array', properties: ['.', { type: 'string' }] }])(obj), obj.data);
});

test('select 444', () => {
  const key = '111222';

  const ret = select({
    type: 'object',
    properties: {
      name: ['.', {
        type: 'string',
      }],
    },
  })(key);
  assert.deepEqual(ret, { name: key });
});

test('select 5555', () => {
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
  const ret = select(['.recordList', {
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

test('select 666', () => {
  const ret = select({
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

test('select 777', () => {
  const ret = select({
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

test('select 888', () => {
  const ret = select({
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

test('select object empty properties', () => {
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
  const ret = select({
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
