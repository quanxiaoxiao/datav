import assert from 'node:assert';
import test from 'node:test';
import getValueOfPathname from './getValueOfPathname.mjs';

test('getValueOfPathname', () => {
  assert.throws(() => {
    getValueOfPathname({}, 11);
  });
  assert.throws(() => {
    getValueOfPathname({}, '.');
  });
  assert.throws(() => {
    getValueOfPathname({}, 'name.');
  });
  assert.equal(getValueOfPathname([], 'name'), null);
  assert.equal(getValueOfPathname(null, 'xxx'), null);
  assert.equal(getValueOfPathname({ name: 'quan' }, 'quan'), null);
  assert.equal(getValueOfPathname({ name: 'quan' }, 'name'), 'quan');
  assert.equal(getValueOfPathname({ name: 'quan' }, '.name'), 'quan');
  assert.equal(getValueOfPathname({ '.name': 'quan', name: 'cqq' }, '\\.name'), 'quan');
  assert.deepEqual(getValueOfPathname({ name: 'quan' }, ''), { name: 'quan' });
  assert.deepEqual(getValueOfPathname({ name: 'quan', obj: { foo: 'bar' } }, 'obj'), { foo: 'bar' });
  assert.equal(getValueOfPathname({ name: 'quan', obj: { name: 'bar' } }, 'obj.name'), 'bar');
  assert.equal(getValueOfPathname({ 'obj.name': 'xxx', name: 'quan', obj: { name: 'bar' } }, 'obj\\.name'), 'xxx');
});

test('getValueOfPathname of array', () => {
  assert.equal(getValueOfPathname([{ name: 'aa' }, { name: 'bb' }], '0.name'), 'aa');
  assert.equal(getValueOfPathname([{ name: 'aa' }, { name: 'bb' }], '5.name'), null);
  assert.equal(getValueOfPathname([{ name: 'aa' }, { name: 'bb' }], '5'), null);
});
