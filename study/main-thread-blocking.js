// 主线程阻塞 vs 非阻塞的详细解释

console.log('=== 主线程执行机制解析 ===');

// 重要概念澄清：JavaScript是单线程的，只有一个主线程！

console.log('\n1. 微任务和宏任务执行时，主线程是被占用的:');

console.log('开始执行');

// 这个Promise.then执行时会占用主线程
Promise.resolve().then(() => {
  console.log('微任务开始执行');
  
  // 模拟微任务中的重计算（会阻塞主线程）
  let start = Date.now();
  while (Date.now() - start < 1000) {
    // 1秒的计算，主线程被完全占用
  }
  
  console.log('微任务执行完毕（主线程被占用了1秒）');
});

// 这个setTimeout的回调执行时也会占用主线程
setTimeout(() => {
  console.log('宏任务开始执行');
  
  // 模拟宏任务中的重计算（会阻塞主线程）
  let start = Date.now();
  while (Date.now() - start < 1000) {
    // 1秒的计算，主线程被完全占用
  }
  
  console.log('宏任务执行完毕（主线程被占用了1秒）');
}, 0);

console.log('同步代码结束');

console.log('\n=== 非阻塞的真正含义 ===');

// 非阻塞指的是"等待期间"不阻塞主线程
console.log('发起异步操作...');

// 1. 网络请求的等待期间不阻塞主线程
fetch('https://api.github.com/users/octocat').then(response => {
  console.log('网络请求完成 - 但这个回调执行时会占用主线程');
  return response.json();
}).then(data => {
  console.log('数据处理完成');
});

// 2. 定时器的等待期间不阻塞主线程
setTimeout(() => {
  console.log('3秒后执行 - 但这个回调执行时会占用主线程');
}, 3000);

// 3. 文件读取的等待期间不阻塞主线程（Node.js示例）
// fs.readFile('file.txt', (err, data) => {
//   console.log('文件读取完成 - 但这个回调执行时会占用主线程');
// });

// 主线程继续执行其他代码
console.log('主线程继续执行其他任务...');
console.log('这些代码不会被上面的异步操作阻塞');

console.log('\n=== 对比：同步 vs 异步 ===');

// 同步操作 - 会阻塞主线程
function syncHeavyTask() {
  console.log('同步任务开始');
  let start = Date.now();
  while (Date.now() - start < 2000) {
    // 2秒的同步计算，完全阻塞主线程
  }
  console.log('同步任务结束 - 主线程被阻塞了2秒');
}

// 异步操作 - 等待期间不阻塞主线程
function asyncHeavyTask() {
  console.log('异步任务开始');
  
  setTimeout(() => {
    console.log('异步任务的回调开始');
    let start = Date.now();
    while (Date.now() - start < 2000) {
      // 2秒的计算，在回调执行时占用主线程
    }
    console.log('异步任务的回调结束 - 主线程在回调执行期间被占用了2秒');
  }, 1000);
  
  console.log('异步任务设置完毕 - 主线程立即继续执行');
}

console.log('\n测试同步任务:');
syncHeavyTask();
console.log('同步任务后的代码');

console.log('\n测试异步任务:');
asyncHeavyTask();
console.log('异步任务后的代码 - 立即执行，不等待');

console.log('\n=== 总结 ===');
console.log('1. JavaScript只有一个主线程');
console.log('2. 微任务和宏任务的回调执行时会占用主线程');
console.log('3. 但异步操作的等待期间不会阻塞主线程');
console.log('4. Web APIs（如setTimeout、fetch）在浏览器的其他线程中处理');
console.log('5. 当异步操作完成时，回调被放入任务队列，等待主线程执行');

queueMicrotask(() => {
  console.log('queueMicrotask 1');
});


requestIdleCallback(() => {
  console.log('requestIdleCallback 1');
});

/* 
关键理解：

✅ 非阻塞的部分：
- setTimeout的计时过程（由浏览器其他线程处理）
- 网络请求的等待过程（由浏览器网络线程处理）
- 文件I/O的等待过程（由操作系统处理）

❌ 会占用主线程的部分：
- 微任务的回调执行
- 宏任务的回调执行
- 所有JavaScript代码的执行
- Promise构造函数的执行
*/ 