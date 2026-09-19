const BASE=process.env.NEXT_PUBLIC_API_URL||"http://localhost:8000";
async function request<T>(path:string,init?:RequestInit):Promise<T>{
  const r=await fetch(`${BASE}${path}`,{...init,headers:{"Content-Type":"application/json",...(init?.headers||{})},cache:"no-store"});
  if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}
export const api={
  base:BASE,
  health:()=>request<any>("/api/health"),
  wells:()=>request<any>("/api/wells"),
  well:(id:string)=>request<any>(`/api/wells/${id}`),
  snapshot:(id:string)=>request<any>(`/api/wells/${id}/snapshot`),
  series:(id:string)=>request<any>(`/api/wells/${id}/series`),
  telemetry:(id:string)=>request<any>(`/api/wells/${id}/telemetry`),
  dynacard:(id:string)=>request<any>(`/api/wells/${id}/dynacard`),
  recommendations:(id:string)=>request<any>(`/api/wells/${id}/recommendations`),
  sensors:(id:string)=>request<any>(`/api/wells/${id}/sensors`),
  correlate:(id:string,field:string,value:number)=>request<any>(`/api/wells/${id}/correlate?field=${field}&value=${value}`),
  optimize:(id:string)=>request<any>(`/api/wells/${id}/optimize`),
  updateParams:(id:string,data:any)=>request<any>(`/api/wells/${id}/params`,{method:"PUT",body:JSON.stringify(data)}),
  applyRecommendation:(id:string,rid:string)=>request<any>(`/api/wells/${id}/recommendations/${rid}/apply`,{method:"POST"}),
  simulate:(data:any)=>request<any>("/api/simulate",{method:"POST",body:JSON.stringify(data)}),
  login:(data:any)=>request<any>("/api/login",{method:"POST",body:JSON.stringify(data)})
};