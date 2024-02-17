/* eslint no-use-before-define: 0 */
import _ from 'lodash';
import check from './check.mjs';
import checkout from '../checkout.mjs';
import getValueOfPathname from '../getValueOfPathname.mjs';

function walkWithObject(properties) {
  const keys = Object.keys(properties);
  const list = [];
  for (let i = 0; i < keys.length; i++) {
    const dataKey = keys[i];
    const express = properties[dataKey];
    const handler = {
      dataKey,
      express,
      fn: select(express),
    };
    list.push(handler);
  }
  return (d, _root) => {
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
        [cur.dataKey]: cur.fn(d[cur.dataKey], root),
      };
    }, {});
  };
}

function select(express) {
  if (Array.isArray(express)) {
    const [pathname] = express;
    if (typeof pathname !== 'string'
      || !_.isPlainObject(express[1])
    ) {
      throw new Error(`\`${JSON.stringify(express)}\` express invalid`);
    }
    const walk = select(express[1]);
    return (obj, _root) => {
      const root = _root == null ? obj : _root;
      if (pathname.startsWith('$')) {
        return walk(getValueOfPathname(root, pathname.slice(1)), root);
      }
      return walk(getValueOfPathname(obj, pathname), root);
    };
  }
  check(express);
  if (['string', 'number', 'boolean', 'integer'].includes(express.type)) {
    return (v) => checkout(v, express.type);
  }
  if (express.type === 'object') {
    return walkWithObject(express.properties);
  }
  if (Array.isArray(express.properties)) {
    const walk = select(express.properties[1]);
    return (v) => {
      if (!Array.isArray(v)) {
        return [];
      }
      const [pathname] = express.properties;
      return v.map((d) => {
        if (pathname === '' || pathname === '.') {
          return walk(d);
        }
        return walk(getValueOfPathname(d, pathname));
      });
    };
  }
  const walk = walkWithObject(express.properties);
  return (v) => {
    if (!Array.isArray(v)) {
      return [];
    }
    return v.map((d) => walk(d));
  };
}

export default select;
