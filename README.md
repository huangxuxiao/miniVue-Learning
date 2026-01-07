# MiniVue

## 介绍
Vue3框架优化项目- mini-vue 
基于社区优秀开源项目 MiniVue ，做了一些改进，重点修复了嵌套 ref 场景下的更新异常、优化了渲染调度机制以合并高频更新，并增强了 API 的上下文校验逻辑。

## 项目优化

1.修复嵌套 ref 更新异常
原项目无法处理 ref(ref(10)) 等嵌套场景，导致值更新后视图不刷新。
解决方案：在 packages/reactivity/src/reactive.js 中实现递归解包：

```js
function unwrap(val) {
  while (val && val.__v_isRef) val = val.value;
  return val;
}

效果：支持任意层级嵌套 ref，更新自动触发视图刷新（原项目仅处理单层 ref）。

2.优化渲染调度逻辑
原项目在连续多次状态更新时触发多次 DOM 渲染（如 setInterval 高频更新）。
解决方案：在 packages/reactivity/src/effect.js 中实现微任务队列：

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

效果：同一 tick 内多次更新合并为单次渲染，减少冗余 DOM 操作。

3. 增强开发体验
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

## 项目亮点

实现完整的响应式系统（reactive, ref, effect）
模拟虚拟 DOM 和 patch 更新流程
支持组件化设计和模板编译
使用 scheduler 实现异步更新调度
零依赖，纯 JavaScript 实现

## 项目结构（关键文件路径）

packages/
├── reactivity/
│   └── src/
│       └── reactive.js    //嵌套ref修复(第12-15行)
├── reactivity/
│   └── src/
│       └── effect.js      //调度优化(新增queueMicrotask逻辑)
└── api/
    └── src/
        └── index.js       //上下文校验(新增isInSetup检测)

## 技术栈
核心语言：JavaScript（ES6+）
构建工具：Vite（利用其快速热更新调试响应式系统）
测试验证：通过 examples/ 目录的测试用例（非Jest，避免依赖）
关键原理：响应式系统（reactive/ref）、虚拟 DOM、调度器（scheduler）
## Examples

[预览地址](https://github.com/huangxuxiao/miniVue-Learning.git)


## 本地运行 

# 1. 安装依赖  
npm install  

# 2. 启动开发服务器  
npm run dev  
