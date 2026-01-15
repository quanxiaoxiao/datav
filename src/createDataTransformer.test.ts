import assert from 'node:assert';
import test from 'node:test';

import { createDataTransformer } from './createDataTransformer.js';

// 测试辅助函数
const expectTransform = (schema: any, input: any, expected: any) => {
  const result = createDataTransformer(schema)(input);
  assert.deepEqual(result, expected);
};

const expectThrows = (schema: any) => {
  assert.throws(() => createDataTransformer(schema));
};

test('基础类型转换', async (t) => {
  await t.test('应该拒绝无效的 schema 格式', () => {
    expectThrows('number');
    expectThrows(['name']);
    expectThrows(['name', []]);
    expectThrows(['name', 'xxx']);
  });

  await t.test('number 类型转换', () => {
    const schema = { type: 'number' };
    expectTransform(schema, '1', 1);
    expectTransform(schema, '1.1', 1.1);
    expectTransform(schema, 1.1, 1.1);
    expectTransform(schema, '33.3', 33.3);
  });

  await t.test('integer 类型转换', () => {
    const schema = { type: 'integer' };
    expectTransform(schema, '1.1', 1);
    expectTransform(schema, '33.3', 33);
  });

  await t.test('boolean 类型转换', () => {
    const schema = { type: 'boolean' };
    expectTransform(schema, 'true', true);
    expectTransform(schema, 'false', false);
    expectTransform(schema, 'true1', null);
  });

  await t.test('string 类型转换', () => {
    const schema = { type: 'string' };
    expectTransform(schema, 123, '123');
    expectTransform(schema, 'hello', 'hello');
    expectTransform(schema, null, null);
  });
});

test('路径访问 (pathname)', async (t) => {
  await t.test('基本路径访问', () => {
    expectTransform(
      ['age', { type: 'integer' }],
      { age: '33.3' },
      33
    );

    expectTransform(
      ['sub.age', { type: 'integer' }],
      { name: 'quan', sub: { age: 33.3 } },
      33
    );
  });

  await t.test('嵌套对象路径', () => {
    expectTransform(
      ['obj.age', { type: 'integer' }],
      { obj: { age: '33.33' } },
      33
    );
  });

  await t.test('路径不存在时返回 null', () => {
    expectTransform(
      ['ages', { type: 'integer' }],
      { age: '2.2' },
      null
    );
  });

  await t.test('数组索引访问', () => {
    expectTransform(
      ['1', { type: 'number' }],
      ['44', '33.3'],
      33.3
    );

    expectTransform(
      ['1.age', { type: 'number' }],
      ['44', '33.3'],
      null
    );
  });

  await t.test('根路径访问 ($)', () => {
    expectTransform(
      {
        type: 'array',
        properties: ['$age', { type: 'integer' }]
      },
      { name: 'aa', age: '44.4' },
      [44]
    );

    expectTransform(
      {
        type: 'array',
        properties: ['$ages', { type: 'integer' }]
      },
      { name: 'aa', age: '44.4' },
      []
    );
  });

  await t.test('点号路径 (.)', () => {
    expectTransform(
      ['.data.key', { type: 'string' }],
      { data: { key: 'aaaabbb' } },
      'aaaabbb'
    );
  });
});

