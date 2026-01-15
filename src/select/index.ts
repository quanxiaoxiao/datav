import _ from 'lodash';

import checkout from '../checkout.js';
import getValueOfPathname from '../getValueOfPathname.js';
import check from './check.js';

interface SelectExpress {
  type: 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';
  properties?: Record<string, SelectExpress> | [string, SelectExpress] | SelectExpress[];
  resolve?: (value: unknown, root: unknown) => unknown;
}

interface Handler {
  dataKey: string;
  express: SelectExpress;
  fn: (obj: unknown, root: unknown) => unknown;
}

type SelectFn = (express: SelectExpress | [string, SelectExpress]) => (obj: unknown, _root?: unknown) => unknown;

const walkWithObject = (properties: Record<string, SelectExpress>, selectFn: SelectFn): (d: unknown, _root: unknown) => object => {
  const keys = Object.keys(properties);
  const list: Handler[] = [];
  for (let i = 0; i < keys.length; i++) {
    const dataKey = keys[i];
    const express = properties[dataKey];
    const handler: Handler = {
      dataKey,
      express,
      fn: selectFn(express),
    };
    list.push(handler);
  }
  return (d: unknown, _root: unknown) => {
    const root = _root == null ? d : _root;
    return list.reduce((acc, cur) => {
      if (Array.isArray(cur.express)) {
        return {
          ...acc,
          [cur.dataKey]: cur.fn(d, root),
        };
      }
      return {
        ...acc,
        [cur.dataKey]: cur.fn(d == null ? d : (d as Record<string, unknown>)[cur.dataKey], root),
      };
    }, {} as object);
  };
};

const select: SelectFn = (express) => {
  if (Array.isArray(express)) {
    const [pathname] = express;
    if (typeof pathname !== 'string'
      || !_.isPlainObject(express[1])
    ) {
      throw new Error(`\`${JSON.stringify(express)}\` express invalid`);
    }
    const walk = select(express[1]);
    return (obj: unknown, _root?: unknown) => {
      const root = _root == null ? obj : _root;
      if (pathname.startsWith('$')) {
        return walk(getValueOfPathname(pathname.slice(1))(root), root);
      }
      return walk(getValueOfPathname(pathname)(obj), root);
    };
  }
  check(express);
  if (['string', 'number', 'boolean', 'integer'].includes(express.type)) {
    return (v: unknown, _root?: unknown) => {
      const root = _root == null ? v : _root;
      let value: unknown = v;
      if (express.resolve) {
        value = express.resolve(value, root);
      }
      return checkout(value, express.type);
    };
  }
  if (express.resolve) {
    console.warn('data type `array` or `object` unspport resolve');
  }
  if (express.type === 'object') {
    if (_.isEmpty(express.properties)) {
      return (v: unknown) => {
        if (!_.isPlainObject(v)) {
          return {};
        }
        return v;
      };
    }
    return walkWithObject(express.properties as Record<string, SelectExpress>, select);
  }
  if (Array.isArray(express.properties)) {
    const walk = select(express.properties[1]);
    return (arr: unknown, _root?: unknown) => {
      const root = _root == null ? arr : _root;
      const [pathname] = express.properties as [string, SelectExpress];
      if (!Array.isArray(arr)) {
        if (pathname.startsWith('$')) {
          const ret = walk(getValueOfPathname(pathname.slice(1))(root), root);
          if (ret == null) {
            return [];
          }
          return [ret];
        }
        return [];
      }
      return (arr as unknown[]).map((d) => {
        if (pathname === '' || pathname === '.') {
          return walk(d, root);
        }
        return walk(getValueOfPathname(pathname)(d), root);
      });
    };
  }
  const walk = walkWithObject(express.properties as Record<string, SelectExpress>, select);
  return (arr: unknown, _root?: unknown) => {
    const root = _root == null ? arr : _root;
    if (!Array.isArray(arr)) {
      if (_.isEmpty(express.properties)) {
        return [];
      }
      const ret = walk(arr, root);
      return [ret];
    }
    return (arr as unknown[]).map((d) => walk(d, root));
  };
};

export default select;
