// async函数返回值机制详解
console.log('🔍 async函数返回值机制解析');
console.log('================================\n');

// 1. 普通函数 vs async函数对比
console.log('📊 1. 普通函数 vs async函数返回值对比：');

function normalFunction() {
  return 'Hello World';
}

async function asyncFunction() {
  return 'Hello World'; // 非Promise值
}

console.log('普通函数返回:', normalFunction());
console.log('async函数返回:', asyncFunction());
console.log('async函数返回类型:', typeof asyncFunction());
console.log('是否为Promise:', asyncFunction() instanceof Promise);

// 2. async函数总是返回Promise
console.log('\n📦 2. async函数的自动包装机制：');

async function returnString() {
  return 'just a string';
}

async function returnNumber() {
  return 42;
}

async function returnObject() {
  return { name: 'test', value: 123 };
}

async function returnNothing() {
  // 没有return语句
}

async function returnUndefined() {
  return undefined;
}

// 测试所有返回值
async function testAllReturns() {
  console.log('returnString():', await returnString());
  console.log('returnNumber():', await returnNumber());
  console.log('returnObject():', await returnObject());
  console.log('returnNothing():', await returnNothing());
  console.log('returnUndefined():', await returnUndefined());
  
  // 验证都是Promise
  console.log('\n🔍 验证返回类型：');
  console.log('returnString() instanceof Promise:', returnString() instanceof Promise);
  console.log('returnNumber() instanceof Promise:', returnNumber() instanceof Promise);
  console.log('returnObject() instanceof Promise:', returnObject() instanceof Promise);
}

testAllReturns();

// 3. 没有await的async函数是否有作用？
console.log('\n🤔 3. 没有await的async函数分析：');

// 普通函数
function syncCalculation(x, y) {
  return x + y;
}

// async函数，但没有异步操作
async function asyncCalculation(x, y) {
  return x + y;
}

// 性能对比测试
function performanceTest() {
  const iterations = 1000000;
  
  // 测试普通函数
  console.time('普通函数性能');
  for (let i = 0; i < iterations; i++) {
    syncCalculation(i, i + 1);
  }
  console.timeEnd('普通函数性能');
  
  // 测试async函数
  console.time('async函数性能');
  for (let i = 0; i < iterations; i++) {
    asyncCalculation(i, i + 1);
  }
  console.timeEnd('async函数性能');
}

setTimeout(() => {
  console.log('\n⚡ 性能对比测试：');
  performanceTest();
}, 1000);

// 4. async函数真正有用的场景
console.log('\n✅ 4. async函数真正有用的场景：');

// 场景1：需要等待Promise
async function fetchUserData(userId) {
  // 模拟API调用
  const response = await new Promise(resolve => {
    setTimeout(() => {
      resolve({ id: userId, name: `User${userId}` });
    }, 100);
  });
  
  return response; // 这里返回的仍然是Promise包装的值
}

// 场景2：错误处理
async function safeOperation() {
  try {
    const result = await new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('成功!') : reject(new Error('失败!'));
      }, 50);
    });
    return result;
  } catch (error) {
    return `错误处理: ${error.message}`;
  }
}

// 场景3：顺序执行多个异步操作
async function sequentialOperations() {
  console.log('  开始操作序列...');
  
  const step1 = await new Promise(resolve => {
    setTimeout(() => resolve('步骤1完成'), 100);
  });
  console.log(' ', step1);
  
  const step2 = await new Promise(resolve => {
    setTimeout(() => resolve('步骤2完成'), 100);
  });
  console.log(' ', step2);
  
  return '所有步骤完成';
}

// 测试有用的场景
async function testUsefulCases() {
  console.log('\n🎯 测试async的有用场景：');
  
  try {
    const userData = await fetchUserData(123);
    console.log('获取用户数据:', userData);
    
    const safeResult = await safeOperation();
    console.log('安全操作结果:', safeResult);
    
    const sequenceResult = await sequentialOperations();
    console.log('序列操作结果:', sequenceResult);
  } catch (error) {
    console.error('操作失败:', error);
  }
}

setTimeout(() => {
  testUsefulCases();
}, 1500);

// 5. 什么时候async是多余的？
console.log('\n🚫 5. async可能多余的场景：');

// 多余的async使用
async function unnecessaryAsync1() {
  return 'Hello'; // 没有异步操作，async多余
}

async function unnecessaryAsync2() {
  return Promise.resolve('Hello'); // 已经是Promise，async包装是多余的
}

// 更好的替代方案
function betterVersion1() {
  return 'Hello';
}

function betterVersion2() {
  return Promise.resolve('Hello');
}

// 6. 总结和建议
setTimeout(() => {
  console.log('\n📋 总结：');
  console.log('================================');
  console.log('✅ async函数即使返回非Promise值也有作用：');
  console.log('   • 自动将返回值包装成Promise');
  console.log('   • 使函数可以被await调用');
  console.log('   • 统一异步函数的接口');
  console.log('');
  console.log('⚠️  但在以下情况下async可能是多余的：');
  console.log('   • 函数内部没有await操作');
  console.log('   • 没有异步逻辑需要处理');
  console.log('   • 不需要错误处理的异步特性');
  console.log('');
  console.log('💡 最佳实践：');
  console.log('   • 只在需要await或异步错误处理时使用async');
  console.log('   • 简单的同步函数避免使用async');
  console.log('   • 考虑性能影响（虽然通常很小）');
}, 3000); 