test('对象类型转换', async (t) => {
  await t.test('应该拒绝无效的对象 schema', () => {
    expectThrows({ type: 'object' });
    expectThrows({ type: 'object', properties: [] });
    expectThrows(['obj', { type: 'object' }]);
    expectThrows({ type: 'object', properties: 'xxx' });
  });

  await t.test('基本对象转换', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' }
        }
      },
      { name: 'quan', age: '22.2', foo: 'bar' },
      { name: 'quan', age: 22 }
    );
  });

  await t.test('嵌套对象转换', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          obj: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'integer' }
            }
          }
        }
      },
      {
        name: 'quan',
        age: '22.5',
        obj: { name: 'xxx', age: '33.3', big: 'foo' }
      },
      {
        name: 'quan',
        age: 22.5,
        obj: { name: 'xxx', age: 33 }
      }
    );
  });

  await t.test('空 properties 保留所有字段', () => {
    expectTransform(
      { type: 'object', properties: {} },
      { name: 'quan', age: '22.5', obj: 'aaa' },
      { name: 'quan', age: '22.5', obj: 'aaa' }
    );
  });

  await t.test('对象路径访问', () => {
    expectTransform(
      ['obj', {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' }
        }
      }],
      {
        name: 'quan',
        age: '22.5',
        obj: { name: 'xxx', age: '33.3', big: 'foo' }
      },
      { name: 'xxx', age: 33 }
    );
  });

  await t.test('对象字段重命名', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          ding: ['age', { type: 'integer' }]
        }
      },
      { name: 'quan', age: '22.5' },
      { name: 'quan', ding: 22 }
    );
  });

  await t.test('复杂嵌套对象转换', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          ddd: ['obj.name', { type: 'string' }],
          sub: ['obj', {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'integer' },
              cqq: ['big', { type: 'string' }]
            }
          }]
        }
      },
      {
        name: 'quan',
        age: '22.5',
        obj: { name: 'xxx', age: '33.3', big: 'foo' }
      },
      {
        name: 'quan',
        age: 22.5,
        ddd: 'xxx',
        sub: { name: 'xxx', age: 33, cqq: 'foo' }
      }
    );
  });

  await t.test('数组索引转对象', () => {
    expectTransform(
      ['0', {
        type: 'object',
        properties: {
          name: { type: 'string' },
          id: { type: 'number' },
          _id: ['id', { type: 'string' }]
        }
      }],
      [{ name: 'quan', id: 11 }],
      { name: 'quan', id: 11, _id: '11' }
    );

    expectTransform(
      ['0', {
        type: 'object',
        properties: {
          name: { type: 'string' },
          id: { type: 'number' },
          _id: ['id', { type: 'string' }]
        }
      }],
      [],
      { name: null, id: null, _id: null }
    );
  });

  await t.test('根路径引用', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quan: ['foo.big', {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'integer' },
              ding: ['$cqq', { type: 'number' }],
              jj: ['$other.age', { type: 'integer' }]
            }
          }]
        }
      },
      {
        name: 'aaa',
        cqq: '44.44',
        other: { age: '66.6' },
        foo: {
          name: 'bbb',
          dd: 'ee',
          big: { name: 'cccc', age: '33.3' }
        }
      },
      {
        name: 'aaa',
        quan: {
          name: 'cccc',
          age: 33,
          jj: 66,
          ding: 44.44
        }
      }
    );
  });
});

test('数组类型转换', async (t) => {
  await t.test('基本数组元素转换', () => {
    expectTransform(
      {
        type: 'array',
        properties: ['.', { type: 'integer' }]
      },
      ['33.3', '22.8'],
      [33, 22]
    );

    expectTransform(
      {
        type: 'array',
        properties: ['.', { type: 'integer' }]
      },
      ['1.1', '3', '4'],
      [1, 3, 4]
    );
  });

  await t.test('对象数组转换', () => {
    expectTransform(
      {
        type: 'array',
        properties: { age: { type: 'integer' } }
      },
      [{ age: '33.3' }],
      [{ age: 33 }]
    );

    expectTransform(
      {
        type: 'array',
        properties: { age: { type: 'integer' } }
      },
      { age: '33.3' },
      [{ age: 33 }]
    );
  });

  await t.test('提取数组元素字段', () => {
    expectTransform(
      {
        type: 'array',
        properties: ['age', { type: 'integer' }]
      },
      [{ age: '1.1' }, { age: '3' }, { age: '4' }],
      [1, 3, 4]
    );
  });

  await t.test('使用根路径填充数组', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          arr: {
            type: 'array',
            properties: {
              name: ['$foo.name', { type: 'string' }],
              age: ['$big.age', { type: 'integer' }]
            }
          }
        }
      },
      {
        name: 'aaa',
        foo: { name: 'bbb' },
        big: { age: '99.99' }
      },
      {
        name: 'aaa',
        arr: [{ name: 'bbb', age: 99 }]
      }
    );
  });

  await t.test('嵌套数组转换', () => {
    expectTransform(
      {
        type: 'array',
        properties: ['.', {
          type: 'array',
          properties: ['.', {
            type: 'array',
            properties: ['.', { type: 'number' }]
          }]
        }]
      },
      [[['11', 22], ['33', 44]], [[1], [2]]],
      [[[11, 22], [33, 44]], [[1], [2]]]
    );
  });

  await t.test('数组路径提取', () => {
    expectTransform(
      ['.data', {
        type: 'array',
        properties: { name: { type: 'string' } }
      }],
      {
        data: [
          { name: 'aa', age: 22 },
          { name: 'bb', age: 33 }
        ]
      },
      [{ name: 'aa' }, { name: 'bb' }]
    );
  });

  await t.test('数组字段重映射', () => {
    expectTransform(
      ['.recordList', {
        type: 'array',
        properties: {
          dateTimeNameStart: ['.startTime', { type: 'string' }],
          dateTimeNameEnd: ['.endTime', { type: 'string' }]
        }
      }],
      {
        deviceId: '101007351946',
        recordList: [
          { deviceId: '101007351946', startTime: '2024-06-25 10:09:37', endTime: '2024-06-25 13:45:32' },
          { deviceId: '101007351946', startTime: '2024-06-25 13:47:16', endTime: '2024-06-25 17:01:19' }
        ]
      },
      [
        { dateTimeNameStart: '2024-06-25 10:09:37', dateTimeNameEnd: '2024-06-25 13:45:32' },
        { dateTimeNameStart: '2024-06-25 13:47:16', dateTimeNameEnd: '2024-06-25 17:01:19' }
      ]
    );
  });
});

