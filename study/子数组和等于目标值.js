function hashPrefixSum(nums, target) {
    let map = new Map();
    let prefixSum = 0;
    let count = 0;
    map.set(0, 1);

    for (let i = 0; i < nums.length; i++) {
        prefixSum += nums[i];
        let target = prefixSum - target;
        if (map.has(target)) {
            count += map.get(target);
        }
        map.set(prefixSum, (map.get(prefixSum) || 0) + 1);
    }
    return count;
}

console.log(hashPrefixSum([1, 2, 3, 4, 5], 5));
//                         1  3  6  10 15