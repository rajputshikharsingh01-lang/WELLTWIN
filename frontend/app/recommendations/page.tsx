"use client";
import {useEffect,useState} from "react";
import {api} from "@/lib/api";
import {Card,PageTitle,Status,Empty,ProgressBar} from "@/components/ui";

export default function Recommendations(){
  const [wells,setWells]=useState<any[]>([]);
  const [id,setId]=useState("");
  const [data,setData]=useState<any[]>([]);
  const [err,setErr]=useState(false);

  useEffect(()=>{
    api.wells().then(x=>{
      const a=Array.isArray(x)?x:(x?.wells||[]);
      setWells(a);
      if(a[0]) setId(String(a[0].well_id??a[0].id));
    });
  },[]);

  const reload=()=>{
    if(!id) return;
    setErr(false);
    api.recommendations(id).then(x=>setData(Array.isArray(x)?x:(x?.recommendations||[]))).catch(()=>{setData([]);setErr(true)});
  };
  useEffect(reload,[id]);

  const apply=async(r:any)=>{
    const rid=String(r.id??r.rec_id??r.recommendation_id??"");
    if(!rid) return alert("Recommendation id not provided by backend.");
    await api.applyRecommendation(id,rid);
    reload();
  };

  const safety=data.find(r=>r.type==="SAFETY");
  const others=data.filter(r=>r.type!=="SAFETY");

  return <>
    <PageTitle title="RECOMMENDATIONS" sub="Backend-generated optimization + safety actions"/>
    <select value={id} onChange={e=>setId(e.target.value)} className="bg-[#0d1217] border border-[#26343e] rounded px-3 h-10 text-sm mb-4">
      {wells.map(w=><option key={String(w.well_id??w.id)} value={String(w.well_id??w.id)}>{String(w.well_id??w.id)}</option>)}
    </select>

    {err && <Empty text="No recommendations available"/>}

    {safety && <Card className="p-5 mb-4 border-l-2 border-l-cyan-400/50">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-sm">{safety.title}</div>
        <Status value={safety.severity}/>
      </div>
      <div className="mt-3"><ProgressBar percent={safety.probability_percent??0} critical={safety.severity==="CRITICAL"} warn={safety.severity==="WARNING"}/></div>
      <div className="text-xs text-slate-500 mt-1">{safety.probability_percent}% estimated probability of an abnormal / unsafe event at the current operating point</div>
      {safety.factors?.length>0 && <ul className="text-xs text-slate-400 mt-3 space-y-1 list-disc pl-4">{safety.factors.map((f:string,i:number)=><li key={i}>{f}</li>)}</ul>}
    </Card>}

    {others.length ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
      {others.map((r,i)=><Card key={String(r.id??i)} className="p-5">
        <div className="flex justify-between"><div className="font-semibold text-sm">{String(r.title??r.type??"RECOMMENDATION")}</div><Status value={String(r.severity??r.status??"INFO")}/></div>
        <p className="text-xs text-slate-400 mt-3">{String(r.reason??r.description??r.message??"Backend recommendation")}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="border border-[#1e2933] p-2"><div className="text-slate-600">CURRENT</div><div className="mono mt-1">{String(r.current_value??"—")}</div></div>
          <div className="border border-[#1e2933] p-2"><div className="text-slate-600">RECOMMENDED</div><div className="mono mt-1">{String(r.recommended_value??"—")}</div></div>
        </div>
        <button onClick={()=>apply(r)} className="mt-4 w-full border border-cyan-400/30 text-cyan-200 rounded py-2 text-xs hover:bg-cyan-400/10">APPLY</button>
      </Card>)}
    </div> : !err && !safety && <Empty text="No recommendations available"/>}
    <div className="mt-4 text-[10px] text-slate-600">Engineering-plausible demonstration model. Results are not field-calibrated and should not be used for real operational decisions without engineering validation.</div>
  </>;
}
