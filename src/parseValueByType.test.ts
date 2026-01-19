import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  parseValueByType,
  toString,
  toNumber,
  toInteger,
  toBoolean,
  toArray,
  toObject,
  toJson,
  DATA_TYPE_STRING,
  DATA_TYPE_NUMBER,
  DATA_TYPE_INTEGER,
  DATA_TYPE_BOOLEAN,
  DATA_TYPE_ARRAY,
  DATA_TYPE_OBJECT,
  DATA_TYPE_JSON,
} from './parseValueByType.js';
import { isDataVError, ERROR_CODES } from './errors.js';

// 辅助函数：测试错误码
const assertDataVError = (fn: () => void, expectedCode: string) => {
  assert.throws(fn, (err: unknown) => {
    assert.ok(isDataVError(err));
    assert.strictEqual((err as { code: string }).code, expectedCode);
    return true;
  });
};

// 辅助函数：批量测试用例
const runTestCases = <T>(
  cases: Array<{ input: any; expected: T; desc?: string }>,
  transformFn: (input: any) => T,
  equalityFn: (actual: T, expected: T) => void = assert.strictEqual
) => {
  cases.forEach(({ input, expected, desc }) => {
    const description = desc || `${JSON.stringify(input)} -> ${JSON.stringify(expected)}`;
    it(description, () => {
      equalityFn(transformFn(input), expected);
    });
  });
};

