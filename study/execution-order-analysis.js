// 详细分析：为什么'微任务1中的宏任务'会在最后执行？

console.log('开始');

setTimeout(() => {
  console.log('宏任务1');
  Promise.resolve().then(() => {
    console.log('宏任务1中的微任务');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('微任务1');
  
  setTimeout(() => {
    console.log('微任务1中的宏任务'); // ← 这个为什么最后执行？
  }, 0);
  
  Promise.resolve().then(() => {
    console.log('微任务1中的微任务');
  });
});

setTimeout(() => {
  console.log('宏任务2');
}, 0);

Promise.resolve().then(() => {
  console.log('微任务2');
});

console.log('结束');

/* 
执行顺序详细分析：

=== 初始状态 ===
宏任务队列：[setTimeout1, setTimeout2]
微任务队列：[微任务1, 微任务2]

=== 第1步：执行同步代码 ===
输出：开始
输出：结束

=== 第2步：清空微任务队列 ===
执行微任务1：
  - 输出：微任务1
  - 新增宏任务到队列末尾：'微任务1中的宏任务'
  - 新增微任务：'微任务1中的微任务'
  
现在队列状态：
宏任务队列：[setTimeout1, setTimeout2, 微任务1中的宏任务]
微任务队列：[微任务2, 微任务1中的微任务]

执行微任务2：
  - 输出：微任务2

执行微任务1中的微任务：
  - 输出：微任务1中的微任务

微任务队列清空完毕！

=== 第3步：执行第一个宏任务 ===
执行setTimeout1：
  - 输出：宏任务1
  - 新增微任务：'宏任务1中的微任务'

现在队列状态：
宏任务队列：[setTimeout2, 微任务1中的宏任务]
微任务队列：[宏任务1中的微任务]

=== 第4步：清空微任务队列 ===
执行宏任务1中的微任务：
  - 输出：宏任务1中的微任务

=== 第5步：执行第二个宏任务 ===
执行setTimeout2：
  - 输出：宏任务2

现在队列状态：
宏任务队列：[微任务1中的宏任务]
微任务队列：[]

=== 第6步：执行最后的宏任务 ===
执行微任务1中的宏任务：
  - 输出：微任务1中的宏任务

最终输出顺序：
开始
结束
微任务1
微任务2
微任务1中的微任务
宏任务1
宏任务1中的微任务
宏任务2
微任务1中的宏任务 ← 最后执行！

=== 为什么'微任务1中的宏任务'最后执行？ ===

1. 时间因素：
   - setTimeout1 和 setTimeout2 在同步代码阶段就注册了
   - '微任务1中的宏任务' 是在微任务1执行时才注册的

2. 队列顺序：
   - 宏任务队列遵循 FIFO（先进先出）原则
   - '微任务1中的宏任务' 后注册，所以排在队列末尾

3. 事件循环机制：
   - 每执行完一个宏任务，必须清空所有微任务
   - 然后才能执行下一个宏任务
   - 所以要等 setTimeout1、setTimeout2 及其产生的微任务都执行完

*/

// 时间线可视化
console.log('\n=== 时间线可视化 ===');
console.log('时刻T0: 注册 setTimeout1 和 setTimeout2');
console.log('时刻T1: 执行微任务1，注册"微任务1中的宏任务"');
console.log('时刻T2: 执行 setTimeout1');  
console.log('时刻T3: 执行 setTimeout2');
console.log('时刻T4: 执行"微任务1中的宏任务"（最后）');

// 为什么promise1先于timer2执行 - 详细分析

console.log('start');

setTimeout(() => {
  console.log('timer1');
  Promise.resolve().then(() => {
    console.log('promise1');
  });
}, 0);

setTimeout(() => {
  console.log('timer2');
  Promise.resolve().then(() => {
    console.log('promise2');
  });
}, 0);

console.log('end');

/* 
=== 详细执行分析 ===

初始状态：
- 调用栈：[main]
- 宏任务队列：[]
- 微任务队列：[]

第1步 - 执行同步代码：
1. console.log('start') → 输出 "start"
2. 注册第一个setTimeout → 宏任务队列：[timer1]
3. 注册第二个setTimeout → 宏任务队列：[timer1, timer2]
4. console.log('end') → 输出 "end"

同步代码执行完毕，开始事件循环...

第2步 - 第一轮事件循环：
事件循环规则：执行一个宏任务 → 清空所有微任务 → 执行下一个宏任务

1. 执行第一个宏任务 timer1：
   - console.log('timer1') → 输出 "timer1"
   - Promise.resolve().then() → 微任务队列：[promise1]
   
   当前状态：
   - 宏任务队列：[timer2]
   - 微任务队列：[promise1]

2. 检查微任务队列（这是关键！）：
   - 发现有微任务 promise1，必须先执行
   - console.log('promise1') → 输出 "promise1"
   - 微任务队列清空：[]

3. 微任务队列已清空，可以执行下一个宏任务

第3步 - 第二轮事件循环：
1. 执行第二个宏任务 timer2：
   - console.log('timer2') → 输出 "timer2"
   - Promise.resolve().then() → 微任务队列：[promise2]

2. 检查微任务队列：
   - 执行 promise2 → 输出 "promise2"
   - 微任务队列清空：[]

最终输出顺序：
start
end
timer1
promise1  ← 这里！先于timer2执行
timer2
promise2

=== 核心机制解释 ===

您的理解完全正确！事件循环的规则是：
1. 执行一个宏任务
2. 立即检查微任务队列，如果有微任务就全部执行完
3. 才能执行下一个宏任务

这就是为什么promise1会先于timer2执行！
*/

// 可视化展示
console.log('\n=== 事件循环可视化 ===');

function visualizeEventLoop() {
  console.log('宏任务队列状态变化：');
  console.log('初始：[timer1, timer2]');
  console.log('执行timer1后：[timer2] + 微任务[promise1]');
  console.log('清空微任务后：[timer2] + 微任务[]');
  console.log('执行timer2后：[] + 微任务[promise2]');
  console.log('清空微任务后：[] + 微任务[]');
  
  console.log('\n关键规则：每个宏任务执行完，必须清空微任务队列！');
}

visualizeEventLoop();

// 对比：如果没有微任务优先级
console.log('\n=== 假如没有微任务优先级（错误示例）===');
console.log('如果是简单的队列执行，顺序会是：');
console.log('start → end → timer1 → timer2 → promise1 → promise2');
console.log('但实际上JavaScript的事件循环有微任务优先级机制！');

// 实际验证
console.log('\n=== 实际验证 ===');
console.log('您可以运行开头的代码，会看到输出：');
console.log('start');
console.log('end'); 
console.log('timer1');
console.log('promise1');  // ← 先于timer2！
console.log('timer2');
console.log('promise2'); 

// Promise执行顺序详细分析
console.log('🔍 Promise执行顺序分析');
console.log('================================\n');

// 您的问题非常精准！让我们详细分析执行顺序

console.log('📚 关键理解：Promise创建 vs await等待');
console.log('');

async function demonstrateExecutionOrder() {
  console.log('🚀 函数开始执行...');
  
  console.log('📍 步骤1: 创建Promise1（3秒）');
  const promise1 = new Promise(resolve => {
    console.log('   ⚡ Promise1的setTimeout开始计时（3秒）');
    setTimeout(() => {
      console.log('   📦 Promise 1 完成（3秒后）');
      resolve('结果1');
    }, 3000);
  });
  
  console.log('📍 步骤2: 创建Promise2（2秒）');
  const promise2 = new Promise(resolve => {
    console.log('   ⚡ Promise2的setTimeout开始计时（2秒）');
    setTimeout(() => {
      console.log('   📦 Promise 2 完成（2秒后）');
      resolve('结果2');
    }, 2000);
  });
  
  console.log('📍 步骤3: 创建Promise3（1秒）');
  const promise3 = new Promise(resolve => {
    console.log('   ⚡ Promise3的setTimeout开始计时（1秒）');
    setTimeout(() => {
      console.log('   📦 Promise 3 完成（1秒后）');
      resolve('结果3');
    }, 1000);
  });
  
  console.log('📍 步骤4: 现在所有Promise都在并行执行！');
  console.log('🎯 开始await Promise1（等待3秒）...');
  console.log('   注意：函数在此处暂停，但其他Promise继续执行');
  
  const result1 = await promise1; // 函数在这里暂停3秒
  console.log('✅ Promise1完成，函数恢复执行，获得结果1:', result1);
  
  console.log('🎯 await Promise2（应该立即返回）...');
  const result2 = await promise2;
  console.log('✅ 获得结果2:', result2);
  
  console.log('🎯 await Promise3（应该立即返回）...');
  const result3 = await promise3;
  console.log('✅ 获得结果3:', result3);
  
  console.log('🎉 函数执行完毕\n');
}

// 对比：串行创建Promise
async function serialPromiseDemo() {
  console.log('📊 对比：串行创建Promise的执行顺序');
  
  console.log('🎯 await第一个Promise（现在创建并等待3秒）...');
  const result1 = await new Promise(resolve => {
    console.log('   ⚡ 现在才开始Promise1的计时');
    setTimeout(() => {
      console.log('   📦 Promise 1 完成');
      resolve('结果1');
    }, 3000);
  });
  console.log('✅ 获得结果1:', result1);
  
  console.log('🎯 await第二个Promise（现在才创建并等待2秒）...');
  const result2 = await new Promise(resolve => {
    console.log('   ⚡ 现在才开始Promise2的计时');
    setTimeout(() => {
      console.log('   📦 Promise 2 完成');
      resolve('结果2');
    }, 2000);
  });
  console.log('✅ 获得结果2:', result2);
  
  console.log('🎯 await第三个Promise（现在才创建并等待1秒）...');
  const result3 = await new Promise(resolve => {
    console.log('   ⚡ 现在才开始Promise3的计时');
    setTimeout(() => {
      console.log('   📦 Promise 3 完成');
      resolve('结果3');
    }, 1000);
  });
  console.log('✅ 获得结果3:', result3);
  
  console.log('📊 总耗时：6秒（3+2+1）\n');
}

// 时间线分析
function timelineAnalysis() {
  console.log('⏰ 时间线分析：');
  console.log('================================');
  console.log('');
  console.log('第一种方式（并行创建）：');
  console.log('时间点    发生事件');
  console.log('0秒      创建Promise1、2、3，所有setTimeout开始计时');
  console.log('0秒      await Promise1，函数暂停');
  console.log('1秒      Promise3完成（但函数还在等Promise1）');
  console.log('2秒      Promise2完成（但函数还在等Promise1）');
  console.log('3秒      Promise1完成，函数恢复，await Promise2立即返回');
  console.log('3秒      await Promise3立即返回');
  console.log('总耗时：3秒');
  console.log('');
  console.log('第二种方式（串行创建）：');
  console.log('时间点    发生事件');
  console.log('0秒      创建Promise1，开始计时');
  console.log('3秒      Promise1完成，创建Promise2');
  console.log('5秒      Promise2完成，创建Promise3');
  console.log('6秒      Promise3完成');
  console.log('总耗时：6秒');
}

// 执行演示
console.log('🎬 演示1：并行创建Promise');
demonstrateExecutionOrder();

setTimeout(() => {
  console.log('\n🎬 演示2：串行创建Promise');
  serialPromiseDemo();
}, 5000);

setTimeout(() => {
  timelineAnalysis();
}, 12000);

// 关键解释
setTimeout(() => {
  console.log('\n💡 回答您的问题：');
  console.log('================================');
  console.log('');
  console.log('❓ 为什么先输出"Promise 3 完成"再输出"获得结果1"？');
  console.log('');
  console.log('✅ 答案：');
  console.log('1️⃣ Promise1、2、3在函数开始时就同时创建了');
  console.log('2️⃣ 所有setTimeout同时开始计时（并行执行）');
  console.log('3️⃣ await promise1让函数暂停，等待Promise1完成');
  console.log('4️⃣ 在等待期间，Promise3（1秒）和Promise2（2秒）先完成');
  console.log('5️⃣ 但函数被await promise1阻塞，必须等Promise1完成才能继续');
  console.log('6️⃣ Promise1完成后，函数恢复，打印"获得结果1"');
  console.log('');
  console.log('🔑 关键点：');
  console.log('• Promise的创建和执行是立即的');
  console.log('• await只阻塞当前函数，不阻塞Promise的执行');
  console.log('• 多个Promise可以并行执行，await只等待特定的那一个');
}, 15000); 