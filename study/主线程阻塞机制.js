// 主线程阻塞 vs 函数阻塞的重要区别
console.log('🎯 两个层面的"阻塞"机制详解');
console.log('================================\n');

// 用户的观察非常准确！需要区分两个层面：

console.log('📋 重要区分：');
console.log('✅ 您说得对：对于当前async函数，await确实是"阻塞"的');
console.log('✅ 同时也对：对于主线程，await是"非阻塞"的');
console.log('');

// 1. 函数层面的阻塞演示
console.log('🔍 1. 函数层面的await阻塞：');

async function functionLevelBlocking() {
  console.log('\n📌 函数开始执行');
  console.log('📌 步骤1: 准备执行');
  
  console.log('📌 步骤2: 即将await（函数将在此暂停）');
  const result = await new Promise(resolve => {
    setTimeout(() => {
      resolve('异步结果');
    }, 2000);
  });
  
  // 这行代码要等到上面的Promise完成才会执行
  console.log('📌 步骤3: await完成，函数继续执行');
  console.log('📌 步骤4: 获得结果:', result);
  console.log('📌 函数结束\n');
  
  return result;
}

// 2. 主线程层面的非阻塞演示
console.log('🔍 2. 主线程层面的非阻塞：');

function demonstrateBothLevels() {
  console.log('\n🚀 开始双层演示...');
  
  // 启动第一个async函数
  functionLevelBlocking().then(result => {
    console.log('🎉 第一个函数最终完成:', result);
  });
  
  // 同时启动第二个async函数
  async function secondFunction() {
    console.log('🔷 第二个函数开始');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('🔷 第二个函数完成');
  }
  secondFunction();
  
  // 同时设置定时器
  let counter = 0;
  const timer = setInterval(() => {
    counter++;
    console.log(`⏰ 主线程定时器第${counter}次执行`);
    if (counter >= 4) {
      clearInterval(timer);
      console.log('⏰ 定时器结束\n');
    }
  }, 500);
  
  console.log('📝 注意观察：');
  console.log('   • 第一个函数在await处"暂停"');
  console.log('   • 但主线程继续执行第二个函数和定时器');
}

demonstrateBothLevels();

// 3. 更直观的对比
setTimeout(() => {
  console.log('🎭 3. 更直观的对比演示：');
  
  async function sequentialDemo() {
    console.log('\n🔗 顺序执行演示（函数层面的"阻塞"）：');
    
    console.log('   步骤A: 开始');
    
    console.log('   步骤B: await第一个操作...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('   步骤B: 第一个操作完成');
    
    console.log('   步骤C: await第二个操作...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('   步骤C: 第二个操作完成');
    
    console.log('   步骤D: 全部完成');
    console.log('   📊 总耗时约2秒（步骤B和C串行执行）\n');
  }
  
  sequentialDemo();
}, 3000);

// 4. 关键澄清
setTimeout(() => {
  console.log('💡 4. 关键概念澄清：');
  console.log('================================');
  console.log('');
  console.log('🎯 您的观察完全正确：');
  console.log('');
  console.log('📍 函数层面（微观）：');
  console.log('   ✅ await确实会"阻塞"当前async函数');
  console.log('   ✅ 函数在await处暂停，等待Promise完成');
  console.log('   ✅ await后面的代码必须等待前面完成');
  console.log('');
  console.log('📍 主线程层面（宏观）：');
  console.log('   ✅ await不会"阻塞"主线程');
  console.log('   ✅ 其他函数和任务可以继续执行');
  console.log('   ✅ 用户界面保持响应');
  console.log('');
  console.log('🔄 两个层面同时存在：');
  console.log('   • 函数内部：串行等待（阻塞式）');
  console.log('   • 全局层面：并发执行（非阻塞式）');
}, 6000);

// 5. 实际应用中的体现
setTimeout(() => {
  console.log('\n📱 5. 实际应用中的体现：');
  console.log('================================');
  
  console.log('\n🌐 网络请求示例：');
  console.log(`
async function fetchUserProfile(userId) {
  console.log('开始获取用户信息...');
  
  // 这个函数在这里"阻塞"，等待网络请求
  const userInfo = await fetch('/api/user/' + userId);
  
  // 上面的请求完成前，下面的代码不会执行
  console.log('用户信息获取完成，开始获取用户文章...');
  
  // 这个函数在这里又"阻塞"，等待另一个网络请求
  const userPosts = await fetch('/api/posts/' + userId);
  
  // 只有两个请求都完成，这里才会执行
  console.log('所有数据获取完成');
  return { userInfo, userPosts };
}

// 但是多个用户的请求可以并行：
Promise.all([
  fetchUserProfile(1),  // 这三个函数
  fetchUserProfile(2),  // 可以同时
  fetchUserProfile(3)   // 并行执行
]);`);

  console.log('\n💭 总结您的理解：');
  console.log('   ✅"对于这个函数来说就是阻塞了" - 完全正确！');
  console.log('   ✅ await会暂停当前函数的执行流程');
  console.log('   ✅ 但不会阻塞整个JavaScript引擎');
  console.log('   ✅ 这就是async/await的设计精髓！');
}, 9000); 