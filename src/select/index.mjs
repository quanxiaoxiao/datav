/* eslint no-use-before-define: 0 */
import _ from 'lodash';
import check from './check.mjs';
import checkout from '../checkout.mjs';
import getValueOfPathname from '../getValueOfPathname.mjs';

function walkWithObject(obj) {
  const keys = Object.keys(obj);
  const list = [];
  for (let i = 0; i < keys.length; i++) {
    const dataKey = keys[i];
    const express = obj[dataKey];
    const handler = {
      dataKey,
      express,
      fn: select(express),
    };
    list.push(handler);
  }
  return (d) => list.reduce((acc, cur) => {
    if (Array.isArray(cur.express)) {
      return {
        ...acc,
        [cur.dataKey]: cur.fn(d),
      };
    }
    return {
      ...acc,
      [cur.dataKey]: cur.fn(d[cur.dataKey]),
    };
  }, {});
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
    return (obj) => walk(getValueOfPathname(obj, pathname));
  }
  check(express);
  if (['string', 'number', 'boolean', 'integer'].includes(express.type)) {
    return (v) => checkout(v, express.type);
  }
  if (express.type === 'object') {
    return walkWithObject(express.properties);
  }
  if (express.type !== 'array') {
    throw new Error(`\`${JSON.stringify(express)}\` express invalid`);
  }
}

export default select;
