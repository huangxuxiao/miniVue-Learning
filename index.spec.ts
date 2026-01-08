import { ref, isRef } from '../../src/reactivity';

test('ref works outside setup for flexibility', () => {
  const count = ref(0);
  expect(count.value).toBe(0);
  expect(isRef(count)).toBe(true);

  count.value = 1;
  expect(count.value).toBe(1);
});