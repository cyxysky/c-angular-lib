// queueMicrotask 实际演示代码

console.log('🚀 queueMicrotask 演示开始\n');

// ============================================
// 1. 基本用法对比
// ============================================
console.log('📌 1. 基本用法对比：');

console.log('同步代码1');

setTimeout(() => {
  console.log('   宏任务: setTimeout');
}, 0);

Promise.resolve().then(() => {
  console.log('   微任务: Promise.then');
});

queueMicrotask(() => {
  console.log('   微任务: queueMicrotask');
});

console.log('同步代码2');

console.log('\n执行顺序：同步代码 → 微任务 → 宏任务\n');

// ============================================
// 2. 微任务嵌套演示
// ============================================
setTimeout(() => {
  console.log('📌 2. 微任务嵌套演示：');
  
  queueMicrotask(() => {
    console.log('   微任务A');
    
    // 在微任务中创建新的微任务
    queueMicrotask(() => {
      console.log('   微任务A中的微任务');
    });
    
    Promise.resolve().then(() => {
      console.log('   微任务A中的Promise');
    });
  });
  
  queueMicrotask(() => {
    console.log('   微任务B');
  });
  
  console.log('   同步代码结束');
}, 100);

// ============================================
// 3. 实际应用：批量DOM更新
// ============================================
setTimeout(() => {
  console.log('\n📌 3. 实际应用：批量DOM更新');
  
  class DOMBatchUpdater {
    constructor() {
      this.pendingUpdates = [];
      this.isUpdateScheduled = false;
    }
    
    scheduleUpdate(element, property, value) {
      this.pendingUpdates.push({ element, property, value });
      
      if (!this.isUpdateScheduled) {
        this.isUpdateScheduled = true;
        
        // 使用 queueMicrotask 确保在下一个宏任务前批量更新
        queueMicrotask(() => {
          this.executeBatch();
        });
      }
    }
    
    executeBatch() {
      console.log(`   执行批量更新：${this.pendingUpdates.length} 个操作`);
      
      this.pendingUpdates.forEach(({ element, property, value }) => {
        console.log(`   - 更新 ${element} 的 ${property} 为 ${value}`);
      });
      
      this.pendingUpdates = [];
      this.isUpdateScheduled = false;
    }
  }
  
  const updater = new DOMBatchUpdater();
  
  // 模拟多个DOM更新请求
  updater.scheduleUpdate('div1', 'color', 'red');
  updater.scheduleUpdate('div2', 'fontSize', '16px');
  updater.scheduleUpdate('div3', 'opacity', '0.5');
  
  console.log('   DOM更新已排队...');
}, 200);

// ============================================
// 4. 实际应用：状态管理
// ============================================
setTimeout(() => {
  console.log('\n📌 4. 实际应用：状态管理');
  
  class StateManager {
    constructor() {
      this.state = { count: 0, name: 'Initial' };
      this.listeners = [];
      this.pendingNotification = false;
    }
    
    subscribe(listener) {
      this.listeners.push(listener);
    }
    
    setState(newState) {
      this.state = { ...this.state, ...newState };
      console.log(`   状态更新: ${JSON.stringify(newState)}`);
      
      // 使用 queueMicrotask 批量通知
      if (!this.pendingNotification) {
        this.pendingNotification = true;
        
        queueMicrotask(() => {
          this.notifyListeners();
        });
      }
    }
    
    notifyListeners() {
      console.log('   📢 批量通知所有监听器');
      this.listeners.forEach((listener, index) => {
        console.log(`   - 通知监听器 ${index + 1}: ${JSON.stringify(this.state)}`);
      });
      this.pendingNotification = false;
    }
  }
  
  const stateManager = new StateManager();
  
  stateManager.subscribe((state) => console.log('监听器1收到状态'));
  stateManager.subscribe((state) => console.log('监听器2收到状态'));
  
  // 连续多次状态更新
  stateManager.setState({ count: 1 });
  stateManager.setState({ name: 'Updated' });
  stateManager.setState({ count: 2 });
  
  console.log('   状态更新已排队，等待批量通知...');
}, 300);

// ============================================
// 5. 时间分片协调
// ============================================
setTimeout(() => {
  console.log('\n📌 5. 时间分片协调');
  
  function timeSlicedTask(data, callback) {
    let index = 0;
    const chunkSize = 3; // 小块大小便于演示
    let processedCount = 0;
    
    function processChunk() {
      const endIndex = Math.min(index + chunkSize, data.length);
      console.log(`   处理数据块 ${Math.floor(index/chunkSize) + 1}: 索引 ${index}-${endIndex-1}`);
      
      // 模拟处理数据
      for (let i = index; i < endIndex; i++) {
        processedCount++;
      }
      
      index = endIndex;
      
      if (index < data.length) {
        // 使用 queueMicrotask 检查是否需要继续
        queueMicrotask(() => {
          // 模拟检查时间
          const shouldContinue = Math.random() > 0.3;
          
          if (shouldContinue) {
            console.log('   继续处理下一块...');
            processChunk();
          } else {
            console.log('   让出控制权，使用 setTimeout 继续');
            setTimeout(processChunk, 0);
          }
        });
      } else {
        console.log(`   ✅ 处理完成！总共处理了 ${processedCount} 个数据`);
        callback();
      }
    }
    
    processChunk();
  }
  
  const testData = Array.from({ length: 10 }, (_, i) => i);
  console.log(`   开始处理 ${testData.length} 个数据项...`);
  
  timeSlicedTask(testData, () => {
    console.log('   时间分片任务完成！');
  });
}, 400);

// ============================================
// 6. 错误处理演示
// ============================================
setTimeout(() => {
  console.log('\n📌 6. 错误处理演示');
  
  // queueMicrotask 中的错误处理
  queueMicrotask(() => {
    console.log('   正常的微任务执行');
  });
  
  queueMicrotask(() => {
    try {
      throw new Error('微任务中的错误');
    } catch (error) {
      console.log(`   ❌ 捕获到错误: ${error.message}`);
    }
  });
  
  queueMicrotask(() => {
    console.log('   后续微任务仍能正常执行');
  });
  
  console.log('   错误处理演示完成');
}, 500);

// ============================================
// 7. 性能对比
// ============================================
setTimeout(() => {
  console.log('\n📌 7. 性能对比');
  
  const iterations = 1000;
  
  // Promise.then 方式
  console.time('   Promise.then 方式');
  let promiseCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    Promise.resolve().then(() => {
      promiseCount++;
      if (promiseCount === iterations) {
        console.timeEnd('   Promise.then 方式');
        
        // queueMicrotask 方式
        console.time('   queueMicrotask 方式');
        let queueCount = 0;
        
        for (let j = 0; j < iterations; j++) {
          queueMicrotask(() => {
            queueCount++;
            if (queueCount === iterations) {
              console.timeEnd('   queueMicrotask 方式');
              console.log('   性能对比完成');
            }
          });
        }
      }
    });
  }
}, 600);

console.log('\n⏳ 等待演示执行...\n'); 