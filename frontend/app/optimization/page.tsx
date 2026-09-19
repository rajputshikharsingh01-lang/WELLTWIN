"use client";
import {useEffect,useState} from "react";
import {api} from "@/lib/api";
import {Card,PageTitle,Status,Empty,ProgressBar} from "@/components/ui";

function Row({label,current,optimal,unit}:{label:string;current:any;optimal:any;unit?:string}){
  const changed=Number(current)!==Number(optimal);
  return <div className="flex items-center justify-between border-b border-[#1e2933] py-2.5 text-xs">
    <span className="text-slate-500">{label}</span>
    <span className="flex items-center gap-2 mono">
      <span className="text-slate-400">{current}{unit}</span>
      <span className="text-slate-600">→</span>
      <span className={changed?"text-cyan-300 font-semibold":"text-slate-400"}>{optimal}{unit}</span>
    </span>
  </div>;
}

export default function Optimization(){
  const [wells,setWells]=useState<any[]>([]);
  const [id,setId]=useState("");
  const [opt,setOpt]=useState<any>();
  const [err,setErr]=useState(false);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    api.wells().then(x=>{
      const a=Array.isArray(x)?x:(x?.wells||[]);
      setWells(a);
      if(a[0]) setId(String(a[0].well_id??a[0].id));
    });
  },[]);

  useEffect(()=>{
    if(!id) return;
    setLoading(true);setErr(false);
    api.optimize(id).then(setOpt).catch(()=>{setOpt(null);setErr(true)}).finally(()=>setLoading(false));
  },[id]);

  return <>
    <PageTitle title="WELLTWIN OPTIMIZER" sub="CSS + SRP twin-point operating optimization"/>
    <div className="flex gap-3 mb-4">
      <select value={id} onChange={e=>setId(e.target.value)} className="bg-[#0d1217] border border-[#26343e] rounded px-3 h-10 text-sm">
        {wells.map(w=><option key={String(w.well_id??w.id)} value={String(w.well_id??w.id)}>{String(w.well_id??w.id)}</option>)}
      </select>
    </div>

    {loading && <div className="text-sm text-slate-500">Running twin-point search…</div>}
    {err && <Empty text="No optimizer output available"/>}

    {opt && !err && <>
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <Card className="p-4"><div className="text-[10px] uppercase text-slate-500">Expected production impact</div><div className="text-2xl font-semibold mono mt-2 text-cyan-200">{opt.expected_impact_percent}%</div><div className="text-xs text-slate-500 mt-1">{opt.current?.production} → {opt.optimal?.production} bbl/d</div></Card>
        <Card className="p-4"><div className="text-[10px] uppercase text-slate-500">Float risk at optimum</div><div className="mt-2"><Status value={opt.optimal?.float_risk}/></div><div className="text-xs text-slate-500 mt-1">rod stress {opt.optimal?.rod_stress}</div></Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase text-slate-500">Safety at optimum</div>
          <div className="mt-2"><Status value={opt.safety?.verdict}/></div>
          <div className="mt-2"><ProgressBar percent={opt.safety?.probability_percent??0} critical={opt.safety?.verdict==="UNSAFE"} warn={opt.safety?.verdict==="CAUTION"}/></div>
          <div className="text-xs text-slate-500 mt-1">{opt.safety?.probability_percent}% risk</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold text-sm mb-1">CSS OPERATING POINT</div>
          <div className="text-[10px] text-slate-500 mb-3">Cyclic Steam Stimulation — current → optimal</div>
          <Row label="Soak time (hrs)" current={opt.current?.parameters?.soak_time} optimal={opt.css_point?.soak_time}/>
          <Row label="Injection pressure (psi)" current={opt.current?.parameters?.injection_pressure} optimal={opt.css_point?.injection_pressure}/>
        </Card>
        <Card className="p-5">
          <div className="font-semibold text-sm mb-1">SRP OPERATING POINT</div>
          <div className="text-[10px] text-slate-500 mb-3">Sucker Rod Pump — current → optimal</div>
          <Row label="SPM (strokes/min)" current={opt.current?.parameters?.spm} optimal={opt.srp_point?.spm}/>
          <Row label="Stroke length (in)" current={opt.current?.parameters?.stroke_length} optimal={opt.srp_point?.stroke_length}/>
        </Card>
      </div>

      {opt.safety?.factors?.length>0 && <Card className="p-5 mt-4">
        <div className="font-semibold text-sm mb-3">CONSIDERATIONS AT THE OPTIMAL POINT</div>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">{opt.safety.factors.map((f:string,i:number)=><li key={i}>{f}</li>)}</ul>
      </Card>}
    </>}

    <div className="mt-4 text-[10px] text-slate-600">Engineering-plausible demonstration model. Results are not field-calibrated and should not be used for real operational decisions without engineering validation.</div>
  </>;
}
