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
    return (arr, _root) => {
      const root = _root == null ? arr : _root;
      const [pathname] = express.properties;
      if (!Array.isArray(arr)) {
        if (pathname.startsWith('$')) {
          const ret = walk(getValueOfPathname(root, pathname.slice(1)), root);
          if (ret == null) {
            return [];
          }
          return [ret];
        }
        return [];
      }
      return arr.map((d) => {
        if (pathname === '' || pathname === '.') {
          return walk(d, root);
        }
        return walk(getValueOfPathname(d, pathname), root);
      });
    };
  }
  const walk = walkWithObject(express.properties);
  return (arr, _root) => {
    const root = _root == null ? arr : _root;
    if (!Array.isArray(arr)) {
      if (_.isEmpty(express.properties)) {
        return [];
      }
      const ret = walk(arr, root);
      return [ret];
    }
    return arr.map((d) => walk(d, root));
  };
}

export default select;
