const getArrayValue = (index, array) => {
  const len = array.length;
  if (len === 0) {
    return null;
  }
  if (index >= len) {
    return null;
  }
  if (index < 0) {
    const n = len + index;
    if (n < 0) {
      return null;
    }
    if (n > len) {
      return null;
    }
    return array[n];
  }
  return array[index];
};

export default (index) => {
  const type = typeof index;
  if (type !== 'string' && type !== 'number') {
    return () => null;
  }
  if (type === 'string') {
    if (index === 'length') {
      return (array) => array.length;
    }
    const n = parseInt(index, 10);
    if (Number.isNaN(n) || `${n}` !== index) {
      return () => null;
    }
    return (array) => getArrayValue(n, array);
  }
  if (`${index}`.includes('.')) {
    return () => null;
  }
  return (array) => getArrayValue(index, array);
};
