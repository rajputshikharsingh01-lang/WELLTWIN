"use client";
import {useEffect,useRef,useState} from "react";
import {api} from "@/lib/api";
import {Card,PageTitle,Status,ProgressBar} from "@/components/ui";
import {SimulationProjectionChart} from "@/components/charts";

const FIELD_LABEL:Record<string,string>={soak_time:"Soak Time (hrs)",injection_pressure:"Injection Pressure (psi)",spm:"SPM (strokes/min)",stroke_length:"Stroke Length (in)"};

export default function Simulation(){
  const [wells,setWells]=useState<any[]>([]);
  const [id,setId]=useState("");
  const [current,setCurrent]=useState<any>(null);
  const [form,setForm]=useState<Record<string,string>>({soak_time:"",injection_pressure:"",spm:"",stroke_length:""});
  const [result,setResult]=useState<any>();
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");
  const debounce=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);

  useEffect(()=>{
    api.wells().then(x=>{
      const a=Array.isArray(x)?x:(x?.wells||[]);
      setWells(a);
      if(a[0]) setId(String(a[0].well_id??a[0].id));
    });
  },[]);

  useEffect(()=>{
    if(!id) return;
    setResult(undefined);
    api.well(id).then(w=>{
      setCurrent(w);
      const n=(k:string)=>w?.[k]??"";
      setForm({soak_time:String(n("soak_time")),injection_pressure:String(n("injection_pressure")),spm:String(n("spm")),stroke_length:String(n("stroke_length"))});
    }).catch(()=>{});
  },[id]);

  // one field edited -> ask the backend's physically-coupled model for the other three
  const onField=(k:string,val:string)=>{
    setForm(f=>({...f,[k]:val}));
    if(debounce.current) clearTimeout(debounce.current);
    if(val==="" || isNaN(Number(val))) return;
    debounce.current=setTimeout(()=>{
      api.correlate(id,k,Number(val)).then(vals=>{
        setForm({soak_time:String(vals.soak_time),injection_pressure:String(vals.injection_pressure),spm:String(vals.spm),stroke_length:String(vals.stroke_length),[k]:val});
      }).catch(()=>{});
    },350);
  };

  const run=async()=>{
    setBusy(true);setErr("");
    try{
      const r=await api.simulate({well_id:id,...Object.fromEntries(Object.entries(form).map(([k,v])=>[k,v===""?null:Number(v)]))});
      setResult(r);
    }catch(e){ setErr("Simulation endpoint rejected this payload. Check backend schema."); }
    setBusy(false);
  };

  return <>
    <PageTitle title="WHAT-IF SIMULATION" sub="Test operating scenarios before applying them — fields are physically coupled"/>
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <div className="font-semibold text-sm mb-4">CURRENT SCENARIO</div>
        <select value={id} onChange={e=>setId(e.target.value)} className="w-full bg-[#0a0f13] border border-[#26343e] rounded p-2 text-sm mb-4">
          {wells.map(w=><option key={String(w.well_id??w.id)} value={String(w.well_id??w.id)}>{String(w.well_id??w.id)}</option>)}
        </select>
        {current ? <div className="grid grid-cols-2 gap-3 text-xs">
          {Object.keys(FIELD_LABEL).map(k=><div key={k} className="border border-[#1e2933] rounded p-2"><div className="text-slate-500">{FIELD_LABEL[k]}</div><div className="mono mt-1 text-cyan-200">{current[k]}</div></div>)}
          <div className="border border-[#1e2933] rounded p-2"><div className="text-slate-500">Production</div><div className="mono mt-1">{current.production}</div></div>
          <div className="border border-[#1e2933] rounded p-2"><div className="text-slate-500">Health</div><div className="mono mt-1"><Status value={current.health}/></div></div>
        </div> : <div className="text-xs text-slate-500">Loading well…</div>}
        <div className="text-xs text-slate-500 mt-4">Values are loaded live from the backend.</div>
      </Card>
      <Card className="p-5">
        <div className="font-semibold text-sm mb-4">PROPOSED SCENARIO</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.keys(form).map(k=>
            <label key={k} className="text-xs text-slate-500 uppercase">{k.replaceAll("_"," ")}
              <input value={form[k]} onChange={e=>onField(k,e.target.value)} type="number" className="mt-1 w-full bg-[#0a0f13] border border-[#26343e] rounded p-2 text-sm text-white outline-none focus:border-cyan-400"/>
            </label>)}
        </div>
        <div className="text-[10px] text-slate-600 mt-2">Editing any single field auto-fills the other three from the CSS/SRP coupling model (soak×pressure and spm×stroke constants).</div>
        <button onClick={run} disabled={busy} className="mt-5 w-full bg-cyan-300 text-black font-semibold rounded px-4 py-2.5 text-sm hover:bg-cyan-200 disabled:opacity-50">{busy?"RUNNING…":"RUN SIMULATION"}</button>
        {err && <div className="mt-2 text-xs text-red-300">{err}</div>}
      </Card>
    </div>

    {result && !result.error && <>
      <div className="grid md:grid-cols-3 gap-3 mt-4">
        <Card className="p-4"><div className="text-[10px] uppercase text-slate-500">Production impact</div><div className="text-2xl font-semibold mono mt-2 text-cyan-200">{result.expected_impact?.production_percent}%</div><div className="text-xs text-slate-500 mt-1">{result.current?.production} → {result.simulated?.production}</div></Card>
        <Card className="p-4"><div className="text-[10px] uppercase text-slate-500">Float risk (proposed)</div><div className="mt-2"><Status value={result.simulated?.float_risk}/></div><div className="text-xs text-slate-500 mt-1">rod stress {result.simulated?.rod_stress}</div></Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase text-slate-500">Safety verdict</div>
          <div className="mt-2"><Status value={result.safety?.verdict}/></div>
          <div className="mt-2"><ProgressBar percent={result.safety?.probability_percent??0} critical={result.safety?.verdict==="UNSAFE"} warn={result.safety?.verdict==="CAUTION"}/></div>
          <div className="text-xs text-slate-500 mt-1">{result.safety?.probability_percent}% abnormal-event probability</div>
        </Card>
      </div>
      <Card className="p-5 mt-4">
        <div className="flex justify-between mb-4"><div className="font-semibold text-sm">PROJECTED RAMP TO PROPOSED SCENARIO</div><span className="text-[10px] text-slate-500 mono">{result.series?.length||0} steps</span></div>
        {result.series?.length ? <SimulationProjectionChart data={result.series}/> : <div className="text-xs text-slate-500">No projection series returned.</div>}
      </Card>
      {result.safety?.factors?.length>0 && <Card className="p-5 mt-4">
        <div className="font-semibold text-sm mb-3">SAFETY FACTORS</div>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">{result.safety.factors.map((f:string,i:number)=><li key={i}>{f}</li>)}</ul>
      </Card>}
      <div className="mt-4 text-[10px] text-amber-300/80">Simulation does not automatically modify actual well parameters.</div>
    </>}
    {result?.error && <Card className="p-5 mt-4 text-sm text-red-300">{result.error}</Card>}
    <div className="mt-4 text-[10px] text-slate-600">Engineering-plausible demonstration model. Results are not field-calibrated and should not be used for real operational decisions without engineering validation.</div>
  </>;
}
