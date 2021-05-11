const reconnect = require('./defaults/reconnect');
const heartBeat = require('./defaults/heartBeat');
const serialize = require('./defaults/serialize')

class WebSocketConfig {

    constructor(options) {
        return Object.assign({

            url: undefined,
            subprotocol: undefined,
            serializer: serialize.serializer, 
            deserializer: serialize.deserializer,
            heartBeatInterval: heartBeat.interval, // 心跳间隔
            heartBeatMissedMax: heartBeat.missedMax, // 最大心跳失败次数
            heartBeatMsg: heartBeat.msg, // 客户端发送的msg 
            heartBeatRes: heartBeat.res, // 服务端响应的res
            reconnectTimeout: reconnect.timeout, 
            reconnectMaxretry: reconnect.maxRetry,

        }, options);
    }
}

class Websocket {

    constructor(url, options = {}) {
        this.latestState = {
            state: undefined,
            data: undefined,
        };

        this.listeners = {
            onmessage: undefined,
            onerror: undefined,
            onclose: undefined,
            onopen: undefined,
        };

        this.closeWithoutError = false
        this.retryTime = 0;
        this._config = new WebSocketConfig({ url, ...options });
        this.initSocket();

        const handler = {
            set(obj, prop, value) {
                if (Object.keys(obj.listeners).includes(prop)) {
                    if (typeof value !== 'function') {
                        throw new Error('listener应当传入函数');
                    }
                    obj.listeners[prop] = value;
                } else {
                    obj[prop] = value;
                }
                return true;
            },
            get(obj, prop) {
                return obj[prop];
            },
        };
        return new Proxy(this, handler);
    }

    initSocket() {
        this._socket = new WebSocket(this._config.url, this._config.subprotocol);
        this._socket.onopen = e => {

            this.latestState.state = e.target.readyState;
            this.latestState.data = undefined;
            this.listeners.onopen && this.listeners.onopen(e);

            if (this._timer === undefined) {

                this.heartbeatMissed = 0;
                this._timer = setInterval(function () {
                    try {
                        this.heartbeatMissed++;
                        if (this.heartbeatMissed >= this._config.heartBeatMissedMax) {
                            throw new Error('后台未响应');
                        }
                        //                '     PING'
                        this.send({ type: heartBeat.msg });
                    } catch (error) {
                        console.error('关闭连接，原因:' + error.message);
                        this.close(true);
                    }
                }.bind(this), this._config.heartBeatInterval);
            }
        };

        this._socket.onmessage = e => {

            if (e.data) {
                const Data = this._config.deserializer(e.data);
                //                               'PONG'
                if (Data.type === this._config.heartBeatRes) {
                    this.heartbeatMissed = 0;
                    return;
                }
                this.latestState.state = e.target.readyState;
                this.latestState.data = Data;
                /*
                Data:
                    {
                         type: any
                         data: {... }
                    }
                */
                try {
                    const type = Data.type;
                    this.messageEvents[type].forEach(f => f(Data.data));
                } catch (error) {/* TODO */}

            }
            this.listeners.onmessage && this.listeners.onmessage(e);
        };

        this._socket.onerror = e => {
            this.listeners.onerror && this.listeners.onerror(e);
        };

        this._socket.onclose = e => {

            clearInterval(this._timer);
            this._timer = undefined;
            
            this.listeners.onclose && this.listeners.onclose(e);

            if(this.closeWithoutError){
                console.log('连接已关闭')
                return
            } else{
                console.error(`连接已关闭，${this._config.reconnectTimeout}毫秒后尝试重新连接，重试次数${this.retryTime}`);

                if (this._config.reconnectMaxretry === this.retryTime) {
                    console.error(`达到最大重试次数${this._config.reconnectMaxretry},不再尝试连接`);
                    return;
                }

                setTimeout(() => {
                    this.reconnect();
                }, this._config.reconnectTimeout);
            }
        };

        this.latestState.state = undefined;
        this.latestState.data = undefined;
        this._timer = undefined;
        this.heartbeatMissed = 0;
        this.messageEvents = {};
    }
    on(type, cb) {
        if (!this.messageEvents[type]) {
            this.messageEvents[type] = [];
        }
        this.messageEvents[type].push(cb);
    }
    reconnect() {
        this.retryTime++;
        this.initSocket();
    }
    send(data) {
        this._socket.send(this._config.serializer(data));
    }
    close(error=false) {
        !error && (this.closeWithoutError=true)
        this._socket.close();
    }
}

module.exports =  Websocket;