describe('parseValueByType', () => {
  describe('参数验证', () => {
    it('应该在类型参数为空时抛出错误', () => {
      assertDataVError(
        () => parseValueByType('test', null as unknown as string),
        ERROR_CODES.EMPTY_DATA_TYPE
      );
      assertDataVError(
        () => parseValueByType('test', undefined as unknown as string),
        ERROR_CODES.EMPTY_DATA_TYPE
      );
    });

    it('应该在类型参数无效时抛出错误', () => {
      assertDataVError(
        () => parseValueByType('aaa', 'bbb' as unknown as string),
        ERROR_CODES.INVALID_DATA_TYPE
      );
      assertDataVError(
        () => parseValueByType('test', 'invalid' as unknown as string),
        ERROR_CODES.INVALID_DATA_TYPE
      );
    });
  });

  describe('NULL 和 UNDEFINED 处理', () => {
    const nullTestCases = [
      { type: DATA_TYPE_STRING, expected: null, desc: 'string' },
      { type: DATA_TYPE_NUMBER, expected: null, desc: 'number' },
      { type: DATA_TYPE_INTEGER, expected: null, desc: 'integer' },
      { type: DATA_TYPE_BOOLEAN, expected: null, desc: 'boolean' },
      { type: DATA_TYPE_JSON, expected: null, desc: 'json' },
      { type: DATA_TYPE_OBJECT, expected: null, desc: 'object' },
      { type: DATA_TYPE_ARRAY, expected: [], desc: 'array' },
    ];

    nullTestCases.forEach(({ type, expected, desc }) => {
      it(`应该将 null/undefined 转换为 ${JSON.stringify(expected)} (${desc} 类型)`, () => {
        assert.deepStrictEqual(parseValueByType(null, type), expected);
        assert.deepStrictEqual(parseValueByType(undefined, type), expected);
      });
    });
  });

  describe('STRING 类型转换', () => {
    runTestCases([
      { input: 'hello', expected: 'hello', desc: '保持字符串不变' },
      { input: '', expected: '', desc: '保持空字符串不变' },
      { input: ' 1', expected: ' 1', desc: '保留空格' },
      { input: 123, expected: '123', desc: '数字转字符串' },
      { input: 0, expected: '0', desc: '零转字符串' },
      { input: 1, expected: '1', desc: '1转字符串' },
      { input: true, expected: 'true', desc: 'true转字符串' },
      { input: false, expected: 'false', desc: 'false转字符串' },
      { input: null, expected: null, desc: 'null保持null' },
    ], (input) => parseValueByType(input, DATA_TYPE_STRING));

    it('应该使用数组的 toString 方法', () => {
      assert.strictEqual(parseValueByType([1, 2, 3], DATA_TYPE_STRING), '1,2,3');
    });

    it('应该使用对象的 toString 方法', () => {
      assert.strictEqual(parseValueByType({ name: 'cqq' }, DATA_TYPE_STRING), '[object Object]');
    });

    it('应该使用自定义 toString 方法', () => {
      const obj = {
        name: 'quan',
        toString: () => 'cqq',
      };
      assert.strictEqual(parseValueByType(obj, DATA_TYPE_STRING), 'cqq');
    });
  });

  describe('INTEGER 类型转换', () => {
    describe('有效转换', () => {
      runTestCases([
        { input: '123', expected: 123 },
        { input: '0', expected: 0 },
        { input: '-456', expected: -456 },
        { input: '1', expected: 1 },
        { input: 42, expected: 42 },
        { input: 1, expected: 1 },
      ], (input) => parseValueByType(input, DATA_TYPE_INTEGER));
    });

    describe('浮点数取整', () => {
      runTestCases([
        { input: 123.7, expected: 123 },
        { input: '99.9', expected: 99 },
        { input: -5.5, expected: -5 },
        { input: 3.1, expected: 3 },
        { input: '1.1', expected: 1 },
        { input: '-3.1', expected: -3 },
      ], (input) => parseValueByType(input, DATA_TYPE_INTEGER));
    });

    describe('无效输入返回 null', () => {
      const invalidCases = ['', 'abc', '12abc', '1.2.3', '01', ' 1', true, false, {}, [], null, NaN];
      invalidCases.forEach(input => {
        it(`${JSON.stringify(input)} -> null`, () => {
          assert.strictEqual(parseValueByType(input, DATA_TYPE_INTEGER), null);
        });
      });
    });
  });

  describe('NUMBER 类型转换', () => {
    describe('有效转换', () => {
      runTestCases([
        { input: '123', expected: 123 },
        { input: '123.45', expected: 123.45 },
        { input: '-67.89', expected: -67.89 },
        { input: '0', expected: 0 },
        { input: '-1', expected: -1 },
        { input: '-1.5', expected: -1.5 },
        { input: '-2.5', expected: -2.5 },
        { input: '2.5', expected: 2.5 },
        { input: 42, expected: 42 },
        { input: 3.14, expected: 3.14 },
        { input: 1, expected: 1 },
        { input: 1e3, expected: 1000 },
      ], (input) => parseValueByType(input, DATA_TYPE_NUMBER));
    });

    it('应该将 NaN 转换为 null', () => {
      assert.strictEqual(parseValueByType(NaN, DATA_TYPE_NUMBER), null);
    });

    it('应该处理负零', () => {
      const result = parseValueByType(-0, DATA_TYPE_NUMBER);
      assert.strictEqual(Object.is(result, -0), true);
      assert.strictEqual(parseValueByType('-0', DATA_TYPE_NUMBER), null);
    });

    describe('无效输入返回 null', () => {
      const invalidCases = [
        '', 'a', '1a', '01', '2.5a', '2.5.', '2.5.8',
        'abc', '12abc', true, false, {}, [], null,
        'NaN', '1e3', 'Infinity', '-Infinity',
      ];

      invalidCases.forEach(input => {
        it(`${JSON.stringify(input)} -> null`, () => {
          assert.strictEqual(parseValueByType(input, DATA_TYPE_NUMBER), null);
        });
      });
    });
  });

  describe('BOOLEAN 类型转换', () => {
    runTestCases([
      { input: 'true', expected: true, desc: '字符串 "true"' },
      { input: 'false', expected: false, desc: '字符串 "false"' },
      { input: true, expected: true, desc: '布尔值 true' },
      { input: false, expected: false, desc: '布尔值 false' },
    ], (input) => parseValueByType(input, DATA_TYPE_BOOLEAN));

    describe('无效输入返回 null', () => {
      const invalidCases = [
        '', ' false', 'false ', ' true', 'true ',
        '0', '1', 'TRUE', 'FALSE', 0, 1, null,
      ];

      invalidCases.forEach(input => {
        it(`${JSON.stringify(input)} -> null`, () => {
          assert.strictEqual(parseValueByType(input, DATA_TYPE_BOOLEAN), null);
        });
      });
    });
  });

  describe('JSON 类型转换', () => {
    runTestCases([
      { input: '{"name":"test"}', expected: { name: 'test' } },
      { input: '[1,2,3]', expected: [1, 2, 3] },
      { input: '{"arr":[1,2,3]}', expected: { arr: [1, 2, 3] } },
      { input: '{"nested":{"a":1}}', expected: { nested: { a: 1 } } },
      { input: '[]', expected: [] },
      { input: '{}', expected: {} },
    ], (input) => parseValueByType(input, DATA_TYPE_JSON), assert.deepStrictEqual);

    it('应该处理嵌套结构', () => {
      const nested = '{"user":{"name":"test","age":20},"items":[1,2,3]}';
      assert.deepStrictEqual(
        parseValueByType(nested, DATA_TYPE_JSON),
        { user: { name: 'test', age: 20 }, items: [1, 2, 3] }
      );
    });

    describe('无效输入返回 null', () => {
      const invalidCases = ['invalid', '{invalid}', '{fail}', "'1'", 'aa', 123, 2, null];

      invalidCases.forEach(input => {
        it(`${JSON.stringify(input)} -> null`, () => {
          assert.strictEqual(parseValueByType(input, DATA_TYPE_JSON), null);
        });
      });
    });
  });

  describe('OBJECT 类型转换', () => {
    describe('有效对象解析', () => {
      it('应该解析 JSON 对象字符串', () => {
        assert.deepStrictEqual(
          parseValueByType('{"name":"test","age":20}', DATA_TYPE_OBJECT),
          { name: 'test', age: 20 }
        );
        assert.deepStrictEqual(
          parseValueByType('{"name":"cqq"}', DATA_TYPE_OBJECT),
          { name: 'cqq' }
        );
      });

      it('应该保持对象不变', () => {
        const obj = { name: 'test' };
        assert.strictEqual(parseValueByType(obj, DATA_TYPE_OBJECT), obj);

        const obj2 = { name: 'cqq' };
        assert.deepStrictEqual(parseValueByType(obj2, DATA_TYPE_OBJECT), { name: 'cqq' });
      });

      it('应该解析空对象', () => {
        assert.deepStrictEqual(parseValueByType('{}', DATA_TYPE_OBJECT), {});
        assert.deepStrictEqual(parseValueByType({}, DATA_TYPE_OBJECT), {});
      });
    });

    describe('无效输入返回 null', () => {
      const invalidCases = ['invalid', '{invalid}', 123, [], true, false, null];

      invalidCases.forEach(input => {
        it(`${JSON.stringify(input)} -> null`, () => {
          assert.strictEqual(parseValueByType(input, DATA_TYPE_OBJECT), null);
        });
      });
    });
  });

  describe('ARRAY 类型转换', () => {
    runTestCases([
      { input: '[1,2,3]', expected: [1, 2, 3] },
      { input: '["a","b"]', expected: ['a', 'b'] },
      { input: '[{"name":"test"}]', expected: [{ name: 'test' }] },
      { input: '[]', expected: [] },
    ], (input) => parseValueByType(input, DATA_TYPE_ARRAY), assert.deepStrictEqual);

    describe('无效输入返回空数组', () => {
      const invalidCases = ['invalid', '[invalid', '1,2,3', 123, {}, true, false, null];

      invalidCases.forEach(input => {
        it(`${JSON.stringify(input)} -> []`, () => {
          assert.deepStrictEqual(parseValueByType(input, DATA_TYPE_ARRAY), []);
        });
      });
    });
  });

  describe('边界情况', () => {
    it('应该处理大数字', () => {
      const bigNum = 9007199254740991;
      assert.strictEqual(parseValueByType(bigNum, DATA_TYPE_NUMBER), bigNum);
      assert.strictEqual(parseValueByType(String(bigNum), DATA_TYPE_NUMBER), bigNum);
    });

    it('应该处理特殊字符串', () => {
      assert.strictEqual(parseValueByType('NaN', DATA_TYPE_NUMBER), null);
      assert.strictEqual(parseValueByType('Infinity', DATA_TYPE_NUMBER), null);
      assert.strictEqual(parseValueByType('-Infinity', DATA_TYPE_NUMBER), null);
    });

    it('应该处理科学计数法数字', () => {
      assert.strictEqual(parseValueByType(1e10, DATA_TYPE_NUMBER), 10000000000);
      assert.strictEqual(parseValueByType('1e5', DATA_TYPE_NUMBER), null);
    });
  });

  describe('类型转换综合测试', () => {
    it('应该正确处理所有类型', () => {
      assert.strictEqual(parseValueByType('123', DATA_TYPE_STRING), '123');
      assert.strictEqual(parseValueByType('123', DATA_TYPE_NUMBER), 123);
      assert.strictEqual(parseValueByType('123', DATA_TYPE_INTEGER), 123);
      assert.strictEqual(parseValueByType('true', DATA_TYPE_BOOLEAN), true);
      assert.deepStrictEqual(parseValueByType('[1,2,3]', DATA_TYPE_ARRAY), [1, 2, 3]);
      assert.deepStrictEqual(parseValueByType('{"a":1}', DATA_TYPE_OBJECT), { a: 1 });
      assert.deepStrictEqual(parseValueByType('[1,2,3]', DATA_TYPE_JSON), [1, 2, 3]);
    });
  });
});

