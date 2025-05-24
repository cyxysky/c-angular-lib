// 时间分片技术详解：为什么setTimeout分片和requestIdleCallback有用？

console.log('=== 时间分片的核心原理 ===');

// 关键理解：虽然每个回调都会占用主线程，但是占用的"时间长度"不同！

// ❌ 问题示例：长时间阻塞主线程
function badHeavyTask() {
  console.log('开始长时间计算...');
  const start = Date.now();
  
  // 模拟大量计算，主线程被占用3秒
  let result = 0;
  for (let i = 0; i < 3000000000; i++) {
    result += i;
  }
  
  console.log('计算完成，耗时:', Date.now() - start, 'ms');
  console.log('在这3秒内，用户界面完全卡死！');
  return result;
}

// ✅ 解决方案：时间分片
function goodHeavyTaskWithSlicing(totalIterations, callback) {
  console.log('开始分片计算...');
  let result = 0;
  let currentIndex = 0;
  const chunkSize = 1000000; // 每次处理100万次
  
  function processChunk() {
    const start = Date.now();
    const endIndex = Math.min(currentIndex + chunkSize, totalIterations);
    
    // 执行一小块计算（约10-20ms）
    for (let i = currentIndex; i < endIndex; i++) {
      result += i;
    }
    
    currentIndex = endIndex;
    const chunkTime = Date.now() - start;
    console.log(`处理了 ${chunkSize} 次计算，耗时: ${chunkTime}ms`);
    
    if (currentIndex < totalIterations) {
      // 关键：释放主线程，让浏览器处理其他任务
      setTimeout(processChunk, 0);
    } else {
      console.log('所有计算完成！');
      callback(result);
    }
  }
  
  processChunk();
}

console.log('\n=== 对比效果 ===');

// 测试1：不分片（会卡死界面）
console.log('测试1: 不使用分片');
console.log('主线程会被占用约3秒，期间无法响应任何操作');

// 测试2：使用分片
console.log('测试2: 使用分片');
console.log('主线程每次只被占用10-20ms，然后释放给其他任务');

goodHeavyTaskWithSlicing(30000000, (result) => {
  console.log('分片计算结果:', result);
});

console.log('这行代码会立即执行，不会被阻塞');

console.log('\n=== 时间分片的关键优势 ===');

// 1. 主线程使用时间对比
function explainTimeDifference() {
  console.log('不分片：');
  console.log('主线程占用: [████████████████████████████████] 3000ms');
  console.log('用户体验: 界面卡死3秒');
  
  console.log('\n分片后：');
  console.log('主线程占用: [██] 20ms → 释放 → [██] 20ms → 释放 → [██] 20ms → ...');
  console.log('用户体验: 界面流畅，可以正常交互');
}

explainTimeDifference();

console.log('\n=== requestIdleCallback 的优势 ===');

// requestIdleCallback 更智能：只在浏览器空闲时执行
function explainRequestIdleCallback() {
  console.log('浏览器任务优先级：');
  console.log('1. 用户交互（点击、输入）- 最高优先级');
  console.log('2. 渲染更新（动画、重绘）- 高优先级');
  console.log('3. requestIdleCallback - 只在空闲时执行');
  
  console.log('\nrequestIdleCallback 的工作方式：');
  console.log('浏览器空闲时：执行计算');
  console.log('用户点击时：立即停止计算，处理用户交互');
  console.log('动画播放时：优先保证动画流畅');
}

explainRequestIdleCallback();

console.log('\n=== 实际应用场景 ===');

// 场景1：大数据处理
function processLargeDataset(data) {
  console.log('处理大型数据集：');
  console.log('- 不分片：用户看到"页面未响应"');
  console.log('- 分片：用户可以继续操作，后台慢慢处理');
}

// 场景2：复杂计算
function complexCalculation() {
  console.log('复杂数学计算：');
  console.log('- 不分片：计算期间无法滚动页面');
  console.log('- 分片：计算同时页面保持流畅');
}

// 场景3：图像处理
function imageProcessing() {
  console.log('图像处理：');
  console.log('- 不分片：处理期间无法操作界面');
  console.log('- 分片：可以显示处理进度，甚至可以取消');
}

processLargeDataset();
complexCalculation();
imageProcessing();

console.log('\n=== 关键理解 ===');
console.log('🔑 分片技术的本质：');
console.log('1. 将"长时间阻塞"变成"短时间阻塞 + 频繁释放"');
console.log('2. 每次只占用主线程很短时间（10-50ms）');
console.log('3. 占用完立即释放，让浏览器处理其他任务');
console.log('4. 用户感受：界面流畅，有响应');

console.log('\n💡 类比：');
console.log('不分片 = 一个人占着厕所3小时');
console.log('分片 = 一个人用厕所5分钟就出来，让别人也能用');

console.log('\n⚡ 总结：');
console.log('分片技术不是为了避免阻塞主线程');
console.log('而是为了避免"长时间"阻塞主线程');
console.log('通过"短时间阻塞 + 频繁释放"来保持界面响应性'); 