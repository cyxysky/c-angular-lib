// 时间分片效果演示
console.log('=== 时间分片演示 ===');

function processWithSlicing(totalItems) {
  console.log(`开始处理 ${totalItems} 项数据...`);
  
  let processed = 0;
  const chunkSize = 1000;
  const startTime = Date.now();
  
  function processChunk() {
    const chunkStart = Date.now();
    
    // 处理当前chunk
    for (let i = 0; i < chunkSize && processed < totalItems; i++, processed++) {
      // 模拟计算工作
      Math.sqrt(processed);
    }
    
    const chunkTime = Date.now() - chunkStart;
    const progress = ((processed / totalItems) * 100).toFixed(1);
    
    console.log(`处理了 ${Math.min(chunkSize, totalItems - processed + chunkSize)} 项，耗时: ${chunkTime}ms，进度: ${progress}%`);
    
    if (processed < totalItems) {
      // 继续下一个chunk，释放主线程
      setTimeout(processChunk, 0);
    } else {
      const totalTime = Date.now() - startTime;
      console.log(`✅ 所有数据处理完成！总耗时: ${totalTime}ms`);
      console.log('📱 在处理期间，用户界面保持响应！');
    }
  }
  
  processChunk();
}

// 开始演示
processWithSlicing(20000); 