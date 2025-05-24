# queueMicrotask 详解

## 什么是 queueMicrotask？

`queueMicrotask()` 是一个全局函数，用于将一个函数排队到微任务队列中。它是浏览器提供的原生 Web API，可以直接调用。

## 基本语法

```javascript
queueMicrotask(callback);
```

- **callback**: 要排队执行的函数

## 在事件循环中的位置

### 事件循环优先级

```
浏览器主线程任务优先级（从高到低）：
┌─────────────────────────────────────┐
│ 1. 同步JavaScript代码                │ ← 最高优先级
├─────────────────────────────────────┤
│ 2. 微任务队列                        │
│    - Promise.then/catch/finally     │
│    - queueMicrotask()              │ ← 这里！
│    - MutationObserver              │
│    - process.nextTick (Node.js)    │
├─────────────────────────────────────┤
│ 3. 渲染阶段                          │
│    - requestAnimationFrame         │
│    - 样式计算、布局、绘制             │
├─────────────────────────────────────┤
│ 4. 宏任务队列                        │
│    - setTimeout/setInterval         │
│    - DOM 事件                       │
│    - MessageChannel                │
│    - I/O 操作                       │
└─────────────────────────────────────┘
```

## 与其他异步API的比较

### 执行顺序对比

```javascript
console.log('1. 同步代码开始');

// 宏任务
setTimeout(() => {
  console.log('5. setTimeout (宏任务)');
}, 0);

// 微任务 - Promise
Promise.resolve().then(() => {
  console.log('3. Promise.then (微任务)');
});

// 微任务 - queueMicrotask
queueMicrotask(() => {
  console.log('4. queueMicrotask (微任务)');
});

console.log('2. 同步代码结束');

/* 输出顺序：
1. 同步代码开始
2. 同步代码结束
3. Promise.then (微任务)
4. queueMicrotask (微任务)
5. setTimeout (宏任务)
*/
```

### 微任务队列内部的执行顺序

```javascript
// 微任务按照加入队列的顺序执行 (FIFO)
console.log('开始');

Promise.resolve().then(() => {
  console.log('第1个微任务');
});

queueMicrotask(() => {
  console.log('第2个微任务');
});

Promise.resolve().then(() => {
  console.log('第3个微任务');
});

queueMicrotask(() => {
  console.log('第4个微任务');
});

console.log('结束');

/* 输出：
开始
结束
第1个微任务
第2个微任务
第3个微任务
第4个微任务
*/
```

## 主要特点

### 1. 比宏任务优先级高

```javascript
console.log('同步代码');

setTimeout(() => {
  console.log('宏任务：setTimeout');
}, 0);

queueMicrotask(() => {
  console.log('微任务：queueMicrotask');
});

/* 输出：
同步代码
微任务：queueMicrotask
宏任务：setTimeout
*/
```

### 2. 可以在微任务中创建新的微任务

```javascript
console.log('开始');

queueMicrotask(() => {
  console.log('微任务1');
  
  // 在微任务中创建新的微任务
  queueMicrotask(() => {
    console.log('微任务1中的微任务');
  });
});

queueMicrotask(() => {
  console.log('微任务2');
});

console.log('结束');

/* 输出：
开始
结束
微任务1
微任务2
微任务1中的微任务
*/
```

### 3. 微任务队列必须清空才能执行宏任务

```javascript
setTimeout(() => {
  console.log('宏任务');
}, 0);

queueMicrotask(() => {
  console.log('微任务1');
  
  // 创建大量微任务
  for (let i = 0; i < 5; i++) {
    queueMicrotask(() => {
      console.log(`嵌套微任务 ${i}`);
    });
  }
});

/* 输出：
微任务1
嵌套微任务 0
嵌套微任务 1
嵌套微任务 2
嵌套微任务 3
嵌套微任务 4
宏任务  ← 等所有微任务完成后才执行
*/
```

## 使用场景

### 1. 延迟执行但保持高优先级

```javascript
function updateUI() {
  // 立即进行 DOM 操作
  const element = document.getElementById('myElement');
  element.textContent = 'Updated!';
  
  // 在当前执行栈完成后立即执行后续操作
  queueMicrotask(() => {
    // 这会在DOM更新后、下一个宏任务前执行
    console.log('DOM已更新');
    element.classList.add('highlight');
  });
}
```

### 2. 批量操作优化

```javascript
class BatchProcessor {
  constructor() {
    this.pendingOperations = [];
    this.isProcessing = false;
  }
  
  addOperation(operation) {
    this.pendingOperations.push(operation);
    
    if (!this.isProcessing) {
      this.isProcessing = true;
      
      // 使用 queueMicrotask 批量处理
      queueMicrotask(() => {
        this.processBatch();
      });
    }
  }
  
  processBatch() {
    const operations = this.pendingOperations.splice(0);
    
    // 批量执行所有操作
    operations.forEach(operation => operation());
    
    this.isProcessing = false;
  }
}
```

### 3. 确保执行顺序