describe('toString', () => {
  runTestCases([
    { input: 'hello', expected: 'hello', desc: '保持字符串不变' },
    { input: '', expected: '', desc: '保持空字符串不变' },
    { input: 123, expected: '123', desc: '数字转字符串' },
    { input: 0, expected: '0', desc: '零转字符串' },
    { input: -456.78, expected: '-456.78', desc: '负数转字符串' },
    { input: true, expected: 'true', desc: 'true转字符串' },
    { input: false, expected: 'false', desc: 'false转字符串' },
    { input: null, expected: null, desc: 'null返回null' },
    { input: undefined, expected: null, desc: 'undefined返回null' },
  ], toString);

  it('应该转换数组为字符串', () => {
    assert.strictEqual(toString([1, 2, 3]), '1,2,3');
  });

  it('应该转换对象为字符串', () => {
    assert.strictEqual(toString({ a: 1 }), '[object Object]');
  });

  it('应该调用自定义 toString 方法', () => {
    const obj = {
      toString() {
        return 'custom string';
      },
    };
    assert.strictEqual(toString(obj), 'custom string');
  });
});

describe('toNumber', () => {
  describe('有效转换', () => {
    runTestCases([
      { input: '123', expected: 123 },
      { input: '0', expected: 0 },
      { input: '-456.78', expected: -456.78 },
      { input: '3.14', expected: 3.14 },
      { input: 123, expected: 123 },
      { input: 0, expected: 0 },
      { input: -456.78, expected: -456.78 },
    ], toNumber);
  });

  describe('无效转换返回 null', () => {
    const invalidCases = [
      'abc', '123abc', '', null, undefined, true, {}, [],
      Infinity, -Infinity, NaN, '1e3', '1.5e2',
    ];

    invalidCases.forEach(input => {
      it(`${JSON.stringify(input)} -> null`, () => {
        assert.strictEqual(toNumber(input), null);
      });
    });
  });
});

