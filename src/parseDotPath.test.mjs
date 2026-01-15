import assert from 'node:assert';
import test from 'node:test';

import { parseDotPath } from './parseDotPath.mjs';

const testCases = (description, cases) => {
  test(description, async (t) => {
    for (const [input, expected, testDesc] of cases) {
      await t.test(testDesc || `输入: "${input}"`, () => {
        assert.deepStrictEqual(parseDotPath(input), expected);
      });
    }
  });
};

const errorCases = (description, cases) => {
  test(description, async (t) => {
    for (const [input, errorMsg, testDesc] of cases) {
      await t.test(testDesc || `输入: "${input}"`, () => {
        assert.throws(
          () => parseDotPath(input),
          {
            name: 'Error',
            message: errorMsg || `Path "${input}" parse failed: contains empty segment`,
          },
        );
      });
    }
  });
};

// 基本功能测试
testCases('基本路径解析', [
  ['', [], '空字符串应返回空数组'],
  ['.', [], '单个点应返回空数组'],
  ['single', ['single'], '单个段'],
  ['a.b', ['a', 'b'], '两个段'],
  ['a.b.c', ['a', 'b', 'c'], '三个段'],
  ['first.second.third.fourth', ['first', 'second', 'third', 'fourth'], '多个段'],
]);

// 前导点处理
testCases('前导点处理', [
  ['.aa', ['aa'], '前导点 + 单段'],
  ['.a.b.c', ['a', 'b', 'c'], '前导点 + 多段'],
  ['.aa.bb.cc', ['aa', 'bb', 'cc'], '前导点 + 多段（长名称）'],
]);

// 转义点号处理
testCases('转义点号处理', [
  ['a\\.b', ['a.b'], '单个转义点'],
  ['a\\.b.c', ['a.b', 'c'], '转义点在中间段'],
  ['a\\.b\\.c', ['a.b.c'], '多个转义点在同一段'],
  ['a\\.b\\.c.d', ['a.b.c', 'd'], '连续转义点 + 普通分隔'],
  ['a.b\\.c.d', ['a', 'b.c', 'd'], '混合转义和非转义'],
  ['\\.aa', ['.aa'], '转义点在开头'],
  ['.\\.aa', ['.aa'], '前导点 + 转义点'],
  ['a.b\\.', ['a', 'b.'], '转义点在结尾'],
  ['a.b.c\\.', ['a', 'b', 'c.'], '转义点在最后段末尾'],
  ['\\.\\.\\.', ['...'], '多个连续转义点'],
  ['a\\\\.b.c', ['a\\.b', 'c'], '转义反斜杠 + 点'],
  ['a\\\\.b\\\\.c', ['a\\.b\\.c'], '多个转义反斜杠'],
  ['a\\.\\.b', ['a..b'], '转义的连续点号'],
]);

// 特殊字符和边界情况
testCases('特殊字符处理', [
  ['aa. .bb', ['aa', ' ', 'bb'], '空格段'],
  ['a-b.c_d.e123', ['a-b', 'c_d', 'e123'], '连字符和下划线'],
  ['用户.姓名.firstName', ['用户', '姓名', 'firstName'], '中文字符'],
  ['0.1.2', ['0', '1', '2'], '数字段'],
  ['_private.public', ['_private', 'public'], '下划线开头'],
  ['$var.prop', ['$var', 'prop'], '美元符号开头'],
]);

// 长路径测试
testCases('长路径处理', [
  [
    'a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p',
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'],
    '16段长路径',
  ],
  [
    'a\\.b.c\\.d.e',
    ['a.b', 'c.d', 'e'],
    '带转义的混合路径',
  ],
]);

// 错误情况测试
errorCases('错误：空段检测', [
  ['..aa', null, '开头的连续点'],
  ['a..b', null, '中间的连续点'],
  ['aa..bb', null, '中间的连续点（长名称）'],
  ['a...b', null, '多个连续点'],
  ['bb.', null, '结尾的点'],
  ['a.b.', null, '多段后结尾的点'],
  ['a.b.c.', null, '更多段后结尾的点'],
  ['.a.', null, '前导点 + 结尾点'],
  ['.a\\.b..c\\.d.e\\..f', null, '复杂的空段错误'],
]);

// 综合测试（保留原有的完整测试以确保兼容性）
test('parseDotPath - 完整兼容性测试', () => {
  const validCases = [
    ['', []],
    ['.', []],
    ['.aa', ['aa']],
    ['a.b.c', ['a', 'b', 'c']],
    ['.aa.bb.cc', ['aa', 'bb', 'cc']],
    ['aa.bb.cc', ['aa', 'bb', 'cc']],
    ['aa\\.bb.cc', ['aa.bb', 'cc']],
    ['.\\.aa', ['.aa']],
    ['\\.aa', ['.aa']],
    ['aa. .bb', ['aa', ' ', 'bb']],
    ['a\\.b\\.c', ['a.b.c']],
    ['a\\.b.c\\.d.e', ['a.b', 'c.d', 'e']],
    ['a.b.c\\.', ['a', 'b', 'c.']],
    ['\\.\\.\\.', ['...']],
    ['a\\\\.b.c', ['a\\.b', 'c']],
    ['a\\\\.b\\\\.c', ['a\\.b\\.c']],
  ];

  validCases.forEach(([input, expected]) => {
    assert.deepStrictEqual(parseDotPath(input), expected, `Failed for input: "${input}"`);
  });

  const errorInputs = [
    '..aa',
    'aa..bb',
    'bb.',
    'a.b.c.',
    '.a\\.b..c\\.d.e\\..f',
  ];

  errorInputs.forEach(input => {
    assert.throws(() => parseDotPath(input), `Should throw for input: "${input}"`);
  });
});