```javascript
function processData(data) {
  // 同步处理数据
  const processedData = data.map(item => item * 2);
  
  // 确保在下一个事件循环周期之前执行
  queueMicrotask(() => {
    // 这里的代码会在当前同步代码完成后立即执行
    // 但在任何宏任务（如setTimeout）之前执行
    console.log('数据处理完成:', processedData);
    updateUI(processedData);
  });
  
  return processedData;
}
```

### 4. 时间分片中的协调

```javascript
function timeSlicedTask(data, chunkSize = 1000) {
  let index = 0;
  
  function processChunk() {
    const endIndex = Math.min(index + chunkSize, data.length);
    
    // 处理当前块
    for (let i = index; i < endIndex; i++) {
      // 处理 data[i]
    }
    
    index = endIndex;
    
    if (index < data.length) {
      // 使用 queueMicrotask 确保高优先级继续处理
      queueMicrotask(() => {
        // 检查是否需要让出控制权
        if (performance.now() - startTime > 16) {
          // 如果超过16ms，使用setTimeout让出控制权
          setTimeout(processChunk, 0);
        } else {
          // 否则继续处理
          processChunk();
        }
      });
    }
  }
  
  const startTime = performance.now();
  processChunk();
}
```

## 与 Promise.then 的区别

### 功能上的相似性

```javascript
// 这两种方式效果基本相同
Promise.resolve().then(() => {
  console.log('Promise.then');
});

queueMicrotask(() => {
  console.log('queueMicrotask');
});
```

### queueMicrotask 的优势

1. **更直接**: 不需要创建 Promise 对象
2. **更轻量**: 没有 Promise 的开销
3. **语义更清晰**: 明确表示要排队一个微任务

```javascript
// queueMicrotask - 更简洁
queueMicrotask(callback);

// Promise.then - 需要额外的Promise对象
Promise.resolve().then(callback);
```

## 浏览器兼容性

- **Chrome**: 71+
- **Firefox**: 69+
- **Safari**: 13.1+
- **Edge**: 79+

### Polyfill

```javascript
if (typeof queueMicrotask !== 'function') {
  window.queueMicrotask = function(callback) {
    Promise.resolve().then(callback).catch(err => {
      setTimeout(() => { throw err; }, 0);
    });
  };
}
```

## 注意事项

### 1. 避免无限循环

```javascript
// ❌ 危险：可能导致无限循环
function badExample() {
  queueMicrotask(() => {
    console.log('这会一直执行');
    badExample(); // 递归调用，永远不会停止
  });
}

// ✅ 正确：有终止条件
function goodExample(count = 0) {
  if (count >= 10) return; // 终止条件
  
  queueMicrotask(() => {
    console.log(`第 ${count + 1} 次执行`);
    goodExample(count + 1);
  });
}
```

### 2. 不要阻塞微任务队列

```javascript
// ❌ 不好：长时间运行的微任务会阻塞渲染
queueMicrotask(() => {
  for (let i = 0; i < 10000000; i++) {
    // 大量计算会阻塞主线程
    Math.sqrt(i);
  }
});

// ✅ 更好：使用时间分片
function processLargeTask(data) {
  let index = 0;
  const chunkSize = 1000;
  
  function processChunk() {
    const endIndex = Math.min(index + chunkSize, data.length);
    
    for (let i = index; i < endIndex; i++) {
      // 处理数据
    }
    
    index = endIndex;
    
    if (index < data.length) {
      // 使用 setTimeout 让出控制权
      setTimeout(processChunk, 0);
    }
  }
  
  processChunk();
}
```

## 实际应用示例

### DOM 操作后的清理工作

```javascript
function removeElement(elementId) {
  const element = document.getElementById(elementId);
  
  if (element) {
    // 立即移除元素
    element.remove();
    
    // 在微任务中进行清理工作
    queueMicrotask(() => {
      // 清理相关的事件监听器
      cleanupEventListeners(elementId);
      
      // 通知其他组件
      notifyElementRemoved(elementId);
      
      // 更新状态
      updateApplicationState();
    });
  }
}
```

### 状态同步

```javascript
class StateManager {
  constructor() {
    this.state = {};
    this.listeners = [];
    this.pendingNotification = false;
  }
  
  setState(newState) {
    // 立即更新状态
    this.state = { ...this.state, ...newState };
    
    // 批量通知监听器
    if (!this.pendingNotification) {
      this.pendingNotification = true;
      
      queueMicrotask(() => {
        this.notifyListeners();
        this.pendingNotification = false;
      });
    }
  }
  
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.state);
    });
  }
}
```

## 总结

`queueMicrotask` 是一个强大的工具，它：

- ✅ 提供了直接访问微任务队列的能力
- ✅ 比宏任务有更高的执行优先级
- ✅ 适合需要在当前执行栈完成后立即执行的操作
- ✅ 语法简洁，性能优异

**使用场景**：
- DOM 操作后的立即处理
- 批量操作优化
- 状态同步
- 确保执行顺序

**注意事项**：
- 避免创建无限循环的微任务
- 不要在微任务中执行长时间运行的代码
- 合理使用，避免阻塞渲染 