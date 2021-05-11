### wsjson 函数执行后生成一个websocket实例，集成了心跳检测、断线重连和事件的功能。
<br>

**说明：**  
<br>
一、传输的消息体格式：

约定前后端传输格式如下
```
{
    type:xxx
    data:{
        ...
    }
}
```
默认配置下会在发送时进行JSON序列化，收到消息时进行JSON反序列化  
<br>
二、检测服务端断线的心跳检测功能

默认配置下,服务端会定时发出
```
{
    type:'PING'
}
```

要求服务端在接收到消息后返回
```
{
    type:'PONG',
    ...
}
```

要求后端代码中判断，如果客户端发送的消息体的type是'PING'，就返回type为'PONG'的消息体
<br><br><br>

**使用方法：**  
<br>
一、创建连接  
```
const wsjson = require('wsjson')
const ws = wsjson(url) // 使用默认配置  
const ws = wsjson(url,options) // 传入参数 

interface options{ 
    heartBeatInterval?: number,   // 心跳间隔
    heartBeatMissedMax?: number,  // 最大心跳失败次数
    heartBeatMsg?: any,           // 客户端发送的msg 
    heartBeatRes?: any,           // 服务端响应的res
    reconnectTimeout?: number,    // 重连时间
    reconnectMaxretry?: number,   // 最大重连次数
    subprotocol?: string | string[] // 子协议
}
```

二、发送消息  
```
// 使用send方法
ws.send({type:1,data:{msg:'hello'}})
```


三、接收消息

用法一:同原生websocketAPI
```
ws.onmessage=function(e){
    ...
}
ws.onerror=function(e){
    ...
}
```


用法二:使用事件
```
ws.on(type,cb) 第一个参数是type字段的内容，第二个回调接收了data的内容

ws.on(/* type */,(data)=>{

})

ws.on('NEW_MESSAGE',(data)=>{

})

ws.on('PULL_MESSAGE',(data)=>{

})
```


用法三:监听实例内部latestState字段获取状态
```
$store.state.wsState = ws.latestState  // 例如 在Vue中，可以作为一个可监听的全局响应式数据
...
watch:{
    'wsState':(n,o){
        if(n){
            const {type,data} = n
            if(type === "NEW_MESSAGE"){
                ...
            }
        }
    }
}
```