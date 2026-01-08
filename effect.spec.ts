import { effect, ref } from '../../src/reactivity'

test('scheduler merges multiple updates', () => {
  const count = ref(0)
  let updateCount = 0

  effect(() => {
    updateCount++
  })

  // 模拟高频更新
  for (let i = 0; i < 10; i++) {
    count.value++
  }

  // 验证只触发1次更新
  expect(updateCount).toBe(1)
})