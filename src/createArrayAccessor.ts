const getArrayElementAt = (index: number, array: unknown[]): unknown => {
  const length = array.length;

  // 空数组处理
  if (length === 0) {
    return null;
  }

  if (index < 0) {
    const actualIndex = length + index;
    if (actualIndex < 0) {
      return null;
    }
    return array[actualIndex];
  }

  if (index >= length) {
    return null;
  }

  return array[index];
};

export function createArrayAccessor(index: string | number): (array: unknown[]) => unknown {
  const indexType = typeof index;

  if (indexType !== 'string' && indexType !== 'number') {
    return () => null;
  }

  // 处理字符串索引
  if (indexType === 'string') {
    // 特殊处理 'length' 属性
    if (index === 'length') {
      return (array: unknown[]) => array.length;
    }

    // 尝试将字符串转换为数字索引
    const numericIndex = parseInt(index as string, 10);
    if (Number.isNaN(numericIndex) || numericIndex.toString() !== index) {
      return () => null;
    }

    return (array: unknown[]) => getArrayElementAt(numericIndex, array);
  }

  // 处理数字索引 - 拒绝浮点数
  if (!Number.isInteger(index as number)) {
    return () => null;
  }

  return (array: unknown[]) => getArrayElementAt(index as number, array);
}
