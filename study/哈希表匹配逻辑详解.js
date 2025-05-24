// 详解：哈希表中的前缀和如何与子数组对应
// 解答：空前缀和重复前缀和的困惑

class PrefixSumMatchingLogic {
    
    // 解答用户的具体例子
    explainUserExample() {
        console.log('🎯 解答用户的具体困惑');
        console.log('═'.repeat(60));
        
        console.log('📝 用户的例子1: [1, 3]，寻找目标4');
        this.analyzeExample([1, 3], 4);
        
        console.log('\n📝 用户的例子2: [1, 3, 1]，寻找目标4');
        this.analyzeExample([1, 3, 1], 4);
        
        console.log('\n📝 特殊例子: [1, 3, 1]，寻找目标0（会有重复的0）');
        this.analyzeExample([1, 3, 1], 0);
    }
    
    analyzeExample(nums, k) {
        console.log(`\n🔍 分析数组 [${nums.join(', ')}]，目标 ${k}`);
        console.log('─'.repeat(50));
        
        // 首先展示完整的前缀和数组
        const prefixSums = [0];
        let sum = 0;
        for (const num of nums) {
            sum += num;
            prefixSums.push(sum);
        }
        
        console.log('📊 前缀和数组:');
        console.log('位置:  ', Array.from({length: prefixSums.length}, (_, i) => i - 1).join('   '));
        console.log('前缀和:', prefixSums.join('   '));
        console.log('说明:   空   ' + nums.map((_, i) => `到${i}`).join('  '));
        
        // 手动找出所有目标子数组来验证
        console.log('\n📋 手动找出所有和为' + k + '的子数组:');
        const validSubarrays = [];
        for (let i = 0; i < nums.length; i++) {
            for (let j = i; j < nums.length; j++) {
                const subarray = nums.slice(i, j + 1);
                const subarraySum = subarray.reduce((a, b) => a + b, 0);
                if (subarraySum === k) {
                    validSubarrays.push({
                        subarray,
                        start: i,
                        end: j,
                        sum: subarraySum
                    });
                }
            }
        }
        
        if (validSubarrays.length === 0) {
            console.log('❌ 没有找到和为' + k + '的子数组');
        } else {
            validSubarrays.forEach((item, index) => {
                console.log(`${index + 1}. [${item.subarray.join(',')}] (位置${item.start}到${item.end}) = ${item.sum}`);
            });
        }
        
        // 现在用算法执行
        console.log('\n🚀 算法执行过程:');
        this.executeAlgorithm(nums, k, validSubarrays.length);
    }
    
    executeAlgorithm(nums, k, expectedCount) {
        let count = 0;
        let prefixSum = 0;
        const prefixSumCount = new Map();
        prefixSumCount.set(0, 1); // 关键：空前缀
        
        console.log('初始哈希表: {0: 1} ← 这个0代表"空前缀"');
        console.log();
        
        for (let i = 0; i < nums.length; i++) {
            prefixSum += nums[i];
            const target = prefixSum - k;
            
            console.log(`步骤${i + 1}: 处理位置${i}，元素${nums[i]}`);
            console.log(`当前前缀和: ${prefixSum}`);
            console.log(`需要查找: ${prefixSum} - ${k} = ${target}`);
            
            if (prefixSumCount.has(target)) {
                const occurrences = prefixSumCount.get(target);
                count += occurrences;
                
                console.log(`✅ 找到前缀和${target}，出现${occurrences}次`);
                console.log(`💡 这意味着有${occurrences}个子数组以位置${i}结尾，和为${k}`);
                
                // 详细解释这个匹配是怎么来的
                this.explainMatch(nums, i, target, prefixSum, k);
            } else {
                console.log(`❌ 未找到前缀和${target}`);
            }
            
            // 更新哈希表
            prefixSumCount.set(prefixSum, (prefixSumCount.get(prefixSum) || 0) + 1);
            console.log(`📊 更新哈希表: 前缀和${prefixSum}的次数+1`);
            console.log(`当前哈希表: ${this.mapToString(prefixSumCount)}`);
            console.log();
        }
        
        console.log(`🏆 算法结果: ${count}个子数组`);
        console.log(`🎯 验证: ${count === expectedCount ? '✅ 正确' : '❌ 错误'}`);
    }
    
