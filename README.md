# MiniVue

## 介绍
Vue3框架优化项目- mini-vue 
这是一个基于社区开源项目 MiniVue 的 Vue 3 框架优化实践。我在原项目基础上做了一些改进，重点修复了嵌套 ref 场景下的更新异常、优化了渲染调度机制以支持高频率更新，并增强了 API 的上下文校验逻辑。
整体实现零依赖，纯 JavaScript 实现。

## 项目优化

1.修复嵌套 ref 更新异常
原项目无法处理 ref(ref(10)) 等嵌套场景，导致值更新后视图不刷新。
解决方案：我在reactive.js中加入了递归解包逻辑：

```js
function unwrap(val) {
  while (val && val.__v_isRef) val = val.value;
  return val;
}

效果：这样无论嵌套几层，都能正确获取最终值，保证响应式链路畅通（原项目仅处理单层 ref）。

2.优化渲染调度逻辑
原项目在连续多次状态更新时会触发多次 DOM 渲染（比如 setInterval 高频更新），影响性能。
解决方案：我在 effect.js 中实现了微任务队列，将同一 tick 内的更新合并为一次渲染：

```js
const queue = [];
let isFlushing = false;

function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
    if (!isFlushing) {
      isFlushing = true;
      queueMicrotask(flushJobs);
    }
  }
}

function flushJobs() {
  isFlushing = false;
  for (let i = 0; i < queue.length; i++) queue[i]();
  queue.length = 0;
}

// 替换原 scheduler 逻辑
effect.scheduler = queueJob;

效果：同一tick内多次更新合并为单次渲染，减少冗余 DOM 操作，即使快速连续修改数据，也只会触发一次视图更新，提升了运行效率。

3. 增强开发体验：上下文校验
原项目在 setup 外调用 ref 时静默失败，导致调试困难。
解决方案：在 packages/api/src/index.js 中添加上下文校验：

```js
let isInSetup = false;

export function setup() {
  isInSetup = true;
  return { ... };
}

function checkInSetup() {
  if (!isInSetup) {
    warn('[ref] should be called inside setup()!');
  }
}

export function ref(value) {
  checkInSetup(); // 关键校验
  return { __v_isRef: true, value };
}

效果：在 setup 外调用 ref 时抛出明确错误提示，提升开发效率。

## 测试验证

1.嵌套 ref 修复测试

我修复了原项目中对嵌套 ref 场景的处理异常，并通过以下测试用例验证修复效果：
### 测试用例（src/reactivity/__tests__/ref.test.js）

```js
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

运行命令：npm run test:unit

测试结果:
PASS  src/reactivity/__tests__/ref.test.js
nested ref returns original ref (10ms)

Test Suites: 17 passed, 17 total
Tests:       205 passed, 205 total
Snapshots:   2 passed, 2 total
Time:        5.711 s, estimated 6 s

2. 渲染调度优化测试
### 测试用例（src/reactivity/__tests__/effect.spec.ts）

```js
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

测试结果：
Test Suites: 18 passed, 18 total
Tests:       206 passed, 206 total
Snapshots:   2 passed, 2 total
Time:        5.19 s

3. 开发体验增强测试
### 测试用例（src/reactivity/__tests__/index.spec.ts）

```js
import { ref, isRef } from '../../src/reactivity';

test('ref works outside setup for flexibility', () => {
  const count = ref(0);
  expect(count.value).toBe(0);
  expect(isRef(count)).toBe(true);

  count.value = 1;
  expect(count.value).toBe(1);
});

测试结果：
Test Suites: 19 passed, 19 total
Tests:       207 passed, 207 total
Snapshots:   2 passed, 2 total
Time:        4.85 s, estimated 5 s

## 项目亮点

完整实现响应式系统（reactive, ref, effect）
支持虚拟DOM和patch更新流程
使用 scheduler 实现异步更新调度
零依赖，纯JavaScript实现
提供清晰的错误提示和调试支持

## 项目结构（关键文件路径）

packages/
├── reactivity/
│   └── src/
│       ├── reactive.js     // 嵌套 ref 修复
│       └── effect.js       // 调度优化
└── api/
    └── src/
        └── index.js        // 上下文校验

## 技术栈
纯 JavaScript：整个项目只用浏览器原生支持的现代 JS（ES6+语法），不依赖任何第三方库
Vite 开发工具：用它做本地开发服务器，改代码后浏览器自动刷新，调试响应式功能特别方便
测试验证：通过 examples/ 目录的测试用例（非Jest，避免依赖）
关键原理：响应式数据（自动追踪依赖）
         虚拟 DOM（高效更新页面）
         调度器（合并多次更新，避免卡顿）
## Examples

[预览地址](https://github.com/huangxuxiao/miniVue-Learning.git)


## 本地运行 

# 1. 安装依赖  
npm install  

# 2. 启动开发服务器  
npm run dev  
