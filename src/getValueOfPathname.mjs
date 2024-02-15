import _ from 'lodash';

const walk = (obj, nameList) => {
  const [dataKey, ...other] = nameList;
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
  if (typeof pathname !== 'string') {
    throw new Error('pathname invalid');
  }
  if (!_.isPlainObject(obj)) {
    return null;
  }
  if (pathname === '') {
    return obj;
  }
  return walk(obj, pathname.split(/(?<!\\)\./).map((d) => d.replace(/\\\./g, '.')));
};