    explainMatch(nums, currentPos, target, currentPrefixSum, k) {
        console.log(`🔍 详细解释这个匹配:`);
        
        // 构建到当前位置的前缀和数组
        const prefixSums = [0];
        let sum = 0;
        for (let i = 0; i <= currentPos; i++) {
            sum += nums[i];
            prefixSums.push(sum);
        }
        
        // 找到所有等于target的前缀和
        const matchingPositions = [];
        for (let i = 0; i < prefixSums.length - 1; i++) { // 不包括当前位置
            if (prefixSums[i] === target) {
                matchingPositions.push(i - 1); // 转换为数组索引（-1表示空前缀）
            }
        }
        
        console.log(`   前缀和数组: [${prefixSums.join(', ')}]`);
        console.log(`   查找目标${target}在前缀和数组中的位置:`);
        
        matchingPositions.forEach((pos, index) => {
            if (pos === -1) {
                const subarray = nums.slice(0, currentPos + 1);
                console.log(`   匹配${index + 1}: 空前缀(前缀和${target}) → 子数组[${subarray.join(',')}] (从开头到位置${currentPos})`);
                console.log(`   验证: ${subarray.reduce((a,b) => a+b, 0)} = ${k} ✅`);
            } else {
                const subarray = nums.slice(pos + 1, currentPos + 1);
                console.log(`   匹配${index + 1}: 位置${pos}后的前缀和${target} → 子数组[${subarray.join(',')}] (从位置${pos + 1}到位置${currentPos})`);
                console.log(`   验证: ${subarray.reduce((a,b) => a+b, 0)} = ${k} ✅`);
            }
        });
    }
    
    // 专门解释空前缀的概念
    explainEmptyPrefix() {
        console.log('\n🤔 深入理解"空前缀"的概念');
        console.log('═'.repeat(60));
        
        console.log('❓ 什么是空前缀？');
        console.log('空前缀 = 数组前0个元素的和 = 0');
        console.log('它表示"什么都不选"的状态');
        console.log();
        
        console.log('🎯 空前缀的作用：');
        console.log('当我们寻找target = currentPrefixSum - k = 0时');
        console.log('意味着从数组开头到当前位置的整个子数组和就是k');
        console.log();
        
        console.log('📝 举例说明：');
        const example = [2, 1, 1];
        const k = 4;
        
        console.log(`数组: [${example.join(', ')}]，目标: ${k}`);
        
        let prefixSum = 0;
        const prefixSums = [0];
        for (const num of example) {
            prefixSum += num;
            prefixSums.push(prefixSum);
        }
        
        console.log(`前缀和数组: [${prefixSums.join(', ')}]`);
        console.log('位置说明:    空  0  1  2');
        console.log();
        
        console.log('当处理到位置2时:');
        console.log(`当前前缀和 = ${prefixSums[3]} (前3个元素的和)`);
        console.log(`target = ${prefixSums[3]} - ${k} = ${prefixSums[3] - k}`);
        console.log(`在哈希表中找到前缀和0 (空前缀)`);
        console.log(`这意味着: prefixSum[2] - prefixSum[空] = ${prefixSums[3]} - 0 = ${k}`);
        console.log(`对应子数组: [${example.join(',')}] (从开头到位置2) = ${k} ✅`);
    }
    
