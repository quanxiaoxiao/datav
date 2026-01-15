import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { createArrayAccessor } from './createArrayAccessor.js';

describe('createArrayAccessor', () => {
  const testArray = ['a', 'b', 'c', 'd', 'e'];

  describe('数字索引访问', () => {
    it('应该返回正确的数组元素 - 正数索引', () => {
      const accessor = createArrayAccessor(0);
      assert.strictEqual(accessor(testArray), 'a');

      const accessor2 = createArrayAccessor(2);
      assert.strictEqual(accessor2(testArray), 'c');

      const accessor4 = createArrayAccessor(4);
      assert.strictEqual(accessor4(testArray), 'e');
    });

    it('应该支持负数索引', () => {
      const accessor = createArrayAccessor(-1);
      assert.strictEqual(accessor(testArray), 'e');

      const accessor2 = createArrayAccessor(-2);
      assert.strictEqual(accessor2(testArray), 'd');

      const accessor5 = createArrayAccessor(-5);
      assert.strictEqual(accessor5(testArray), 'a');
    });

    it('应该处理索引越界的情况 - 正数', () => {
      const accessor = createArrayAccessor(10);
      assert.strictEqual(accessor(testArray), null);

      const accessor2 = createArrayAccessor(5);
      assert.strictEqual(accessor2(testArray), null);
    });

    it('应该处理索引越界的情况 - 负数', () => {
      const accessor = createArrayAccessor(-10);
      assert.strictEqual(accessor(testArray), null);

      const accessor2 = createArrayAccessor(-6);
      assert.strictEqual(accessor2(testArray), null);
    });

    it('应该拒绝浮点数索引', () => {
      const accessor = createArrayAccessor(1.5);
      assert.strictEqual(accessor(testArray), null);

      const accessor2 = createArrayAccessor(-2.3);
      assert.strictEqual(accessor2(testArray), null);
    });
  });

  describe('字符串索引访问', () => {
    it('应该处理 "length" 特殊属性', () => {
      const accessor = createArrayAccessor('length');
      assert.strictEqual(accessor(testArray), 5);
      assert.strictEqual(accessor([]), 0);
      assert.strictEqual(accessor([1, 2, 3]), 3);
    });

    it('应该将有效的数字字符串转换为索引', () => {
      const accessor = createArrayAccessor('0');
      assert.strictEqual(accessor(testArray), 'a');

      const accessor2 = createArrayAccessor('3');
      assert.strictEqual(accessor2(testArray), 'd');
    });

    it('应该支持负数字符串索引', () => {
      const accessor = createArrayAccessor('-1');
      assert.strictEqual(accessor(testArray), 'e');

      const accessor2 = createArrayAccessor('-3');
      assert.strictEqual(accessor2(testArray), 'c');
    });

    it('应该拒绝无效的字符串索引', () => {
      const accessor = createArrayAccessor('abc');
      assert.strictEqual(accessor(testArray), null);

      const accessor2 = createArrayAccessor('1.5');
      assert.strictEqual(accessor2(testArray), null);

      const accessor3 = createArrayAccessor('01'); // 前导零
      assert.strictEqual(accessor3(testArray), null);

      const accessor4 = createArrayAccessor('2a');
      assert.strictEqual(accessor4(testArray), null);
    });
  });

  describe('边界情况', () => {
    it('应该处理空数组', () => {
      const accessor = createArrayAccessor(0);
      assert.strictEqual(accessor([]), null);

      const accessor2 = createArrayAccessor(-1);
      assert.strictEqual(accessor2([]), null);
    });

    it('应该处理单元素数组', () => {
      const singleArray = ['only'];

      const accessor0 = createArrayAccessor(0);
      assert.strictEqual(accessor0(singleArray), 'only');

      const accessor1 = createArrayAccessor(-1);
      assert.strictEqual(accessor1(singleArray), 'only');

      const accessor2 = createArrayAccessor(1);
      assert.strictEqual(accessor2(singleArray), null);
    });

    it('应该拒绝无效的索引类型', () => {
      const accessor = createArrayAccessor(null as any);
      assert.strictEqual(accessor(testArray), null);

      const accessor2 = createArrayAccessor(undefined as any);
      assert.strictEqual(accessor2(testArray), null);

      const accessor3 = createArrayAccessor({} as any);
      assert.strictEqual(accessor3(testArray), null);

      const accessor4 = createArrayAccessor([] as any);
      assert.strictEqual(accessor4(testArray), null);
    });

    it('应该处理包含各种类型元素的数组', () => {
      const mixedArray = [null, undefined, 0, '', false, { key: 'value' }];

      const accessor0 = createArrayAccessor(0);
      assert.strictEqual(accessor0(mixedArray), null);

      const accessor1 = createArrayAccessor(1);
      assert.strictEqual(accessor1(mixedArray), undefined);

      const accessor5 = createArrayAccessor(5);
      assert.deepStrictEqual(accessor5(mixedArray), { key: 'value' });
    });
  });

  describe('函数复用性', () => {
    it('创建的访问器应该可以在多个数组上复用', () => {
      const accessor = createArrayAccessor(1);

      assert.strictEqual(accessor(['a', 'b', 'c']), 'b');
      assert.strictEqual(accessor([10, 20, 30]), 20);
      assert.strictEqual(accessor(['x']), null);
    });

    it('应该是纯函数,不改变原数组', () => {
      const originalArray = [1, 2, 3];
      const accessor = createArrayAccessor(0);

      accessor(originalArray);
      assert.deepStrictEqual(originalArray, [1, 2, 3]);
    });
  });

  describe('特殊数字情况', () => {
    it('应该正确处理 0 索引', () => {
      const accessor = createArrayAccessor(0);
      assert.strictEqual(accessor(testArray), 'a');
      assert.strictEqual(accessor(['only']), 'only');
    });

    it('应该正确处理 -0', () => {
      const accessor = createArrayAccessor(-0);
      assert.strictEqual(accessor(testArray), 'a');
    });

    it('应该处理字符串 "0"', () => {
      const accessor = createArrayAccessor('0');
      assert.strictEqual(accessor(testArray), 'a');
    });
  });
});
