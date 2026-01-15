import assert from 'node:assert';
import test from 'node:test';

import { parseDotPath } from './parseDotPath.mjs';

test('parseDotPath', () => {
  assert.deepEqual(
    parseDotPath(''),
    [],
  );
  assert.deepEqual(
    parseDotPath('.'),
    [],
  );
  assert.deepEqual(
    parseDotPath('.aa'),
    ['aa'],
  );
  assert.deepEqual(
    parseDotPath('a.b.c'),
    ['a', 'b', 'c'],
  );
  assert.deepEqual(
    parseDotPath('.aa.bb.cc'),
    ['aa', 'bb', 'cc'],
  );
  assert.deepEqual(
    parseDotPath('aa.bb.cc'),
    ['aa', 'bb', 'cc'],
  );
  assert.deepEqual(
    parseDotPath('aa\\.bb.cc'),
    ['aa.bb', 'cc'],
  );
  assert.deepEqual(
    parseDotPath('.\\.aa'),
    ['.aa'],
  );
  assert.deepEqual(
    parseDotPath('\\.aa'),
    ['.aa'],
  );
  assert.deepEqual(
    parseDotPath('aa. .bb'),
    ['aa', ' ', 'bb'],
  );
  assert.deepEqual(
    parseDotPath('a\\.b\\.c'),
    ['a.b.c'],
  );
  assert.deepEqual(
    parseDotPath('a\\.b.c\\.d.e'),
    ['a.b', 'c.d', 'e'],
  );
  assert.deepEqual(
    parseDotPath('a.b.c\\.'),
    ['a', 'b', 'c.'],
  );
  assert.deepEqual(
    parseDotPath('\\.\\.\\.'),
    ['...'],
  );
  assert.deepEqual(
    parseDotPath('a\\\\.b.c'),
    ['a\\.b', 'c'],
  );
  assert.deepEqual(
    parseDotPath('a\\\\.b\\\\.c'),
    ['a\\.b\\.c'],
  );
  assert.throws(() => {
    parseDotPath('..aa');
  });
  assert.throws(() => {
    parseDotPath('aa..bb');
  });
  assert.throws(() => {
    parseDotPath('bb.');
  });
  assert.throws(() => {
    parseDotPath('a.b.c.');
  });
  assert.throws(() => {
    parseDotPath('.a\\.b..c\\.d.e\\..f');
  });
});

test('parseDotPath - 基本功能测试', async (t) => {
  await t.test('应该正确解析简单的点路径', () => {
    assert.deepStrictEqual(parseDotPath('a.b.c'), ['a', 'b', 'c']);
  });

  await t.test('应该正确解析单个段', () => {
    assert.deepStrictEqual(parseDotPath('single'), ['single']);
  });

  await t.test('应该正确解析两个段', () => {
    assert.deepStrictEqual(parseDotPath('first.second'), ['first', 'second']);
  });
});

test('parseDotPath - 前导点处理', async (t) => {
  await t.test('应该移除前导点', () => {
    assert.deepStrictEqual(parseDotPath('.a.b.c'), ['a', 'b', 'c']);
  });

  await t.test('只有一个点时应该返回空数组', () => {
    assert.deepStrictEqual(parseDotPath('.'), []);
  });

  await t.test('空字符串应该返回空数组', () => {
    assert.deepStrictEqual(parseDotPath(''), []);
  });
});

test('parseDotPath - 转义点号处理', async (t) => {
  await t.test('应该正确处理转义的点号', () => {
    assert.deepStrictEqual(parseDotPath('a\\.b.c'), ['a.b', 'c']);
  });

  await t.test('应该正确处理多个转义的点号', () => {
    assert.deepStrictEqual(parseDotPath('a\\.b\\.c.d'), ['a.b.c', 'd']);
  });

  await t.test('应该正确处理连续的转义点号', () => {
    assert.deepStrictEqual(parseDotPath('a\\.\\.b'), ['a..b']);
  });

  await t.test('应该正确混合转义和非转义点号', () => {
    assert.deepStrictEqual(parseDotPath('a.b\\.c.d'), ['a', 'b.c', 'd']);
  });

  await t.test('转义点号在开头', () => {
    assert.deepStrictEqual(parseDotPath('\\.a.b'), ['.a', 'b']);
  });

  await t.test('转义点号在结尾', () => {
    assert.deepStrictEqual(parseDotPath('a.b\\.'), ['a', 'b.']);
  });
});

test('parseDotPath - 错误处理', async (t) => {
  await t.test('应该抛出错误：连续的点号', () => {
    assert.throws(
      () => parseDotPath('a..b'),
      {
        name: 'Error',
        message: 'Path "a..b" parse failed: contains empty segment'
      }
    );
  });

  await t.test('应该抛出错误：结尾的点号', () => {
    assert.throws(
      () => parseDotPath('a.b.'),
      {
        name: 'Error',
        message: 'Path "a.b." parse failed: contains empty segment'
      }
    );
  });

  await t.test('应该抛出错误：开头的双点号', () => {
    assert.throws(
      () => parseDotPath('.a.'),
      {
        name: 'Error',
        message: 'Path ".a." parse failed: contains empty segment'
      }
    );
  });

  await t.test('应该抛出错误：多个连续点号', () => {
    assert.throws(
      () => parseDotPath('a...b'),
      {
        name: 'Error',
        message: 'Path "a...b" parse failed: contains empty segment'
      }
    );
  });
});

test('parseDotPath - 边界情况', async (t) => {
  await t.test('应该处理很长的路径', () => {
    const longPath = 'a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p';
    const expected = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'];
    assert.deepStrictEqual(parseDotPath(longPath), expected);
  });

  await t.test('应该处理包含特殊字符的段', () => {
    assert.deepStrictEqual(parseDotPath('a-b.c_d.e123'), ['a-b', 'c_d', 'e123']);
  });

  await t.test('应该处理中文字符', () => {
    assert.deepStrictEqual(parseDotPath('用户.姓名.firstName'), ['用户', '姓名', 'firstName']);
  });

  await t.test('应该处理数字段', () => {
    assert.deepStrictEqual(parseDotPath('0.1.2'), ['0', '1', '2']);
  });
});

