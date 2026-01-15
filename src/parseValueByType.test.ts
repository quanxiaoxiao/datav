import * as assert from 'node:assert';
import { test, describe, it } from 'node:test';

import {
  parseValueByType,
  DATA_TYPE_NUMBER,
  DATA_TYPE_STRING,
  DATA_TYPE_BOOLEAN,
  DATA_TYPE_JSON,
  DATA_TYPE_ARRAY,
  DATA_TYPE_OBJECT,
  DATA_TYPE_INTEGER,
} from './parseValueByType.js';

test('parseValueByType invalid data type', () => {
  assert.throws(() => {
    parseValueByType('aaa', 'bbb');
  });
  assert.throws(() => {
    parseValueByType('aaa');
  });
});

test('parseValueByType with data value null', () => {
  assert.deepEqual(parseValueByType(null, 'array'), []);
  assert.equal(parseValueByType(null, 'object'), null);
  assert.equal(parseValueByType(null, 'string'), null);
  assert.equal(parseValueByType(null, 'number'), null);
  assert.equal(parseValueByType(null, 'integer'), null);
  assert.equal(parseValueByType(null, 'boolean'), null);
  assert.equal(parseValueByType(null, 'json'), null);
});

test('parseValueByType with string', () => {
  assert.equal(parseValueByType(1, 'string'), '1');
  assert.equal(parseValueByType(null, 'string'), null);
  assert.equal(parseValueByType(true, 'string'), 'true');
  assert.equal(parseValueByType(false, 'string'), 'false');
  assert.equal(parseValueByType(' 1', 'string'), ' 1');
  assert.equal(parseValueByType([1, 2, 3], 'string'), '1,2,3');
  assert.equal(parseValueByType({ name: 'cqq' }, 'string'), '[object Object]');
  assert.equal(parseValueByType({
    name: 'quan',
    toString: () => 'cqq',
  }, 'string'), 'cqq');
});

test('parseValueByType with integer', () => {
  assert.equal(parseValueByType(null, 'integer'), null);
  assert.equal(parseValueByType('', 'integer'), null);
  assert.equal(parseValueByType(true, 'integer'), null);
  assert.equal(parseValueByType(false, 'integer'), null);
  assert.equal(parseValueByType([], 'integer'), null);
  assert.equal(parseValueByType({}, 'integer'), null);
  assert.equal(parseValueByType('aaa', 'integer'), null);
  assert.equal(parseValueByType('1', 'integer'), 1);
  assert.equal(parseValueByType('01', 'integer'), null);
  assert.equal(parseValueByType(' 1', 'integer'), null);
  assert.equal(parseValueByType('1.1', 'integer'), 1);
  assert.equal(parseValueByType('-3.1', 'integer'), -3);
  assert.equal(parseValueByType(3.1, 'integer'), 3);
  assert.equal(parseValueByType(1, 'integer'), 1);
  assert.equal(parseValueByType(NaN, 'integer'), null);
});

test('parseValueByType with number', () => {
  assert.equal(parseValueByType('1', 'number'), 1);
  assert.equal(parseValueByType('01', 'number'), null);
  assert.equal(parseValueByType(true, 'number'), null);
  assert.equal(parseValueByType(false, 'number'), null);
  assert.equal(parseValueByType([], 'number'), null);
  assert.equal(parseValueByType({}, 'number'), null);
  assert.equal(parseValueByType('', 'number'), null);
  assert.equal(parseValueByType('a', 'number'), null);
  assert.equal(parseValueByType('1a', 'number'), null);
  assert.equal(parseValueByType('0', 'number'), 0);
  assert.equal(parseValueByType('-0', 'number'), null);
  assert.equal(parseValueByType('-1', 'number'), -1);
  assert.equal(parseValueByType('-1.5', 'number'), -1.5);
  assert.equal(parseValueByType('-2.5', 'number'), -2.5);
  assert.equal(parseValueByType('2.5', 'number'), 2.5);
  assert.equal(parseValueByType('2.5a', 'number'), null);
  assert.equal(parseValueByType('2.5.', 'number'), null);
  assert.equal(parseValueByType('2.5.8', 'number'), null);
  assert.equal(parseValueByType(1, 'number'), 1);
  assert(Number.isNaN(parseValueByType(NaN, 'number')));
});

