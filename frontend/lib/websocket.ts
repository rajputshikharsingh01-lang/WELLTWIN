export function createWellSocket(id:string,onMessage:(data:any)=>void,onStatus:(s:"connecting"|"open"|"closed"|"error")=>void){
  const base=process.env.NEXT_PUBLIC_API_URL||"http://localhost:8000";
  const wsBase=base.replace(/^http/,"ws");
  let ws:WebSocket|undefined, timer:ReturnType<typeof setTimeout>|undefined, stopped=false;
  const connect=()=>{
    if(stopped)return;
    onStatus("connecting");
    ws=new WebSocket(`${wsBase}/ws/wells/${id}`);
    ws.onopen=()=>onStatus("open");
    ws.onmessage=e=>{try{onMessage(JSON.parse(e.data))}catch{}};
    ws.onerror=()=>onStatus("error");
    ws.onclose=()=>{onStatus("closed"); if(!stopped) timer=setTimeout(connect,2500)};
  };
  connect();
  return ()=>{stopped=true;if(timer)clearTimeout(timer);ws?.close()};
}