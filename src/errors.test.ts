import * as assert from 'node:assert';
import { test } from 'node:test';

import {
  DataVError,
  ERROR_CODES,
  type ErrorCode,
  type DataVErrorDetails,
  isDataVError,
  getErrorCode,
} from './errors.js';
import { parseValueByType } from './value-type.js';
import { parseDotPath } from './dot-path.js';

test('DataVError 类', async (t) => {
  await t.test('应该正确创建错误实例', () => {
    const error = DataVError.invalidDataType('invalid');
    assert.ok(error instanceof DataVError);
    assert.ok(error instanceof Error);
    assert.strictEqual(error.name, 'DataVError');
    assert.strictEqual(error.code, ERROR_CODES.INVALID_DATA_TYPE);
    assert.ok(error.message.includes('[INVALID_DATA_TYPE]'));
  });

  await t.test('应该包含正确的错误详情', () => {
    const error = DataVError.invalidDataType('invalid');
    assert.strictEqual(error.details.code, ERROR_CODES.INVALID_DATA_TYPE);
    assert.strictEqual(error.details.value, 'invalid');
  });

  await t.test('toJSON 应该返回正确的结构', () => {
    const error = DataVError.invalidDataType('invalid');
    const json = error.toJSON();
    assert.strictEqual(json.code, ERROR_CODES.INVALID_DATA_TYPE);
    assert.ok(typeof json.message === 'string');
  });

  await t.test('应该支持自定义路径信息', () => {
    const error = DataVError.transformError('Transform failed', 'test', 'user.name');
    assert.strictEqual(error.details.path, 'user.name');
    assert.strictEqual(error.details.value, 'test');
  });

  await t.test('应该支持链式 cause', () => {
    const cause = new Error('Original error');
    const error = DataVError.validationError('Validation failed', null);
    error.details.cause = cause;
    assert.strictEqual(error.details.cause, cause);
  });

  await t.test('静态工厂方法应该创建正确类型的错误', () => {
    const emptyType = DataVError.emptyDataType();
    assert.strictEqual(emptyType.code, ERROR_CODES.EMPTY_DATA_TYPE);

    const invalidSchema = DataVError.invalidSchema({}, 'test error');
    assert.strictEqual(invalidSchema.code, ERROR_CODES.INVALID_SCHEMA);

    const missingProps = DataVError.missingProperties('object');
    assert.strictEqual(missingProps.code, ERROR_CODES.MISSING_PROPERTIES);

    const invalidType = DataVError.invalidType('unknown');
    assert.strictEqual(invalidType.code, ERROR_CODES.INVALID_TYPE);

    const invalidTuple = DataVError.invalidTuple([]);
    assert.strictEqual(invalidTuple.code, ERROR_CODES.INVALID_TUPLE);

    const invalidPath = DataVError.invalidPath('test');
    assert.strictEqual(invalidPath.code, ERROR_CODES.INVALID_PATH);

    const invalidSegment = DataVError.invalidPathSegment('test..path');
    assert.strictEqual(invalidSegment.code, ERROR_CODES.INVALID_PATH_SEGMENT);
  });
});

test('ERROR_CODES 常量', async (t) => {
  await t.test('应该包含所有错误码', () => {
    const expectedCodes: ErrorCode[] = [
      'INVALID_DATA_TYPE',
      'EMPTY_DATA_TYPE',
      'INVALID_SCHEMA',
      'MISSING_PROPERTIES',
      'INVALID_TYPE',
      'INVALID_TUPLE',
      'INVALID_PATH',
      'INVALID_PATH_SEGMENT',
      'TRANSFORM_ERROR',
      'RESOLVE_ERROR',
      'VALIDATION_ERROR',
    ];

    for (const code of expectedCodes) {
      assert.ok(
        Object.values(ERROR_CODES).includes(code),
        `Missing error code: ${code}`,
      );
    }
  });
});

test('isDataVError 辅助函数', async (t) => {
  await t.test('应该正确识别 DataVError 实例', () => {
    const error = DataVError.invalidDataType('test');
    assert.strictEqual(isDataVError(error), true);
  });

  await t.test('应该正确识别非 DataVError', () => {
    assert.strictEqual(isDataVError(new Error('test')), false);
    assert.strictEqual(isDataVError(null), false);
    assert.strictEqual(isDataVError(undefined), false);
    assert.strictEqual(isDataVError('string'), false);
    assert.strictEqual(isDataVError(123), false);
  });
});

test('getErrorCode 辅助函数', async (t) => {
  await t.test('应该从 DataVError 获取错误码', () => {
    const error = DataVError.invalidDataType('test');
    assert.strictEqual(getErrorCode(error), ERROR_CODES.INVALID_DATA_TYPE);
  });

  await t.test('应该从非 DataVError 返回 undefined', () => {
    assert.strictEqual(getErrorCode(new Error('test')), undefined);
    assert.strictEqual(getErrorCode(null), undefined);
  });
});

test('parseValueByType 错误处理', async (t) => {
  await t.test('空类型应该抛出 DataVError', () => {
    assert.throws(
      () => parseValueByType('test', null as unknown as 'string'),
      (err: unknown) => {
        assert.ok(isDataVError(err));
        assert.strictEqual((err as DataVError).code, ERROR_CODES.EMPTY_DATA_TYPE);
        return true;
      },
    );
  });

  await t.test('无效类型应该抛出 DataVError', () => {
    assert.throws(
      () => parseValueByType('test', 'invalid' as 'string'),
      (err: unknown) => {
        assert.ok(isDataVError(err));
        assert.strictEqual((err as DataVError).code, ERROR_CODES.INVALID_DATA_TYPE);
        return true;
      },
    );
  });
});

test('parseDotPath 错误处理', async (t) => {
  await t.test('空路径段应该抛出 DataVError', () => {
    assert.throws(
      () => parseDotPath('user..name'),
      (err: unknown) => {
        assert.ok(isDataVError(err));
        assert.strictEqual((err as DataVError).code, ERROR_CODES.INVALID_PATH_SEGMENT);
        return true;
      },
    );
  });

  await t.test('前导点应该被忽略', () => {
    assert.deepStrictEqual(parseDotPath('.user'), ['user']);
  });
});

test('错误消息格式一致性', async (t) => {
  await t.test('所有错误应该包含错误码', () => {
    const errorTypes = [
      DataVError.emptyDataType(),
      DataVError.invalidDataType('test'),
      DataVError.invalidSchema({}, 'error'),
      DataVError.missingProperties('object'),
      DataVError.invalidType('test'),
      DataVError.invalidTuple([]),
      DataVError.invalidPath('test'),
      DataVError.invalidPathSegment('test'),
      DataVError.transformError('error', 'value'),
      DataVError.resolveError('error', 'value'),
      DataVError.validationError('error', 'value'),
    ];

    for (const error of errorTypes) {
      assert.ok(
        error.message.startsWith(`[${error.code}]`),
        `Error ${error.code} message format incorrect: ${error.message}`,
      );
    }
  });
});

test('错误栈追踪', async (t) => {
  await t.test('应该保留错误的栈追踪', () => {
    const error = DataVError.invalidDataType('test');
    assert.ok(error.stack, 'Error should have stack trace');
    assert.ok(error.stack!.includes('DataVError'), 'Stack should include class name');
  });
});
