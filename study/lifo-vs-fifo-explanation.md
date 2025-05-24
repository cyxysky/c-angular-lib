# JavaScript中的LIFO vs FIFO

## 您的困惑解答

**您问的是对的，但是指的是不同的数据结构！**

JavaScript中有两种不同的数据结构：

## 1. 调用栈 (Call Stack) - LIFO 后进先出 ✅

```
栈的特性：后进先出 (LIFO - Last In, First Out)

函数调用过程：
进栈 →  [first]
       [first, second]  ← second进栈
       [first, second, third]  ← third进栈
出栈 ←  [first, second]  ← third出栈（最后进入的最先出来）
       [first]  ← second出栈
       []  ← first出栈
```

## 2. 任务队列 (Task Queue) - FIFO 先进先出 ✅

```
队列的特性：先进先出 (FIFO - First In, First Out)

宏任务队列：
入队 → [setTimeout1] 
      [setTimeout1, setTimeout2]  ← setTimeout2入队
      [setTimeout1, setTimeout2, 微任务1中的宏任务]  ← 最后入队
出队 ← [setTimeout2, 微任务1中的宏任务]  ← setTimeout1出队（最先进入的最先出来）
      [微任务1中的宏任务]  ← setTimeout2出队
      []  ← 微任务1中的宏任务出队
```

## 对比图解

### 栈 (LIFO)
```
↑ 出栈方向
│ [C] ← 最后进入，最先出来
│ [B]
│ [A] ← 最先进入，最后出来
└─────
  底部
```

### 队列 (FIFO)  
```
出队 ← [A][B][C] ← 入队
       ↑        ↑
   最先进入    最后进入
   最先出来    最后出来
```

## 回到您的原问题

**宏任务队列使用 FIFO (先进先出)：**

```
时间顺序：
T1: setTimeout1 注册  → [setTimeout1]
T2: setTimeout2 注册  → [setTimeout1, setTimeout2]  
T3: 微任务1执行，注册"微任务1中的宏任务" → [setTimeout1, setTimeout2, 微任务1中的宏任务]

执行顺序 (FIFO)：
1. setTimeout1 (最先注册，最先执行)
2. setTimeout2
3. 微任务1中的宏任务 (最后注册，最后执行)
```

## 总结

| 数据结构 | 用途 | 规则 | 例子 |
|---------|------|------|------|
| **调用栈** | 函数调用 | LIFO (后进先出) | function调用和返回 |
| **宏任务队列** | 异步任务 | FIFO (先进先出) | setTimeout, DOM事件 |
| **微任务队列** | 异步任务 | FIFO (先进先出) | Promise.then, queueMicrotask |

**所以：**
- ✅ 调用栈确实是LIFO (您说得对)
- ✅ 但任务队列是FIFO (这就是为什么最后注册的宏任务最后执行)

这就解释了为什么"微任务1中的宏任务"最后执行！ 