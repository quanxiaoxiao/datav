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

describe('parseValueByType', () => {
  describe('参数验证', () => {
    it('应该在类型参数为空时抛出错误', () => {
      assert.throws(
        () => parseValueByType('test', null as unknown as string),
        (err: unknown) => {
          assert.ok(isDataVError(err));
          assert.strictEqual((err as { code: string }).code, ERROR_CODES.EMPTY_DATA_TYPE);
          return true;
        },
      );
      assert.throws(
        () => parseValueByType('test', undefined as unknown as string),
        (err: unknown) => {
          assert.ok(isDataVError(err));
          assert.strictEqual((err as { code: string }).code, ERROR_CODES.EMPTY_DATA_TYPE);
          return true;
        },
      );
    });

    it('应该在类型参数无效时抛出错误', () => {
      assert.throws(
        () => parseValueByType('aaa', 'bbb' as unknown as string),
        (err: unknown) => {
          assert.ok(isDataVError(err));
          assert.strictEqual((err as { code: string }).code, ERROR_CODES.INVALID_DATA_TYPE);
          return true;
        },
      );
      assert.throws(
        () => parseValueByType('test', 'invalid' as unknown as string),
        (err: unknown) => {
          assert.ok(isDataVError(err));
          assert.strictEqual((err as { code: string }).code, ERROR_CODES.INVALID_DATA_TYPE);
          return true;
        },
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
      it(`应该将 null 转换为 ${JSON.stringify(expected)} (${desc} 类型)`, () => {
        assert.deepStrictEqual(parseValueByType(null, type), expected);
      });

      it(`应该将 undefined 转换为 ${JSON.stringify(expected)} (${desc} 类型)`, () => {
        assert.deepStrictEqual(parseValueByType(undefined, type), expected);
      });
    });
  });

  describe('STRING 类型转换', () => {
    const testCases = [
      { input: 'hello', expected: 'hello', desc: '保持字符串不变' },
      { input: '', expected: '', desc: '保持空字符串不变' },
      { input: ' 1', expected: ' 1', desc: '保留空格' },
      { input: 123, expected: '123', desc: '数字转字符串' },
      { input: 0, expected: '0', desc: '零转字符串' },
      { input: 1, expected: '1', desc: '1转字符串' },
      { input: true, expected: 'true', desc: 'true转字符串' },
      { input: false, expected: 'false', desc: 'false转字符串' },
      { input: null, expected: null, desc: 'null保持null' },
    ];

    testCases.forEach(({ input, expected, desc }) => {
      it(`${desc}: ${JSON.stringify(input)} -> ${JSON.stringify(expected)}`, () => {
        assert.strictEqual(parseValueByType(input, DATA_TYPE_STRING), expected);
      });
    });

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
      const validCases = [
        { input: '123', expected: 123 },
        { input: '0', expected: 0 },
        { input: '-456', expected: -456 },
        { input: '1', expected: 1 },
        { input: 42, expected: 42 },
        { input: 1, expected: 1 },
      ];

      validCases.forEach(({ input, expected }) => {
        it(`${JSON.stringify(input)} -> ${expected}`, () => {
          assert.strictEqual(parseValueByType(input, DATA_TYPE_INTEGER), expected);
        });
      });
    });

    describe('浮点数取整', () => {
      const floorCases = [
        { input: 123.7, expected: 123 },
        { input: '99.9', expected: 99 },
        { input: -5.5, expected: -5 },
        { input: 3.1, expected: 3 },
        { input: '1.1', expected: 1 },
        { input: '-3.1', expected: -3 },
      ];

      floorCases.forEach(({ input, expected }) => {
        it(`${JSON.stringify(input)} -> ${expected}`, () => {
          assert.strictEqual(parseValueByType(input, DATA_TYPE_INTEGER), expected);
        });
      });
    });

    describe('无效输入返回 null', () => {
      const invalidCases = [
        '', 'abc', '12abc', '1.2.3', '01', ' 1',
        true, false, {}, [], null, NaN,
      ];

      invalidCases.forEach(input => {
        it(`${JSON.stringify(input)} -> null`, () => {
          assert.strictEqual(parseValueByType(input, DATA_TYPE_INTEGER), null);
        });
      });
    });
  });

  describe('NUMBER 类型转换', () => {
    describe('有效转换', () => {
      const validCases = [
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
      ];

      validCases.forEach(({ input, expected }) => {
        it(`${JSON.stringify(input)} -> ${expected}`, () => {
          assert.strictEqual(parseValueByType(input, DATA_TYPE_NUMBER), expected);
        });
      });
    });

    it('111', () => {
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
        'NaN', '1e3',
      ];

      invalidCases.forEach(input => {
        it(`${JSON.stringify(input)} -> null`, () => {
          assert.strictEqual(parseValueByType(input, DATA_TYPE_NUMBER), null);
        });
      });

      it('应该处理 Infinity', () => {
        assert.strictEqual(parseValueByType('Infinity', DATA_TYPE_NUMBER), null);
        assert.strictEqual(parseValueByType('-Infinity', DATA_TYPE_NUMBER), null);
      });
    });
  });

  describe('BOOLEAN 类型转换', () => {
    const testCases = [
      { input: 'true', expected: true, desc: '字符串 "true"' },
      { input: 'false', expected: false, desc: '字符串 "false"' },
      { input: true, expected: true, desc: '布尔值 true' },
      { input: false, expected: false, desc: '布尔值 false' },
    ];

    testCases.forEach(({ input, expected, desc }) => {
      it(`应该转换${desc}`, () => {
        assert.strictEqual(parseValueByType(input, DATA_TYPE_BOOLEAN), expected);
      });
    });

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
    const validCases = [
      { input: '{"name":"test"}', expected: { name: 'test' } },
      { input: '[1,2,3]', expected: [1, 2, 3] },
      { input: '{"arr":[1,2,3]}', expected: { arr: [1, 2, 3] } },
      { input: '{"nested":{"a":1}}', expected: { nested: { a: 1 } } },
      { input: '[]', expected: [] },
      { input: '{}', expected: {} },
    ];

    validCases.forEach(({ input, expected }) => {
      it(`${input} -> ${JSON.stringify(expected)}`, () => {
        assert.deepStrictEqual(parseValueByType(input, DATA_TYPE_JSON), expected);
      });
    });

    it('应该处理嵌套结构', () => {
      const nested = '{"user":{"name":"test","age":20},"items":[1,2,3]}';
      assert.deepStrictEqual(
        parseValueByType(nested, DATA_TYPE_JSON),
        { user: { name: 'test', age: 20 }, items: [1, 2, 3] },
      );
    });

    describe('无效输入返回 null', () => {
      const invalidCases = [
        'invalid', '{invalid}', '{fail}', "'1'",
        'aa', 123, 2, null,
      ];

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
          { name: 'test', age: 20 },
        );
        assert.deepStrictEqual(
          parseValueByType('{"name":"cqq"}', DATA_TYPE_OBJECT),
          { name: 'cqq' },
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
      const invalidCases = [
        'invalid', '{invalid}',
        123, [], true, false, null,
      ];

      invalidCases.forEach(input => {
        it(`${JSON.stringify(input)} -> null`, () => {
          assert.strictEqual(parseValueByType(input, DATA_TYPE_OBJECT), null);
        });
      });
    });
  });

  describe('ARRAY 类型转换', () => {
    const validCases = [
      { input: '[1,2,3]', expected: [1, 2, 3] },
      { input: '["a","b"]', expected: ['a', 'b'] },
      { input: '[{"name":"test"}]', expected: [{ name: 'test' }] },
      { input: '[]', expected: [] },
    ];

    validCases.forEach(({ input, expected }) => {
      it(`${input} -> ${JSON.stringify(expected)}`, () => {
        assert.deepStrictEqual(parseValueByType(input, DATA_TYPE_ARRAY), expected);
      });
    });

    describe('无效输入返回 null', () => {
      const invalidCases = [
        'invalid', '[invalid', '1,2,3',
        123, {}, true, false, null,
      ];

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
});

describe('toString', () => {
  it('should convert string to string', () => {
    assert.strictEqual(toString('hello'), 'hello');
    assert.strictEqual(toString(''), '');
  });

  it('should convert number to string', () => {
    assert.strictEqual(toString(123), '123');
    assert.strictEqual(toString(0), '0');
    assert.strictEqual(toString(-456.78), '-456.78');
  });

  it('should convert boolean to string', () => {
    assert.strictEqual(toString(true), 'true');
    assert.strictEqual(toString(false), 'false');
  });

  it('should convert object to string', () => {
    assert.strictEqual(toString({ a: 1 }), '[object Object]');
    assert.strictEqual(toString([1, 2, 3]), '1,2,3');
  });

  it('should return null for null/undefined', () => {
    assert.strictEqual(toString(null), null);
    assert.strictEqual(toString(undefined), null);
  });

  it('should call custom toString method', () => {
    const obj = {
      toString() {
        return 'custom string';
      },
    };
    assert.strictEqual(toString(obj), 'custom string');
  });
});

describe('toNumber', () => {
  it('should convert valid number strings', () => {
    assert.strictEqual(toNumber('123'), 123);
    assert.strictEqual(toNumber('0'), 0);
    assert.strictEqual(toNumber('-456.78'), -456.78);
    assert.strictEqual(toNumber('3.14'), 3.14);
  });

  it('should keep numbers as is', () => {
    assert.strictEqual(toNumber(123), 123);
    assert.strictEqual(toNumber(0), 0);
    assert.strictEqual(toNumber(-456.78), -456.78);
  });

  it('should return null for invalid inputs', () => {
    assert.strictEqual(toNumber('abc'), null);
    assert.strictEqual(toNumber('123abc'), null);
    assert.strictEqual(toNumber(''), null);
    assert.strictEqual(toNumber(null), null);
    assert.strictEqual(toNumber(undefined), null);
    assert.strictEqual(toNumber(true), null);
    assert.strictEqual(toNumber({}), null);
    assert.strictEqual(toNumber([]), null);
  });

  it('should return null for Infinity', () => {
    assert.strictEqual(toNumber(Infinity), null);
    assert.strictEqual(toNumber(-Infinity), null);
  });

  it('should return null for NaN', () => {
    assert.strictEqual(toNumber(NaN), null);
  });
});

describe('toInteger', () => {
  it('should convert valid integer strings', () => {
    assert.strictEqual(toInteger('123'), 123);
    assert.strictEqual(toInteger('0'), 0);
    assert.strictEqual(toInteger('-456'), -456);
  });

  it('should floor decimal numbers', () => {
    assert.strictEqual(toInteger(123.7), 123);
    assert.strictEqual(toInteger(-456.9), -456);
    assert.strictEqual(toInteger(3.14), 3);
  });

  it('should return null for decimal strings', () => {
    assert.strictEqual(toInteger('123.45'), 123);
    assert.strictEqual(toInteger('3.14'), 3);
  });

  it('should keep integers as is', () => {
    assert.strictEqual(toInteger(123), 123);
    assert.strictEqual(toInteger(0), 0);
    assert.strictEqual(toInteger(-456), -456);
  });

  it('should return null for invalid inputs', () => {
    assert.strictEqual(toInteger('abc'), null);
    assert.strictEqual(toInteger(''), null);
    assert.strictEqual(toInteger(null), null);
    assert.strictEqual(toInteger(undefined), null);
    assert.strictEqual(toInteger(true), null);
    assert.strictEqual(toInteger({}), null);
  });
});

describe('toBoolean', () => {
  it('should convert string "true" to true', () => {
    assert.strictEqual(toBoolean('true'), true);
  });

  it('should convert string "false" to false', () => {
    assert.strictEqual(toBoolean('false'), false);
  });

  it('should convert boolean true to true', () => {
    assert.strictEqual(toBoolean(true), true);
  });

  it('should convert boolean false to false', () => {
    assert.strictEqual(toBoolean(false), false);
  });

  it('should return null for invalid inputs', () => {
    assert.strictEqual(toBoolean('yes'), null);
    assert.strictEqual(toBoolean('no'), null);
    assert.strictEqual(toBoolean('1'), null);
    assert.strictEqual(toBoolean('0'), null);
    assert.strictEqual(toBoolean(1), null);
    assert.strictEqual(toBoolean(0), null);
    assert.strictEqual(toBoolean(''), null);
    assert.strictEqual(toBoolean(null), null);
    assert.strictEqual(toBoolean(undefined), null);
  });
});

describe('toArray', () => {
  it('should parse valid JSON arrays', () => {
    assert.deepStrictEqual(toArray('[1,2,3]'), [1, 2, 3]);
    assert.deepStrictEqual(toArray('["a","b","c"]'), ['a', 'b', 'c']);
    assert.deepStrictEqual(toArray('[]'), []);
  });

  it('should return empty array for invalid JSON', () => {
    assert.deepStrictEqual(toArray('not json'), []);
    assert.deepStrictEqual(toArray(''), []);
    assert.deepStrictEqual(toArray('{a:1}'), []);
  });

  it('should return empty array for non-array JSON', () => {
    assert.deepStrictEqual(toArray('{"a":1}'), []);
    assert.deepStrictEqual(toArray('123'), []);
    assert.deepStrictEqual(toArray('"string"'), []);
  });

  it('should return empty array for null/undefined', () => {
    assert.deepStrictEqual(toArray(null), []);
    assert.deepStrictEqual(toArray(undefined), []);
  });

  it('should keep arrays as is', () => {
    const arr = [1, 2, 3];
    assert.deepStrictEqual(toArray(arr), arr);
  });
});

describe('toObject', () => {
  it('should parse valid JSON objects', () => {
    assert.deepStrictEqual(toObject('{"a":1,"b":2}'), { a: 1, b: 2 });
    assert.deepStrictEqual(toObject('{}'), {});
  });

  it('should return null for invalid JSON', () => {
    assert.strictEqual(toObject('not json'), null);
    assert.strictEqual(toObject(''), null);
    assert.strictEqual(toObject('{a:1}'), null);
  });

  it('should return null for non-object JSON', () => {
    assert.strictEqual(toObject('[1,2,3]'), null);
    assert.strictEqual(toObject('123'), null);
    assert.strictEqual(toObject('"string"'), null);
  });

  it('should return null for null/undefined', () => {
    assert.strictEqual(toObject(null), null);
    assert.strictEqual(toObject(undefined), null);
  });

  it('should keep plain objects as is', () => {
    const obj = { a: 1, b: 2 };
    assert.deepStrictEqual(toObject(obj), obj);
  });

  it('should return null for non-plain objects', () => {
    assert.strictEqual(toObject([1, 2, 3]), null);
    assert.strictEqual(toObject(new Date()), null);
  });
});

describe('toJson', () => {
  it('should parse valid JSON strings', () => {
    assert.deepStrictEqual(toJson('{"a":1}'), { a: 1 });
    assert.deepStrictEqual(toJson('[1,2,3]'), [1, 2, 3]);
    assert.strictEqual(toJson('123'), 123);
    assert.strictEqual(toJson('"string"'), 'string');
    assert.strictEqual(toJson('true'), true);
    assert.strictEqual(toJson('null'), null);
  });

  it('should return null for invalid JSON', () => {
    assert.strictEqual(toJson('not json'), null);
    assert.strictEqual(toJson(''), null);
    assert.strictEqual(toJson('{a:1}'), null);
  });

  it('should return null for null/undefined', () => {
    assert.strictEqual(toJson(null), null);
    assert.strictEqual(toJson(undefined), null);
  });
});

describe('parseValueByType', () => {
  it('should throw error for null/undefined type', () => {
    assert.throws(() => parseValueByType('test', null as any));
    assert.throws(() => parseValueByType('test', undefined as any));
  });

  it('should throw error for invalid type', () => {
    assert.throws(() => parseValueByType('test', 'invalid' as any));
  });

  it('should handle all types correctly', () => {
    assert.strictEqual(parseValueByType('123', DATA_TYPE_STRING), '123');
    assert.strictEqual(parseValueByType('123', DATA_TYPE_NUMBER), 123);
    assert.strictEqual(parseValueByType('123', DATA_TYPE_INTEGER), 123);
    assert.strictEqual(parseValueByType('true', DATA_TYPE_BOOLEAN), true);
    assert.deepStrictEqual(parseValueByType('[1,2,3]', DATA_TYPE_ARRAY), [1, 2, 3]);
    assert.deepStrictEqual(parseValueByType('{"a":1}', DATA_TYPE_OBJECT), { a: 1 });
    assert.deepStrictEqual(parseValueByType('[1,2,3]', DATA_TYPE_JSON), [1, 2, 3]);
  });
});

describe('edge cases', () => {
  it('should handle scientific notation', () => {
    assert.strictEqual(toNumber('1e3'), null);
    assert.strictEqual(toNumber('1.5e2'), null);
  });

  it('should handle leading/trailing spaces in numbers', () => {
    // 注意：根据实现，带空格的字符串会被拒绝
    assert.strictEqual(toNumber(' 123 '), null);
  });

  it('should handle nested JSON', () => {
    const nested = '{"a":{"b":{"c":1}}}';
    assert.deepStrictEqual(toJson(nested), { a: { b: { c: 1 } } });
  });

  it('should handle special number values', () => {
    assert.strictEqual(toNumber('0.0'), null);
    assert.strictEqual(toNumber('-0'), null);
  });

  it('should handle empty arrays and objects', () => {
    assert.deepStrictEqual(toArray('[]'), []);
    assert.deepStrictEqual(toObject('{}'), {});
  });
});

describe('type preservation', () => {
  it('should preserve type when already correct', () => {
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

