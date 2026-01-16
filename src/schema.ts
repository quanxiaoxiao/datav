/* eslint-disable @typescript-eslint/no-explicit-any */
type ResolveFn = (value: unknown, root: unknown) => unknown;

const toString = (path?: string, resolve?: ResolveFn) => {
  const field: any = { type: 'string' };
  if (resolve) field.resolve = resolve;
  if (path) return [path, field];
  return field;
};

const toNumber = (path?: string, resolve?: ResolveFn) => {
  const field: any = { type: 'number' };
  if (resolve) field.resolve = resolve;
  if (path) return [path, field];
  return field;
};

const toInteger = (path?: string, resolve?: ResolveFn) => {
  const field: any = { type: 'integer' };
  if (resolve) field.resolve = resolve;
  if (path) return [path, field];
  return field;
};

const toBoolean = (path?: string, resolve?: ResolveFn) => {
  const field: any = { type: 'boolean' };
  if (resolve) field.resolve = resolve;
  if (path) return [path, field];
  return field;
};

const toObject = (properties: any) => {
  return {
    type: 'object',
    properties,
  };
};

const toArray = (properties: any) => {
  return {
    type: 'array',
    properties,
  };
};

const optional = (pathOrSchema: string | any) => {
  if (typeof pathOrSchema === 'string') {
    return [pathOrSchema, { type: 'string' }];
  }
  return pathOrSchema;
};

const required = (field: any) => field;

const rename = (newName: string, field: any) => {
  if (Array.isArray(field)) {
    return [newName, field[1]];
  }
  return field;
};

const transform = (field: any, resolver: ResolveFn) => {
  return { ...field, resolve: resolver };
};

const defaultTo = (field: any, defaultValue: unknown) => {
  const originalResolve = field.resolve;
  return {
    ...field,
    resolve: (value: unknown, root: unknown) => {
      if (value == null) return defaultValue;
      if (originalResolve) return originalResolve(value, root);
      return value;
    },
  };
};

const fromRoot = (pathOrField: string | any, field?: any): any => {
  if (typeof pathOrField === 'string') {
    return ['$' + pathOrField, field];
  }
  return ['$', pathOrField];
};

const pluck = (path: string, field: any) => {
  return [path, field];
};

const mapArray = (field: any) => {
  return ['.', field];
};

const omit = <T extends Record<string, unknown>>(
  obj: T,
  keys: (keyof T)[],
): Partial<T> => {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
};

const pick = <T extends Record<string, unknown>>(
  obj: T,
  keys: (keyof T)[],
): Partial<T> => {
  const result: Partial<T> = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
};

const pipeline = <T>(...fns: Array<(value: T) => T>): ((value: T) => T) => {
  return (value: T) => fns.reduce((acc, fn) => fn(acc), value);
};

const cond = (field: any, condition: ResolveFn, fallback: any) => {
  return {
    ...field,
    resolve: (value: unknown, root: unknown) =>
      condition(value, root)
        ? field.resolve?.(value, root) ?? value
        : fallback.resolve?.(value, root) ?? fallback,
  };
};

const when = cond;

const constant = <T>(value: T) => ({
  type: 'string' as const,
  resolve: () => value,
});

const lazy = <T>(fn: () => T) => ({
  type: 'string' as const,
  resolve: () => fn(),
});

export const f = {
  toString,
  toNumber,
  toInteger,
  toBoolean,
  toObject,
  toArray,
  optional,
  required,
  rename,
  transform,
  defaultTo,
  fromRoot,
  pluck,
  mapArray,
  omit,
  pick,
  pipeline,
  cond,
  when,
  constant,
  lazy,
};

export {
  toString,
  toNumber,
  toInteger,
  toBoolean,
  toObject,
  toArray,
  optional,
  required,
  rename,
  transform,
  defaultTo,
  fromRoot,
  pluck,
  mapArray,
  omit,
  pick,
  pipeline,
  cond,
  when,
  constant,
  lazy,
};