describe('toInteger', () => {
  describe('有效转换', () => {
    runTestCases([
      { input: '123', expected: 123 },
      { input: '0', expected: 0 },
      { input: '-456', expected: -456 },
      { input: 123, expected: 123 },
      { input: 0, expected: 0 },
      { input: -456, expected: -456 },
    ], toInteger);
  });

  describe('浮点数取整', () => {
    runTestCases([
      { input: 123.7, expected: 123 },
      { input: -456.9, expected: -456 },
      { input: 3.14, expected: 3 },
      { input: '123.45', expected: 123 },
      { input: '3.14', expected: 3 },
    ], toInteger);
  });

  describe('无效转换返回 null', () => {
    const invalidCases = ['abc', '', null, undefined, true, {}];

    invalidCases.forEach(input => {
      it(`${JSON.stringify(input)} -> null`, () => {
        assert.strictEqual(toInteger(input), null);
      });
    });
  });
});

describe('toBoolean', () => {
  runTestCases([
    { input: 'true', expected: true },
    { input: 'false', expected: false },
    { input: true, expected: true },
    { input: false, expected: false },
  ], toBoolean);

  describe('无效转换返回 null', () => {
    const invalidCases = ['yes', 'no', '1', '0', 1, 0, '', null, undefined];

    invalidCases.forEach(input => {
      it(`${JSON.stringify(input)} -> null`, () => {
        assert.strictEqual(toBoolean(input), null);
      });
    });
  });
});

