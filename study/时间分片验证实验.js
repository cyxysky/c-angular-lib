// 时间分片机制验证实验
console.log('🔬 时间分片机制验证实验');
console.log('================================');

function verifyEventLoopMechanism() {
  let chunkCount = 0;
  const maxChunks = 3;
  
  function processChunk() {
    chunkCount++;
    console.log(`\n📌 开始执行 Chunk ${chunkCount}`);
    console.log(`   当前时间: ${Date.now()}`);
    
    // 1. 先添加微任务（会在下个chunk前执行）
    Promise.resolve().then(() => {
      console.log(`   🔹 微任务 ${chunkCount}: 在chunk${chunkCount}完成后立即执行`);
    });
    
    queueMicrotask(() => {
      console.log(`   🔸 queueMicrotask ${chunkCount}: 也在chunk${chunkCount}完成后立即执行`);
    });
    
    // 2. 模拟计算工作（约50ms）
    const start = Date.now();
    let iterations = 0;
    while (Date.now() - start < 50) {
      Math.sqrt(Math.random());
      iterations++;
    }
    
    const workTime = Date.now() - start;
    console.log(`   ⚡ Chunk ${chunkCount} 工作完成: ${workTime}ms, ${iterations} 次迭代`);
    console.log(`   📤 即将释放主线程...`);
    
    // 3. 如果还有chunk，放入宏任务队列
    if (chunkCount < maxChunks) {
      setTimeout(processChunk, 0);
      console.log(`   🔄 setTimeout已调用，下一个chunk进入宏任务队列`);
    } else {
      console.log(`\n🎉 所有chunk处理完成！`);
      console.log('\n📋 总结：');
      console.log('   • 每个chunk执行后，微任务立即执行');
      console.log('   • 然后浏览器有机会进行渲染');
      console.log('   • 最后执行下一个宏任务(chunk)');
      console.log('   • 这就是时间分片保持界面响应的原理！');
    }
  }
  
  // 开始第一个chunk
  console.log('🚀 开始时间分片演示...');
  processChunk();
}

// 演示不同类型任务的执行顺序
function demonstrateTaskPriority() {
  console.log('\n\n🎯 任务优先级演示：');
  console.log('====================');
  
  // 宏任务
  setTimeout(() => {
    console.log('4️⃣ 宏任务: setTimeout');
  }, 0);
  
  // 微任务
  Promise.resolve().then(() => {
    console.log('2️⃣ 微任务: Promise.then');
  });
  
  queueMicrotask(() => {
    console.log('3️⃣ 微任务: queueMicrotask');
  });
  
  // 同步代码
  console.log('1️⃣ 同步代码: 立即执行');
  
  console.log('\n预期执行顺序：');
  console.log('1️⃣ 同步代码 → 2️⃣ Promise.then → 3️⃣ queueMicrotask → 4️⃣ setTimeout');
}

// 开始验证
verifyEventLoopMechanism();

// 3秒后演示任务优先级
setTimeout(() => {
  demonstrateTaskPriority();
}, 3000);

// 展示时间分片的真实价值
function showRealWorldBenefit() {
  console.log('\n\n💡 时间分片的真实价值演示：');
  console.log('===============================');
  
  let counter = 0;
  const maxCount = 1000000; // 大量计算
  
  function processWithSlicing() {
    const start = Date.now();
    
    // 每次处理5000项，约16ms
    while (counter < maxCount && Date.now() - start < 16) {
      Math.sqrt(counter);
      counter++;
    }
    
    const progress = (counter / maxCount * 100).toFixed(1);
    console.log(`   处理进度: ${progress}% (${counter}/${maxCount})`);
    
    if (counter < maxCount) {
      // 用户在这个间隙可以：
      console.log('   📱 用户现在可以点击按钮、滚动页面...');
      setTimeout(processWithSlicing, 0);
    } else {
      console.log('   ✅ 大量计算完成，界面始终保持响应！');
    }
  }
  
  processWithSlicing();
}

// 6秒后展示真实价值
setTimeout(() => {
  showRealWorldBenefit();
}, 6000); 