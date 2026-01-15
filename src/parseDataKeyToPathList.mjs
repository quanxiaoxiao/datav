export default (str) => {
  str = str.startsWith('.') ? str.slice(1) : str;
  if (str === '') {
    return [];
  }
  const list = str.split(/(?<!\\)\./).map((d) => d.replace(/\\\./g, '.'));
  if (list.some((s) => s === '')) {
    throw new Error(`\`${str}\` parse fail`);
  }
  return list;
};
