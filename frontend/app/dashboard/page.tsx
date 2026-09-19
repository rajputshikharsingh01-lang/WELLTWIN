"use client";
import {useEffect,useMemo,useState} from "react";import Link from "next/link";import {MapPinned,RadioTower} from "lucide-react";import {api} from "@/lib/api";import {Card,Kpi,Loading,ErrorBox,PageTitle,Status} from "@/components/ui";
function val(o:any,...keys:string[]){for(const k of keys){if(o?.[k]!==undefined&&o?.[k]!==null)return o[k]}return "—"}
export default function Dashboard(){const[wells,setWells]=useState<any[]>([]);const[err,setErr]=useState(false);const load=()=>api.wells().then(x=>setWells(Array.isArray(x)?x:(x?.wells||[]))).catch(()=>setErr(true));useEffect(()=>{load()},[]);
 const producing=wells.filter(w=>String(val(w,"status")).toLowerCase().includes("prod")).length;
 const avg=(key:string)=>{const a=wells.map(w=>Number(val(w,key))).filter(Number.isFinite);return a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):"—"};
 if(err)return <><PageTitle title="WELLTWIN — FIELD OVERVIEW" sub="Baghewala Heavy Oil Field"/><ErrorBox onRetry={()=>{setErr(false);load()}}/></>;
 if(!wells.length)return <><PageTitle title="WELLTWIN — FIELD OVERVIEW" sub="Baghewala Heavy Oil Field"/><Loading/></>;
 return <><PageTitle title="WELLTWIN — FIELD OVERVIEW" sub="Baghewala Heavy Oil Field / Monitor → Understand → Simulate → Optimize → Act"/>
 <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
  <Kpi label="Total Wells" value={wells.length}/><Kpi label="Producing Wells" value={producing}/><Kpi label="Avg Pressure" value={avg("pressure")} unit="backend"/><Kpi label="Avg Water Cut" value={avg("water_cut")} unit="%"/><Kpi label="Avg Temperature" value={avg("temperature")} unit="backend"/><Kpi label="Field Health" value="LIVE" status="Derived from backend well status"/>
 </div>
 <div className="grid xl:grid-cols-[1.6fr_1fr] gap-4">
  <Card className="p-5 min-h-[470px]"><div className="flex items-center justify-between mb-4"><div><div className="text-sm font-semibold flex items-center gap-2"><MapPinned size={16} className="text-cyan-300"/>FIELD DIGITAL TWIN</div><div className="text-xs text-slate-500 mt-1">Schematic view — geographic coordinates are used only when supplied by backend.</div></div><span className="text-[10px] mono text-slate-500">{wells.length} NODES</span></div>
   <div className="relative h-[390px] border border-dashed border-[#26343e] rounded-lg overflow-hidden grid-bg">{wells.map((w,i)=>{const id=String(val(w,"well_id","id","name")||`WELL-${i+1}`);return <Link key={id} href={`/wells/${encodeURIComponent(id)}`} className="absolute group" style={{left:`${15+(i*23)%70}%`,top:`${18+(i*31)%65}%`}}><span className="block h-5 w-5 rounded-full border-2 border-cyan-300 bg-cyan-300/10 shadow-[0_0_18px_rgba(34,211,238,.35)] group-hover:scale-125 transition"/><span className="absolute left-7 -top-1 whitespace-nowrap text-[10px] mono text-slate-300">{id}</span></Link>})}<div className="absolute inset-x-5 bottom-5 flex justify-between text-[9px] uppercase tracking-widest text-slate-600"><span>Well cluster</span><span>Production network</span></div></div>
  </Card>
  <Card className="p-5"><div className="flex items-center gap-2 text-sm font-semibold"><RadioTower size={16} className="text-cyan-300"/>WELL STATUS</div><div className="mt-4 space-y-2">{wells.slice(0,10).map((w,i)=>{const id=String(val(w,"well_id","id","name")||`WELL-${i+1}`);return <Link href={`/wells/${encodeURIComponent(id)}`} key={id} className="flex items-center justify-between p-3 border border-[#1e2933] rounded-md hover:bg-white/[.025]"><span className="mono text-xs">{id}</span><Status value={String(val(w,"status","health"))}/></Link>})}</div></Card>
 </div>
 <div className="mt-4 text-[10px] text-slate-600">Engineering-plausible demonstration model. Results are not field-calibrated and should not be used for real operational decisions without engineering validation.</div>
 </>}
