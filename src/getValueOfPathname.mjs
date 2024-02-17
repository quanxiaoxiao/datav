import _ from 'lodash';

const walk = (obj, nameList) => {
  const [dataKey, ...other] = nameList;
  if (Array.isArray(obj)) {
    const n = parseInt(dataKey, 10);
    if (Number.isNaN(n) || `${n}` !== dataKey) {
      return null;
    }
    const len = obj.length;
    if (n > len) {
      return null;
    }
    if (other.length === 0) {
      return obj[n];
    }
    return walk(obj[n], other);
  }
  if (!Object.hasOwnProperty.call(obj, dataKey)) {
    return null;
  }
  const value = obj[dataKey];
  if (other.length === 0) {
    return value;
  }
  return walk(value, other);
};

export default (obj, pathname) => {
  if (typeof pathname !== 'string' || (/\.$/.test(pathname) && pathname !== '.')) {
    throw new Error('pathname invalid');
  }
  if (!Array.isArray(obj) && !_.isPlainObject(obj)) {
    return null;
  }
  let str = pathname;
  if (pathname.startsWith('.')) {
    str = pathname.slice(1);
  }
  if (str === '') {
    return obj;
  }
  return walk(obj, str.split(/(?<!\\)\./).map((d) => d.replace(/\\\./g, '.')));
};
