import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { parseDotPath } from './parseDotPath.js';
import { isDataVError, ERROR_CODES } from './errors.js';

/**
 * 辅助函数：断言路径解析结果
 */
const assertParsed = (input: string, expected: string[], message?: string) => {
  assert.deepStrictEqual(
    parseDotPath(input),
    expected,
    message || `Failed for input: "${input}"`
  );
};

/**
 * 辅助函数：断言抛出无效路径错误
 */
const assertInvalidPath = (input: string, message?: string) => {
  assert.throws(
    () => parseDotPath(input),
    (err: unknown) => {
      assert.ok(isDataVError(err), 'Should be a DataVError');
      assert.strictEqual(
        (err as { code: string }).code,
        ERROR_CODES.INVALID_PATH_SEGMENT,
        'Should have INVALID_PATH_SEGMENT error code'
      );
      return true;
    },
    message || `Should throw for input: "${input}"`
  );
};

describe('parseDotPath', () => {
  describe('基础路径解析（Fast Path）', () => {
    it('空字符串应返回空数组', () => {
      assertParsed('', []);
    });

    it('单个点应返回空数组', () => {
      assertParsed('.', []);
    });

    it('单段路径', () => {
      assertParsed('a', ['a']);
      assertParsed('single', ['single']);
    });

    it('多段路径', () => {
      assertParsed('a.b', ['a', 'b']);
      assertParsed('a.b.c', ['a', 'b', 'c']);
      assertParsed('first.second.third.fourth', ['first', 'second', 'third', 'fourth']);
    });

    it('前导点应被忽略', () => {
      assertParsed('.a', ['a']);
      assertParsed('.aa', ['aa']);
      assertParsed('.a.b.c', ['a', 'b', 'c']);
      assertParsed('.aa.bb.cc', ['aa', 'bb', 'cc']);
    });
  });

  describe('转义字符处理（Slow Path）', () => {
    it('转义点号', () => {
      assertParsed('a\\.b', ['a.b']);
      assertParsed('a\\.b.c', ['a.b', 'c']);
      assertParsed('a\\.b\\.c', ['a.b.c']);
      assertParsed('a\\.b\\.c.d', ['a.b.c', 'd']);
      assertParsed('a.b\\.c.d', ['a', 'b.c', 'd']);
    });

    it('转义反斜杠', () => {
      assertParsed('a\\\\b', ['a\\b']);
      assertParsed('a\\\\.b.c', ['a\\', 'b', 'c']);
      assertParsed('a\\\\.b\\\\.c', ['a\\', 'b\\', 'c']);
    });

    it('混合转义', () => {
      assertParsed('a\\.b\\\\c', ['a.b\\c']);
      assertParsed('a\\.b.c\\.d.e', ['a.b', 'c.d', 'e']);
    });

    it('转义点在段的开头或结尾', () => {
      assertParsed('\\.aa', ['.aa']);
      assertParsed('.\\.aa', ['.aa']);
      assertParsed('a\\.', ['a.']);
      assertParsed('a.b\\.', ['a', 'b.']);
      assertParsed('a.b.c\\.', ['a', 'b', 'c.']);
    });

    it('连续转义点', () => {
      assertParsed('a\\.\\.b', ['a..b']);
      assertParsed('\\.\\.\\.', ['...']);
    });
  });

  describe('特殊字符支持', () => {
    it('空格段', () => {
      assertParsed('aa. .bb', ['aa', ' ', 'bb']);
    });

    it('连字符和下划线', () => {
      assertParsed('a-b.c_d.e123', ['a-b', 'c_d', 'e123']);
    });

    it('Unicode 字符（中文）', () => {
      assertParsed('用户.姓名.firstName', ['用户', '姓名', 'firstName']);
    });

    it('数字段', () => {
      assertParsed('0.1.2', ['0', '1', '2']);
    });

    it('特殊开头字符', () => {
      assertParsed('_private.public', ['_private', 'public']);
      assertParsed('$var.prop', ['$var', 'prop']);
    });
  });

  describe('长路径处理', () => {
    it('16段路径', () => {
      assertParsed(
        'a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p',
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p']
      );
    });

    it('带转义的长路径', () => {
      assertParsed('a\\.b.c\\.d.e', ['a.b', 'c.d', 'e']);
    });
  });

  describe('错误情况：空段检测', () => {
    it('开头的连续点', () => {
      assertInvalidPath('..aa');
      assertInvalidPath('..a');
    });

    it('中间的连续点', () => {
      assertInvalidPath('a..b');
      assertInvalidPath('aa..bb');
      assertInvalidPath('a...b');
    });

    it('结尾的点', () => {
      assertInvalidPath('bb.');
      assertInvalidPath('a.b.');
      assertInvalidPath('a.b.c.');
    });

    it('前导点 + 结尾点', () => {
      assertInvalidPath('.a.');
    });

    it('复杂的空段错误', () => {
      assertInvalidPath('.a\\.b..c\\.d.e\\..f');
    });
  });

  describe('错误情况：悬挂转义符', () => {
    it('单独的反斜杠', () => {
      assertInvalidPath('a\\');
      assertInvalidPath('a.b\\');
    });
  });

  describe('综合测试：完整兼容性', () => {
    it('批量验证有效输入', () => {
      const validCases: Array<[string, string[]]> = [
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
        ['$aa.bb', ['$aa', 'bb']],
        ['a\\.b\\.c', ['a.b.c']],
        ['a\\.b.c\\.d.e', ['a.b', 'c.d', 'e']],
        ['a.b.c\\.', ['a', 'b', 'c.']],
        ['\\.\\.\\.', ['...']],
        ['a\\\\.b.c', ['a\\', 'b', 'c']],
        ['a\\\\.b\\\\.c', ['a\\', 'b\\', 'c']],
      ];

      validCases.forEach(([input, expected]) => {
        assertParsed(input, expected);
      });
    });

    it('批量验证无效输入', () => {
      const invalidInputs = [
        '..aa',
        'aa..bb',
        'bb.',
        'a.b.c.',
        '.a\\.b..c\\.d.e\\..f',
      ];

      invalidInputs.forEach(input => {
        assertInvalidPath(input);
      });
    });
  });
});

describe('parseDotPath', () => {
  it('应该解析简单路径', () => {
    assert.deepStrictEqual(parseDotPath('user.name'), ['user', 'name']);
    assert.deepStrictEqual(parseDotPath('a.b.c'), ['a', 'b', 'c']);
  });

  it('应该处理前导点', () => {
    assert.deepStrictEqual(parseDotPath('.user.name'), ['user', 'name']);
  });

  it('应该处理空字符串', () => {
    assert.deepStrictEqual(parseDotPath(''), []);
  });

  it('应该处理单个段', () => {
    assert.deepStrictEqual(parseDotPath('name'), ['name']);
  });

  it('应该处理转义点号', () => {
    assert.deepStrictEqual(parseDotPath('user\\.name'), ['user.name']);
    assert.deepStrictEqual(parseDotPath('a\\.b.c'), ['a.b', 'c']);
  });

  it('应该处理前导点后无内容', () => {
    assert.deepStrictEqual(parseDotPath('.'), []);
  });
});