    // 解释重复前缀和的情况
    explainRepeatedPrefixSum() {
        console.log('\n🔄 理解重复前缀和的情况');
        console.log('═'.repeat(60));
        
        console.log('📝 例子: [1, -1, 1, -1, 2]，目标: 2');
        const nums = [1, -1, 1, -1, 2];
        const k = 2;
        
        // 构建前缀和数组
        const prefixSums = [0];
        let sum = 0;
        for (const num of nums) {
            sum += num;
            prefixSums.push(sum);
        }
        
        console.log(`前缀和数组: [${prefixSums.join(', ')}]`);
        console.log('注意: 前缀和0出现了多次！');
        console.log();
        
        // 执行算法
        let count = 0;
        let prefixSum = 0;
        const prefixSumCount = new Map();
        prefixSumCount.set(0, 1);
        
        for (let i = 0; i < nums.length; i++) {
            prefixSum += nums[i];
            const target = prefixSum - k;
            
            console.log(`位置${i}: 前缀和=${prefixSum}, 查找=${target}`);
            
            if (prefixSumCount.has(target)) {
                const occurrences = prefixSumCount.get(target);
                count += occurrences;
                console.log(`  找到${occurrences}个前缀和${target}，每个对应一个子数组`);
                
                if (target === 0) {
                    console.log(`  特别说明: 这些前缀和0包括:`);
                    console.log(`  - 最初的空前缀`);
                    if (occurrences > 1) {
                        console.log(`  - 之前计算得到的前缀和0`);
                    }
                }
            }
            
            prefixSumCount.set(prefixSum, (prefixSumCount.get(prefixSum) || 0) + 1);
            console.log(`  更新后哈希表: ${this.mapToString(prefixSumCount)}`);
            console.log();
        }
        
        console.log(`总共找到: ${count}个子数组`);
    }
    
    // 回答用户的核心困惑
    answerUserConfusion() {
        console.log('\n💡 回答用户的核心困惑');
        console.log('═'.repeat(60));
        
        console.log('❓ 用户问: "0不是最开始就存在的吗？"');
        console.log('✅ 答: 是的！空前缀的前缀和确实是0，这正是算法的巧妙之处！');
        console.log();
        
        console.log('❓ 用户问: "假如是[1,3,1]就会有寻找2次0？"');
        console.log('✅ 答: 让我们验证一下:');
        
        const nums = [1, 3, 1];
        const k = 4;
        
        console.log(`数组: [${nums.join(', ')}]，目标: ${k}`);
        
        let prefixSum = 0;
        const prefixSumCount = new Map();
        prefixSumCount.set(0, 1);
        let searchForZero = 0;
        
        for (let i = 0; i < nums.length; i++) {
            prefixSum += nums[i];
            const target = prefixSum - k;
            
            console.log(`位置${i}: 前缀和=${prefixSum}, 查找target=${target}`);
            
            if (target === 0) {
                searchForZero++;
                console.log(`  → 这是第${searchForZero}次寻找0`);
            }
            
            prefixSumCount.set(prefixSum, (prefixSumCount.get(prefixSum) || 0) + 1);
        }
        
        console.log(`\n实际上只寻找了${searchForZero}次0，在位置1时`);
        console.log('因为只有当 prefixSum - k = 0 时才会寻找0');
        console.log('这发生在 prefixSum = k = 4 的时候');
        console.log('在[1,3,1]中，只有位置1的前缀和是4');
        
        console.log('\n🔑 关键理解:');
        console.log('1. 空前缀的0是初始存在的');
        console.log('2. 寻找0不意味着0出现了多次');
        console.log('3. 只有当目标target恰好是0时，才会"寻找"到这个空前缀');
        console.log('4. 这时候对应的子数组是从开头到当前位置的整个子数组');
    }
    
    // 工具函数
    mapToString(map) {
        const entries = Array.from(map.entries());
        return '{' + entries.map(([k, v]) => `${k}:${v}`).join(', ') + '}';
    }
}

// 执行详细解释
const explanation = new PrefixSumMatchingLogic();

console.log('🎓 哈希表匹配逻辑深度解析');
console.log('═'.repeat(60));

explanation.explainUserExample();
explanation.explainEmptyPrefix();
explanation.explainRepeatedPrefixSum();
explanation.answerUserConfusion();

console.log('\n🎯 总结');
console.log('─'.repeat(30));
console.log('哈希表中的每个前缀和都有明确的含义：');
console.log('• 空前缀(0): 表示从数组开头开始的子数组');
console.log('• 其他前缀和: 表示从某个特定位置开始的子数组');
console.log('• 次数信息: 告诉我们有多少个这样的起始位置');
console.log('• 算法的美妙: 通过数学公式直接定位，无需遍历'); 