export const ERROR_CODES = {
  INVALID_DATA_TYPE: 'INVALID_DATA_TYPE',
  EMPTY_DATA_TYPE: 'EMPTY_DATA_TYPE',
  INVALID_SCHEMA: 'INVALID_SCHEMA',
  MISSING_PROPERTIES: 'MISSING_PROPERTIES',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_TUPLE: 'INVALID_TUPLE',
  INVALID_PATH: 'INVALID_PATH',
  INVALID_PATH_SEGMENT: 'INVALID_PATH_SEGMENT',
  TRANSFORM_ERROR: 'TRANSFORM_ERROR',
  RESOLVE_ERROR: 'RESOLVE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export interface DataVErrorDetails {
  code: ErrorCode;
  message: string;
  path?: string;
  value?: unknown;
  schema?: unknown;
  cause?: Error;
}

export class DataVError extends Error {
  public readonly code: ErrorCode;
  public readonly details: DataVErrorDetails;

  constructor(details: DataVErrorDetails) {
    super(`[${details.code}] ${details.message}`);
    this.name = 'DataVError';
    this.code = details.code;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DataVError);
    }
  }

  public toJSON(): DataVErrorDetails {
    return {
      code: this.code,
      message: this.message,
      path: this.details.path,
      value: this.details.value,
      schema: this.details.schema,
      cause: this.details.cause,
    };
  }

  public static invalidDataType(type: unknown): DataVError {
    return new DataVError({
      code: ERROR_CODES.INVALID_DATA_TYPE,
      message: `Invalid data type: "${String(type)}". Expected one of: string, number, boolean, integer, json, object, array`,
      value: type,
    });
  }

  public static emptyDataType(): DataVError {
    return new DataVError({
      code: ERROR_CODES.EMPTY_DATA_TYPE,
      message: 'Data type cannot be empty or null',
    });
  }

  public static invalidSchema(schema: unknown, errors: string): DataVError {
    return new DataVError({
      code: ERROR_CODES.INVALID_SCHEMA,
      message: `Invalid schema: ${errors}`,
      schema,
    });
  }

  public static missingProperties(type: 'object' | 'array'): DataVError {
    return new DataVError({
      code: ERROR_CODES.MISSING_PROPERTIES,
      message: `Missing "properties" for type "${type}"`,
    });
  }

  public static invalidType(type: unknown): DataVError {
    return new DataVError({
      code: ERROR_CODES.INVALID_TYPE,
      message: `Invalid type: "${String(type)}". Expected one of: string, number, boolean, integer, object, array`,
      value: type,
    });
  }

  public static invalidTuple(schema: unknown): DataVError {
    return new DataVError({
      code: ERROR_CODES.INVALID_TUPLE,
      message: `Invalid tuple schema: "${JSON.stringify(schema)}". Expected [path, schema] format`,
      schema,
    });
  }

  public static invalidPath(path: string): DataVError {
    return new DataVError({
      code: ERROR_CODES.INVALID_PATH,
      message: `Invalid path: "${path}"`,
    });
  }

  public static invalidPathSegment(path: string): DataVError {
    return new DataVError({
      code: ERROR_CODES.INVALID_PATH_SEGMENT,
      message: `Path "${path}" contains empty segment`,
    });
  }

  public static transformError(
    message: string,
    value: unknown,
    path?: string,
  ): DataVError {
    return new DataVError({
      code: ERROR_CODES.TRANSFORM_ERROR,
      message,
      value,
      path,
    });
  }

  public static resolveError(
    message: string,
    value: unknown,
    path?: string,
  ): DataVError {
    return new DataVError({
      code: ERROR_CODES.RESOLVE_ERROR,
      message,
      value,
      path,
    });
  }

  public static validationError(
    message: string,
    value: unknown,
  ): DataVError {
    return new DataVError({
      code: ERROR_CODES.VALIDATION_ERROR,
      message,
      value,
    });
  }
}

export function isDataVError(error: unknown): error is DataVError {
  return error instanceof DataVError;
}

export function getErrorCode(error: unknown): ErrorCode | undefined {
  if (isDataVError(error)) {
    return error.code;
  }
  return undefined;
}
