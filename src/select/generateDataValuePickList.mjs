import getValueOfPathname from '../getValueOfPathname.mjs';
import checkout from '../checkout.mjs';

export default (obj) => {
  const keys = Object.keys(obj);
  const result = [];
  for (let i = 0; i < keys.length; i++) {
    const dataKey = keys[i];
    const value = obj[dataKey];
    const valueType = typeof value;
    const handler = {
      dataKey,
      fn: () => value,
    };
    if (valueType === 'string') {
      if (value.startsWith('$')) {
        const [pathname, dataType] = value.slice(1).split(':');
        handler.fn = (d) => {
          const v = getValueOfPathname(d, pathname);
          if (dataType) {
            return checkout(v, dataType);
          }
          return v;
        };
      }
    }
    result.push(handler);
  }
  return result;
};
