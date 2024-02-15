import assert from 'node:assert';
import test from 'node:test';
import getValueOfPathname from './getValueOfPathname.mjs';

test('getValueOfPathname', () => {
  assert.throws(() => {
    getValueOfPathname({}, 11);
  });
  assert.equal(getValueOfPathname([], 'name'), null);
  assert.equal(getValueOfPathname(null, 'xxx'), null);
  assert.equal(getValueOfPathname({ name: 'quan' }, 'quan'), null);
  assert.equal(getValueOfPathname({ name: 'quan' }, 'name'), 'quan');
  assert.deepEqual(getValueOfPathname({ name: 'quan' }, ''), { name: 'quan' });
  assert.deepEqual(getValueOfPathname({ name: 'quan', obj: { foo: 'bar' } }, 'obj'), { foo: 'bar' });
  assert.equal(getValueOfPathname({ name: 'quan', obj: { name: 'bar' } }, 'obj.name'), 'bar');
  assert.equal(getValueOfPathname({ 'obj.name': 'xxx', name: 'quan', obj: { name: 'bar' } }, 'obj\\.name'), 'xxx');
});
