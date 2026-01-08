import { ref, isRef } from '../../src/reactivity'

test('nested ref returns original ref', () => {
  const count = ref(1)
  const nested = ref(count)

  // 验证避免嵌套：nested 和 count 是同一个对象
  expect(nested).toBe(count)

  //  验证值访问
  expect(nested.value).toBe(1)
  expect(isRef(nested)).toBe(true)  // nested 本身是 ref
  expect(isRef(nested.value)).toBe(false) // .value 是原始值

  // 验证更新
  count.value = 2
  expect(nested.value).toBe(2)
})