test('resolve 函数', async (t) => {
  await t.test('基本类型 resolve', () => {
    expectTransform(
      {
        type: 'integer',
        resolve: (v: any) => v + 1
      },
      88,
      89
    );

    expectTransform(
      ['age', {
        type: 'integer',
        resolve: (v: any) => `${v + 1}`
      }],
      { age: 88 },
      89
    );
  });

  await t.test('对象中的 resolve', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            resolve: (a: any, b: any) => `${a}_${b.aa}`
          },
          age: {
            type: 'integer',
            resolve: (a: any) => a + 1
          }
        }
      },
      { name: 'quan', aa: 'xx', age: 33 },
      { name: 'quan_xx', age: 34 }
    );
  });

  await t.test('resolve 提供默认值', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: {
            type: 'integer',
            resolve: () => 99
          }
        }
      },
      { name: 'quan' },
      { name: 'quan', age: 99 }
    );
  });

  await t.test('嵌套对象 resolve', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            resolve: (a: any, b: any) => `${a}_${b.aa}`
          },
          obj: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: ['big', {
                type: 'integer',
                resolve: (a: any) => a + 1
              }],
              ding: {
                type: 'string',
                resolve: (a: any, b: any) => `${b.name}_${a}`
              }
            }
          }
        }
      },
      {
        name: 'quan',
        aa: 'xx',
        obj: { name: 'rice', big: 33, ding: 'aaa' }
      },
      {
        name: 'quan_xx',
        obj: { name: 'rice', age: 34, ding: 'quan_aaa' }
      }
    );
  });

  await t.test('resolve 不覆盖字段名', () => {
    expectTransform(
      { type: 'object', properties: { name: { type: 'string' }, resolve: { type: 'string' } } },
      { name: 'aaa', resolve: 'resolve' },
      { name: 'aaa', resolve: 'resolve' }
    );
  });

  await t.test('数组中的 resolve', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          count: { type: 'integer' },
          list: {
            type: 'array',
            properties: {
              token: ['.', {
                type: 'string',
                resolve: (d: any) => `${d.name}_${d.age}`
              }],
              name: { type: 'string' }
            }
          }
        }
      },
      {
        count: 20,
        list: [
          { name: 'big', age: 11 },
          { name: 'bar', age: 22 }
        ]
      },
      {
        count: 20,
        list: [
          { name: 'big', token: 'big_11' },
          { name: 'bar', token: 'bar_22' }
        ]
      }
    );
  });

  await t.test('数组提取路径', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          count: { type: 'integer' },
          list: {
            type: 'array',
            properties: ['.name', { type: 'string' }]
          }
        }
      },
      {
        count: 20,
        list: [
          { name: 'big', age: 11 },
          { name: 'bar', age: 22 }
        ]
      },
      { count: 20, list: ['big', 'bar'] }
    );
  });
});

