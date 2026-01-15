const getArrayElementAt = (index: number, array: unknown[]): unknown => {
  const length = array.length;

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

  if (indexType === 'string') {
    if (index === 'length') {
      return (array: unknown[]) => array.length;
    }

    const numericIndex = parseInt(index as string, 10);
    if (Number.isNaN(numericIndex) || numericIndex.toString() !== index) {
      return () => null;
    }

    return (array: unknown[]) => getArrayElementAt(numericIndex, array);
  }

  if (!Number.isInteger(index as number)) {
    return () => null;
  }

  return (array: unknown[]) => getArrayElementAt(index as number, array);
}
