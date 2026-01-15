import getValueOfArray from './getValueOfArray.mjs';

const getValue = (dataKey) => (obj) => {
  if (obj == null) {
    return null;
  }
  if (!Object.hasOwnProperty.call(obj, dataKey)) {
    return null;
  }
  return obj[dataKey];
};

const walk = (obj, nameList) => {
  const [dataKey, ...other] = nameList;
  if (Array.isArray(obj)) {
    const value = getValueOfArray(dataKey)(obj);
    if (value == null) {
      return null;
    }
    if (other.length === 0) {
      return value;
    }
    return walk(value, other);
  }
  const value = getValue(dataKey)(obj);
  if (value == null) {
    return null;
  }
  if (other.length === 0) {
    return value;
  }
  return walk(value, other);
};

export default (pathList) => {
  if (pathList.length === 0) {
    return (data) => data;
  }
  if (pathList.length === 1) {
    return (data) => {
      if (Array.isArray(data)) {
        return getValueOfArray(pathList[0])(data);
      }
      return getValue(pathList[0])(data);
    };
  }
  return (data) => walk(data, pathList);
};