describe('toArray', () => {
  runTestCases([
    { input: '[1,2,3]', expected: [1, 2, 3] },
    { input: '["a","b","c"]', expected: ['a', 'b', 'c'] },
    { input: '[]', expected: [] },
  ], toArray, assert.deepStrictEqual);

  it('应该保持数组不变', () => {
    const arr = [1, 2, 3];
    assert.deepStrictEqual(toArray(arr), arr);
  });

  describe('无效输入返回空数组', () => {
    const invalidCases = ['not json', '', '{a:1}', '{"a":1}', '123', '"string"', null, undefined];

    invalidCases.forEach(input => {
      it(`${JSON.stringify(input)} -> []`, () => {
        assert.deepStrictEqual(toArray(input), []);
      });
    });
  });
});

describe('toObject', () => {
  runTestCases([
    { input: '{"a":1,"b":2}', expected: { a: 1, b: 2 } },
    { input: '{}', expected: {} },
  ], toObject, assert.deepStrictEqual);

  it('应该保持普通对象不变', () => {
    const obj = { a: 1, b: 2 };
    assert.deepStrictEqual(toObject(obj), obj);
  });

  describe('无效输入返回 null', () => {
    const invalidCases = [
      'not json', '', '{a:1}', '[1,2,3]', '123', '"string"',
      null, undefined, [1, 2, 3], new Date(),
    ];

    invalidCases.forEach(input => {
      it(`${JSON.stringify(input)} -> null`, () => {
        assert.strictEqual(toObject(input), null);
      });
    });
  });
});

describe('toJson', () => {
  runTestCases([
    { input: '{"a":1}', expected: { a: 1 } },
    { input: '[1,2,3]', expected: [1, 2, 3] },
    { input: '123', expected: 123 },
    { input: '"string"', expected: 'string' },
    { input: 'true', expected: true },
    { input: 'null', expected: null },
  ], toJson, assert.deepStrictEqual);

  describe('无效输入返回 null', () => {
    const invalidCases = ['not json', '', '{a:1}', null, undefined];

    invalidCases.forEach(input => {
      it(`${JSON.stringify(input)} -> null`, () => {
        assert.strictEqual(toJson(input), null);
      });
    });
  });
});

describe('边界情况和特殊值', () => {
  it('应该处理科学计数法', () => {
    assert.strictEqual(toNumber('1e3'), null);
    assert.strictEqual(toNumber('1.5e2'), null);
  });

  it('应该拒绝带空格的数字字符串', () => {
    assert.strictEqual(toNumber(' 123 '), null);
  });

  it('应该处理嵌套 JSON', () => {
    const nested = '{"a":{"b":{"c":1}}}';
    assert.deepStrictEqual(toJson(nested), { a: { b: { c: 1 } } });
  });

  it('应该处理特殊数字值', () => {
    assert.strictEqual(toNumber('0.0'), null);
    assert.strictEqual(toNumber('-0'), null);
  });

  it('应该处理空数组和对象', () => {
    assert.deepStrictEqual(toArray('[]'), []);
    assert.deepStrictEqual(toObject('{}'), {});
  });

  it('应该保持已有类型不变', () => {
    const num = 123;
    assert.strictEqual(toNumber(num), num);

    const bool = true;
    assert.strictEqual(toBoolean(bool), bool);

    const arr = [1, 2, 3];
    assert.deepStrictEqual(toArray(arr), arr);

    const obj = { a: 1 };
    assert.deepStrictEqual(toObject(obj), obj);
  });
});