test('实际场景测试', async (t) => {
  await t.test('从嵌套结构提取数据', () => {
    expectTransform(
      ['obj', {
        type: 'object',
        properties: { name: { type: 'string' } }
      }],
      { name: 'quan', age: '22.5', obj: { name: 'xxx', age: '33.3', big: 'foo' } },
      { name: 'xxx' }
    );
  });

  await t.test('根路径创建数组', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          chl: {
            type: 'array',
            properties: ['$channel', { type: 'string' }]
          }
        }
      },
      { channel: '1' },
      { chl: ['1'] }
    );
  });

  await t.test('构建参数数组', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          key: { type: 'string' },
          params: {
            type: 'array',
            properties: {
              task: ['$taskId', { type: 'number' }],
              date: ['$dateName', { type: 'string' }]
            }
          }
        }
      },
      { key: '123', taskId: '999', dateName: '2024-06-06' },
      {
        key: '123',
        params: [{ task: '999', date: '2024-06-06' }]
      }
    );
  });

  await t.test('提取数组首项', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          dir: ['.data.0.dir', { type: 'string' }],
          name: ['.data.0.name', { type: 'string' }]
        }
      },
      {
        data: [
          { dir: 'QzpcVmlkZW9ccXExMjM0XDIwMTctMDYtMTlccmVjb3JkXDE=', name: 'qq1234-170619-000000-002000-01p401000000.264' },
          { dir: 'QzpcVmlkZW9ccXExMjM0XDIwMTctMDYtMTlccmVjb3JkXDE=', name: 'qq1234-170619-000000-002000-01p401000000.mp4' }
        ],
        errorcode: 200
      },
      {
        dir: 'QzpcVmlkZW9ccXExMjM0XDIwMTctMDYtMTlccmVjb3JkXDE=',
        name: 'qq1234-170619-000000-002000-01p401000000.264'
      }
    );
  });

  await t.test('保留原始对象结构', () => {
    expectTransform(
      {
        type: 'object',
        properties: {
          route: ['.data', {
            type: 'object',
            properties: {}
          }]
        }
      },
      {
        code: 0,
        data: {
          name: 'data111',
          '/aaa': { name: '123', '/ccc': { name: 'ccc' } },
          '/sss': { name: '999' }
        }
      },
      {
        route: {
          name: 'data111',
          '/aaa': { name: '123', '/ccc': { name: 'ccc' } },
          '/sss': { name: '999' }
        }
      }
    );
  });

  await t.test('包装单值为对象', () => {
    expectTransform(
      {
        type: 'object',
        properties: { name: ['.', { type: 'string' }] }
      },
      '111222',
      { name: '111222' }
    );
  });

  await t.test('处理根路径数组', () => {
    expectTransform(
      ['.data', {
        type: 'array',
        properties: ['.', { type: 'string' }]
      }],
      { data: ['222', '333'] },
      ['222', '333']
    );
  });
});

test('边界情况', async (t) => {
  await t.test('处理 null 值', () => {
    const schema = { type: 'string' };
    expectTransform(schema, null, null);
  });

  await t.test('处理空数组', () => {
    expectTransform(
      {
        type: 'array',
        properties: { name: { type: 'string' } }
      },
      [],
      []
    );
  });

  await t.test('处理包含 null 的数组', () => {
    expectTransform(
      {
        type: 'array',
        properties: ['.', { type: 'string' }]
      },
      [null, 'test', undefined],
      [null, 'test', null]
    );
  });

  await t.test('处理缺失字段', () => {
    const result = createDataTransformer({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        email: { type: 'string' }
      }
    })({ name: 'Alice' });

    assert.strictEqual(result.name, 'Alice');
    assert.strictEqual(result.age, null);
    assert.strictEqual(result.email, null);
  });

  await t.test('非数组输入转数组', () => {
    expectTransform(
      { type: 'array', properties: { name: { type: 'string' } } },
      { names: 'quan' },
      [{ name: null }]
    );

    expectTransform(
      { type: 'array', properties: { name: { type: 'string' } } },
      { name: 'quan' },
      [{ name: 'quan' }]
    );
  });

  await t.test('空 properties 返回空数组', () => {
    expectTransform(
      { type: 'array', properties: {} },
      { names: 'quan' },
      []
    );
  });

  await t.test('非对象输入转对象', () => {
    expectTransform(
      ['obj', {
        type: 'object',
        properties: {}
      }],
      { name: 'quan', age: '22.5', obj: 'aaa' },
      {}
    );
  });
});

test('错误处理', async (t) => {
  await t.test('警告数组/对象使用 resolve', () => {
    const consoleWarnSpy = mock.method(console, 'warn');

    createDataTransformer({
      type: 'array',
      properties: {},
      resolve: () => {}
    });

    assert.strictEqual(consoleWarnSpy.mock.calls.length, 1);
    assert.match(
      consoleWarnSpy.mock.calls[0].arguments[0] as string,
      /does not support resolve/
    );

    consoleWarnSpy.mock.restore();
  });
});
