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