test('parseValueByType with boolean', () => {
  assert.equal(parseValueByType('', 'boolean'), null);
  assert.equal(parseValueByType('false', 'boolean'), false);
  assert.equal(parseValueByType(' false', 'boolean'), null);
  assert.equal(parseValueByType('false ', 'boolean'), null);
  assert.equal(parseValueByType('true', 'boolean'), true);
  assert.equal(parseValueByType(' true', 'boolean'), null);
  assert.equal(parseValueByType('true ', 'boolean'), null);
  assert.equal(parseValueByType(true, 'boolean'), true);
  assert.equal(parseValueByType(false, 'boolean'), false);
  assert.equal(parseValueByType(1, 'boolean'), null);
  assert.equal(parseValueByType({}, 'boolean'), null);
  assert.equal(parseValueByType([], 'boolean'), null);
  assert.equal(parseValueByType('aaa', 'boolean'), null);
});

test('parseValueByType with json', () => {
  assert.equal(parseValueByType('1', 'json'), 1);
  assert.equal(parseValueByType(' 1', 'json'), 1);
  assert.equal(parseValueByType('"1"', 'json'), '1');
  assert.equal(parseValueByType('\'1\'', 'json'), null);
  assert.equal(parseValueByType('null', 'json'), null);
  assert.equal(parseValueByType('aa', 'json'), null);
  assert.deepEqual(parseValueByType('{}', 'json'), {});
  assert.deepEqual(parseValueByType('{fail}', 'json'), null);
  assert.deepEqual(parseValueByType('{"name":"cqq"}', 'json'), { name: 'cqq' });
  assert.deepEqual(parseValueByType('[]', 'json'), []);
  assert.deepEqual(parseValueByType([], 'json'), []);
  assert.deepEqual(parseValueByType({}, 'json'), {});
  assert.deepEqual(parseValueByType(2, 'json'), null);
});

test('parseValueByType with array', () => {
  assert.deepEqual(parseValueByType(null, 'array'), []);
  assert.deepEqual(parseValueByType('[]', 'array'), []);
  assert.deepEqual(parseValueByType('[xxx]', 'array'), []);
  assert.deepEqual(parseValueByType([], 'array'), []);
  assert.deepEqual(parseValueByType([1, 2, 3], 'array'), [1, 2, 3]);
  assert.deepEqual(parseValueByType(1, 'array'), []);
  assert.deepEqual(parseValueByType({}, 'array'), []);
  assert.deepEqual(parseValueByType('1', 'array'), []);
  assert.deepEqual(parseValueByType('{}', 'array'), []);
  assert.deepEqual(parseValueByType(['12345'], 'array'), ['12345']);
  assert.deepEqual(parseValueByType(true, 'array'), []);
  assert.deepEqual(parseValueByType(false, 'array'), []);
  assert.deepEqual(parseValueByType([{ name: 'cqq' }], 'array'), [{ name: 'cqq' }]);
  assert.deepEqual(parseValueByType(JSON.stringify([{ name: 'cqq' }]), 'array'), [{ name: 'cqq' }]);
});

test('parseValueByType with object', () => {
  assert.equal(parseValueByType(null, 'object'), null);
  assert.equal(parseValueByType(1, 'object'), null);
  assert.equal(parseValueByType('aa', 'object'), null);
  assert.equal(parseValueByType('1', 'object'), null);
  assert.equal(parseValueByType(JSON.stringify('aa'), 'object'), null);
  assert.equal(parseValueByType(true, 'object'), null);
  assert.equal(parseValueByType('true', 'object'), null);
  assert.equal(parseValueByType('false', 'object'), null);
  assert.equal(parseValueByType(false, 'object'), null);
  assert.equal(parseValueByType([], 'object'), null);
  assert.equal(parseValueByType(JSON.stringify([]), 'object'), null);
  assert.deepEqual(parseValueByType({ name: 'cqq' }, 'object'), { name: 'cqq' });
  assert.deepEqual(parseValueByType(JSON.stringify({ name: 'cqq' }), 'object'), { name: 'cqq' });
  assert.deepEqual(parseValueByType('{fail}', 'object'), null);
});

