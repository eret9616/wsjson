declare enum ReadyState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3,
}

declare class WebSocket{

    latestState: {
        state: ReadyState | null,
        data: Data | null
    }
    
    send(data:Data):void
    close():void

    on(type:any,callback:(data:data)=>void):void;
    
    onclose: ((e: CloseEvent) => void) | null ;
    onerror: ((e: Event) => void) | null ;
    onmessage: (( e: MessageEvent) => void) | null;
    onopen: (( e: Event) => void) | null;
    
}

interface data{
    [prop:string]:any | any
}

interface Data{
    type:any,
    data:data
}

interface Options{
    subprotocol?: string | string[],
    heartBeatInterval?: number,   
    heartBeatMissedMax?: number,   
    heartBeatMsg?: any,            
    heartBeatRes?: any,            
    reconnectTimeout?: number,     
    reconnectMaxretry?: number,     
}

declare function wsjson(url:string,options:Options):WebSocket

export as namespace wsjson;

export = wsjson
