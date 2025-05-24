// JavaScript中的栈 vs 队列：LIFO vs FIFO

console.log('=== 栈 vs 队列的区别 ===');

// 1. 调用栈 (Call Stack) - LIFO (后进先出)
console.log('\n1. 调用栈演示 - LIFO:');

function first() {
  console.log('进入 first');
  second();
  console.log('退出 first');
}

function second() {
  console.log('进入 second');
  third();
  console.log('退出 second');
}

function third() {
  console.log('进入 third');
  console.log('退出 third');
}

first();

/* 调用栈变化过程 (LIFO):
1. [first] 
2. [first, second] 
3. [first, second, third] ← third 进栈
4. [first, second]        ← third 出栈 (后进先出)
5. [first]                ← second 出栈
6. []                     ← first 出栈

输出：
进入 first
进入 second  
进入 third
退出 third   ← 最后进入的最先退出
退出 second
退出 first
*/

// 2. 任务队列 (Task Queue) - FIFO (先进先出)
console.log('\n2. 宏任务队列演示 - FIFO:');

console.log('注册宏任务的顺序：');

setTimeout(() => {
  console.log('第1个注册的setTimeout');
}, 0);

setTimeout(() => {
  console.log('第2个注册的setTimeout');
}, 0);

setTimeout(() => {
  console.log('第3个注册的setTimeout');
}, 0);

/* 宏任务队列变化过程 (FIFO):
注册时：[task1, task2, task3]
执行时：
1. 执行 task1 (最先进入的最先执行)
2. 执行 task2
3. 执行 task3

输出顺序：
第1个注册的setTimeout ← 最先注册的最先执行
第2个注册的setTimeout
第3个注册的setTimeout
*/

// 3. 微任务队列也是 FIFO
console.log('\n3. 微任务队列演示 - FIFO:');

Promise.resolve().then(() => {
  console.log('第1个微任务');
});

Promise.resolve().then(() => {
  console.log('第2个微任务');
});

queueMicrotask(() => {
  console.log('第3个微任务');
});

/* 微任务队列也是 FIFO:
执行顺序：
第1个微任务 ← 最先注册的最先执行
第2个微任务
第3个微任务
*/

console.log('\n=== 总结对比 ===');
console.log('调用栈 (Call Stack): LIFO - 后进先出');
console.log('宏任务队列 (Macro Task Queue): FIFO - 先进先出');
console.log('微任务队列 (Micro Task Queue): FIFO - 先进先出');

// 4. 回到原问题的解释
console.log('\n=== 回到原问题 ===');

console.log('宏任务注册顺序:');
console.log('1. setTimeout1 (同步代码阶段注册)');
console.log('2. setTimeout2 (同步代码阶段注册)');

Promise.resolve().then(() => {
  console.log('3. 微任务1执行，现在注册"微任务1中的宏任务"');
  
  setTimeout(() => {
    console.log('4. 微任务1中的宏任务执行 (最后注册，所以最后执行)');
  }, 0);
});

/* 
宏任务队列是 FIFO，所以：
队列状态：[setTimeout1, setTimeout2, 微任务1中的宏任务]
执行顺序：  ↑第1个     ↑第2个      ↑第3个(最后)

这就是为什么"微任务1中的宏任务"最后执行！
*/ 