# MessageChannel 在事件循环中的应用

## 什么是 MessageChannel？

MessageChannel 是一个Web API，用于创建两个端口之间的通信通道。它在事件循环中有特殊的位置。

## MessageChannel 与事件循环

### 基本使用

```javascript
// 创建消息通道
const channel = new MessageChannel();
const port1 = channel.port1;
const port2 = channel.port2;

// 设置消息接收处理
port2.onmessage = function(event) {
  console.log('接收到消息:', event.data);
};

// 发送消息
port1.postMessage('Hello from port1!');
```

### 在事件循环中的位置

MessageChannel 的消息事件被放入**宏任务队列**中。 