describe('parseValueByType', () => {
  describe('参数验证', () => {
    it('应该在类型参数为空时抛出错误', () => {
      assert.throws(
        () => parseValueByType('test', null as any),
        /data type is empty/
      );
    });

    it('应该在类型参数无效时抛出错误', () => {
      assert.throws(
        () => parseValueByType('test', 'invalid' as any),
        /invalid data type/
      );
    });
  });

  describe('NULL 和 UNDEFINED 处理', () => {
    it('应该将 null 转换为 null (除数组外)', () => {
      assert.strictEqual(parseValueByType(null, DATA_TYPE_STRING), null);
      assert.strictEqual(parseValueByType(null, DATA_TYPE_NUMBER), null);
      assert.strictEqual(parseValueByType(null, DATA_TYPE_OBJECT), null);
    });

    it('应该将 null 转换为空数组 (数组类型)', () => {
      assert.deepStrictEqual(parseValueByType(null, DATA_TYPE_ARRAY), []);
    });

    it('应该将 undefined 转换为 null (除数组外)', () => {
      assert.strictEqual(parseValueByType(undefined, DATA_TYPE_STRING), null);
      assert.strictEqual(parseValueByType(undefined, DATA_TYPE_NUMBER), null);
    });

    it('应该将 undefined 转换为空数组 (数组类型)', () => {
      assert.deepStrictEqual(parseValueByType(undefined, DATA_TYPE_ARRAY), []);
    });
  });

  describe('STRING 类型转换', () => {
    it('应该保持字符串不变', () => {
      assert.strictEqual(parseValueByType('hello', DATA_TYPE_STRING), 'hello');
      assert.strictEqual(parseValueByType('', DATA_TYPE_STRING), '');
    });

    it('应该将数字转换为字符串', () => {
      assert.strictEqual(parseValueByType(123, DATA_TYPE_STRING), '123');
      assert.strictEqual(parseValueByType(0, DATA_TYPE_STRING), '0');
    });

    it('应该将布尔值转换为字符串', () => {
      assert.strictEqual(parseValueByType(true, DATA_TYPE_STRING), 'true');
      assert.strictEqual(parseValueByType(false, DATA_TYPE_STRING), 'false');
    });

    it('应该将对象转换为 JSON 字符串', () => {
      const obj = { name: 'test' };
      assert.strictEqual(parseValueByType(obj, DATA_TYPE_STRING), '{"name":"test"}');
    });

    it('应该将数组转换为 JSON 字符串', () => {
      const arr = [1, 2, 3];
      assert.strictEqual(parseValueByType(arr, DATA_TYPE_STRING), '[1,2,3]');
    });
  });

  describe('INTEGER 类型转换', () => {
    it('应该将字符串数字转换为整数', () => {
      assert.strictEqual(parseValueByType('123', DATA_TYPE_INTEGER), 123);
      assert.strictEqual(parseValueByType('0', DATA_TYPE_INTEGER), 0);
      assert.strictEqual(parseValueByType('-456', DATA_TYPE_INTEGER), -456);
    });

    it('应该将浮点数向下取整', () => {
      assert.strictEqual(parseValueByType(123.7, DATA_TYPE_INTEGER), 123);
      assert.strictEqual(parseValueByType('99.9', DATA_TYPE_INTEGER), 99);
      assert.strictEqual(parseValueByType(-5.5, DATA_TYPE_INTEGER), -5);
    });

    it('应该将空字符串转换为 null', () => {
      assert.strictEqual(parseValueByType('', DATA_TYPE_INTEGER), null);
    });

    it('应该将非法数字字符串转换为 null', () => {
      assert.strictEqual(parseValueByType('abc', DATA_TYPE_INTEGER), null);
      assert.strictEqual(parseValueByType('12abc', DATA_TYPE_INTEGER), null);
      assert.strictEqual(parseValueByType('1.2.3', DATA_TYPE_INTEGER), null);
    });

    it('应该将对象和数组转换为 null', () => {
      assert.strictEqual(parseValueByType({}, DATA_TYPE_INTEGER), null);
      assert.strictEqual(parseValueByType([], DATA_TYPE_INTEGER), null);
    });

    it('应该保持已存在的数字类型', () => {
      assert.strictEqual(parseValueByType(42, DATA_TYPE_INTEGER), 42);
    });
  });

  describe('NUMBER 类型转换', () => {
    it('应该将字符串数字转换为数字', () => {
      assert.strictEqual(parseValueByType('123', DATA_TYPE_NUMBER), 123);
      assert.strictEqual(parseValueByType('123.45', DATA_TYPE_NUMBER), 123.45);
      assert.strictEqual(parseValueByType('-67.89', DATA_TYPE_NUMBER), -67.89);
    });

    it('应该保持数字不变', () => {
      assert.strictEqual(parseValueByType(42, DATA_TYPE_NUMBER), 42);
      assert.strictEqual(parseValueByType(3.14, DATA_TYPE_NUMBER), 3.14);
    });

    it('应该将空字符串转换为 null', () => {
      assert.strictEqual(parseValueByType('', DATA_TYPE_NUMBER), null);
    });

    it('应该将非法数字字符串转换为 null', () => {
      assert.strictEqual(parseValueByType('abc', DATA_TYPE_NUMBER), null);
      assert.strictEqual(parseValueByType('12abc', DATA_TYPE_NUMBER), null);
    });

    it('应该将非数字类型转换为 null', () => {
      assert.strictEqual(parseValueByType({}, DATA_TYPE_NUMBER), null);
      assert.strictEqual(parseValueByType([], DATA_TYPE_NUMBER), null);
      assert.strictEqual(parseValueByType(true, DATA_TYPE_NUMBER), null);
    });
  });

  describe('BOOLEAN 类型转换', () => {
    it('应该将 "true" 转换为 true', () => {
      assert.strictEqual(parseValueByType('true', DATA_TYPE_BOOLEAN), true);
    });

    it('应该将 "false" 转换为 false', () => {
      assert.strictEqual(parseValueByType('false', DATA_TYPE_BOOLEAN), false);
    });

    it('应该将其他字符串转换为 null', () => {
      assert.strictEqual(parseValueByType('yes', DATA_TYPE_BOOLEAN), null);
      assert.strictEqual(parseValueByType('no', DATA_TYPE_BOOLEAN), null);
      assert.strictEqual(parseValueByType('1', DATA_TYPE_BOOLEAN), null);
      assert.strictEqual(parseValueByType('0', DATA_TYPE_BOOLEAN), null);
      assert.strictEqual(parseValueByType('', DATA_TYPE_BOOLEAN), null);
    });

    it('应该保持布尔值不变', () => {
      assert.strictEqual(parseValueByType(true, DATA_TYPE_BOOLEAN), true);
      assert.strictEqual(parseValueByType(false, DATA_TYPE_BOOLEAN), false);
    });

    it('应该将非布尔类型转换为 null', () => {
      assert.strictEqual(parseValueByType(1, DATA_TYPE_BOOLEAN), null);
      assert.strictEqual(parseValueByType(0, DATA_TYPE_BOOLEAN), null);
    });
  });

  describe('JSON 类型转换', () => {
    it('应该解析有效的 JSON 字符串', () => {
      assert.deepStrictEqual(
        parseValueByType('{"name":"test","age":20}', DATA_TYPE_JSON),
        { name: 'test', age: 20 }
      );
    });

    it('应该解析 JSON 数组', () => {
      assert.deepStrictEqual(
        parseValueByType('[1,2,3]', DATA_TYPE_JSON),
        [1, 2, 3]
      );
    });

    it('应该解析 JSON 基本类型', () => {
      assert.strictEqual(parseValueByType('123', DATA_TYPE_JSON), 123);
      assert.strictEqual(parseValueByType('"text"', DATA_TYPE_JSON), 'text');
      assert.strictEqual(parseValueByType('true', DATA_TYPE_JSON), true);
      assert.strictEqual(parseValueByType('null', DATA_TYPE_JSON), null);
    });

    it('应该将无效的 JSON 字符串转换为 null', () => {
      assert.strictEqual(parseValueByType('invalid', DATA_TYPE_JSON), null);
      assert.strictEqual(parseValueByType('{invalid}', DATA_TYPE_JSON), null);
    });

    it('应该将非字符串类型转换为 null', () => {
      assert.strictEqual(parseValueByType(123, DATA_TYPE_JSON), null);
      assert.strictEqual(parseValueByType({}, DATA_TYPE_JSON), null);
    });
  });

  describe('OBJECT 类型转换', () => {
    it('应该解析有效的 JSON 对象字符串', () => {
      assert.deepStrictEqual(
        parseValueByType('{"name":"test","age":20}', DATA_TYPE_OBJECT),
        { name: 'test', age: 20 }
      );
    });

    it('应该将 JSON 数组字符串转换为 null', () => {
      assert.strictEqual(parseValueByType('[1,2,3]', DATA_TYPE_OBJECT), null);
    });

    it('应该将 JSON 基本类型字符串转换为 null', () => {
      assert.strictEqual(parseValueByType('123', DATA_TYPE_OBJECT), null);
      assert.strictEqual(parseValueByType('"text"', DATA_TYPE_OBJECT), null);
      assert.strictEqual(parseValueByType('true', DATA_TYPE_OBJECT), null);
    });

    it('应该将无效的 JSON 字符串转换为 null', () => {
      assert.strictEqual(parseValueByType('invalid', DATA_TYPE_OBJECT), null);
      assert.strictEqual(parseValueByType('{invalid}', DATA_TYPE_OBJECT), null);
    });

    it('应该保持普通对象不变', () => {
      const obj = { name: 'test' };
      assert.strictEqual(parseValueByType(obj, DATA_TYPE_OBJECT), obj);
    });

    it('应该将数组转换为 null', () => {
      assert.strictEqual(parseValueByType([1, 2, 3], DATA_TYPE_OBJECT), null);
    });

    it('应该将非对象类型转换为 null', () => {
      assert.strictEqual(parseValueByType(123, DATA_TYPE_OBJECT), null);
      assert.strictEqual(parseValueByType('string', DATA_TYPE_OBJECT), null);
    });
  });

  describe('ARRAY 类型转换', () => {
    it('应该解析有效的 JSON 数组字符串', () => {
      assert.deepStrictEqual(
        parseValueByType('[1,2,3]', DATA_TYPE_ARRAY),
        [1, 2, 3]
      );
      assert.deepStrictEqual(
        parseValueByType('[{"name":"a"},{"name":"b"}]', DATA_TYPE_ARRAY),
        [{ name: 'a' }, { name: 'b' }]
      );
    });

    it('应该将空数组字符串解析为空数组', () => {
      assert.deepStrictEqual(parseValueByType('[]', DATA_TYPE_ARRAY), []);
    });

    it('应该将 JSON 对象字符串转换为空数组', () => {
      assert.deepStrictEqual(parseValueByType('{"name":"test"}', DATA_TYPE_ARRAY), []);
    });

    it('应该将 JSON 基本类型字符串转换为空数组', () => {
      assert.deepStrictEqual(parseValueByType('123', DATA_TYPE_ARRAY), []);
      assert.deepStrictEqual(parseValueByType('"text"', DATA_TYPE_ARRAY), []);
    });

    it('应该将无效的 JSON 字符串转换为空数组', () => {
      assert.deepStrictEqual(parseValueByType('invalid', DATA_TYPE_ARRAY), []);
      assert.deepStrictEqual(parseValueByType('[invalid]', DATA_TYPE_ARRAY), []);
    });

    it('应该保持数组不变', () => {
      const arr = [1, 2, 3];
      assert.strictEqual(parseValueByType(arr, DATA_TYPE_ARRAY), arr);
    });

    it('应该将非数组对象转换为空数组', () => {
      assert.deepStrictEqual(parseValueByType({ name: 'test' }, DATA_TYPE_ARRAY), []);
    });

    it('应该将基本类型转换为空数组', () => {
      assert.deepStrictEqual(parseValueByType(123, DATA_TYPE_ARRAY), []);
      assert.deepStrictEqual(parseValueByType(true, DATA_TYPE_ARRAY), []);
    });
  });

  describe('边界情况', () => {
    it('应该处理科学计数法', () => {
      assert.strictEqual(parseValueByType('1e3', DATA_TYPE_NUMBER), 1000);
      assert.strictEqual(parseValueByType(1e3, DATA_TYPE_INTEGER), 1000);
    });

    it('应该处理负零', () => {
      assert.strictEqual(parseValueByType(-0, DATA_TYPE_NUMBER), -0);
      assert.strictEqual(parseValueByType('-0', DATA_TYPE_NUMBER), -0);
    });

    it('应该处理大数字', () => {
      const bigNum = 9007199254740991; // Number.MAX_SAFE_INTEGER
      assert.strictEqual(parseValueByType(bigNum, DATA_TYPE_NUMBER), bigNum);
      assert.strictEqual(parseValueByType(String(bigNum), DATA_TYPE_NUMBER), bigNum);
    });

    it('应该处理嵌套的 JSON 结构', () => {
      const nested = '{"user":{"name":"test","age":20},"items":[1,2,3]}';
      assert.deepStrictEqual(
        parseValueByType(nested, DATA_TYPE_JSON),
        { user: { name: 'test', age: 20 }, items: [1, 2, 3] }
      );
    });

    it('应该处理空对象和空数组', () => {
      assert.deepStrictEqual(parseValueByType('{}', DATA_TYPE_OBJECT), {});
      assert.deepStrictEqual(parseValueByType('[]', DATA_TYPE_ARRAY), []);
      assert.deepStrictEqual(parseValueByType({}, DATA_TYPE_OBJECT), {});
      assert.deepStrictEqual(parseValueByType([], DATA_TYPE_ARRAY), []);
    });

    it('应该处理特殊字符串', () => {
      assert.strictEqual(parseValueByType('NaN', DATA_TYPE_NUMBER), null);
      assert.strictEqual(parseValueByType('Infinity', DATA_TYPE_NUMBER), null);
      assert.strictEqual(parseValueByType('-Infinity', DATA_TYPE_NUMBER), null);
    });
  });
});

