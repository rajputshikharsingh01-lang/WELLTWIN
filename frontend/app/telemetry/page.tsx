"use client";
import {useEffect,useState} from "react";
import {api} from "@/lib/api";
import {createWellSocket} from "@/lib/websocket";
import {Card,PageTitle,Empty,Status} from "@/components/ui";
import {TelemetryChart,FlowPumpChart,TankVibrationChart} from "@/components/charts";

const SENSORS:{key:string;label:string;hardware:string;unit:string}[]=[
  {key:"pressure",label:"Wellhead Pressure",hardware:"Pressure Transducer",unit:"psi"},
  {key:"temperature",label:"Temperature",hardware:"RTD / Thermocouple",unit:"°F"},
  {key:"flow",label:"Flow Rate",hardware:"Flow Meter",unit:"bbl/d"},
  {key:"pump_load",label:"Pump Load",hardware:"Pump/ESP Sensor",unit:"%"},
  {key:"tank_level",label:"Tank Level",hardware:"Level Sensor/Transmitter",unit:"%"},
  {key:"vibration",label:"Vibration",hardware:"Vibration Sensor",unit:"mm/s"},
];

export default function Telemetry(){
  const [wells,setWells]=useState<any[]>([]);
  const [id,setId]=useState("");
  const [data,setData]=useState<any[]>([]);
  const [live,setLive]=useState<any>();
  const [status,setStatus]=useState<any>("closed");
  const [err,setErr]=useState(false);

  useEffect(()=>{
    api.wells().then(x=>{
      const a=Array.isArray(x)?x:(x?.wells||[]);
      setWells(a);
      if(a[0]) setId(String(a[0].well_id??a[0].id));
    }).catch(()=>setErr(true));
  },[]);

  useEffect(()=>{
    if(!id) return;
    setErr(false);
    api.telemetry(id).then(x=>setData(Array.isArray(x)?x:(x?.data||x?.telemetry||[]))).catch(()=>{setData([]);setErr(true)});
    return createWellSocket(id,setLive,setStatus);
  },[id]);

  return <>
    <PageTitle title="LIVE TELEMETRY" sub="Historical telemetry + simulated live sensor feed"/>
    <div className="flex flex-wrap gap-3 mb-4 items-center">
      <select value={id} onChange={e=>setId(e.target.value)} className="bg-[#0d1217] border border-[#26343e] rounded px-3 h-10 text-sm">
        {wells.map(w=><option key={String(w.well_id??w.id)} value={String(w.well_id??w.id)}>{String(w.well_id??w.id)}</option>)}
      </select>
      <div className="panel px-3 h-10 flex items-center text-xs"><Status value={status==="open"?"LIVE":"DISCONNECTED"}/></div>
      {live?.source && <div className="text-[10px] text-slate-500 mono">source: {live.source}</div>}
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
      {SENSORS.map(s=>{
        const val=live?.[s.key];
        return <Card className="p-3" key={s.key}>
          <div className="text-[9px] tracking-wider text-slate-500 uppercase">{s.label}</div>
          <div className="mt-1 text-lg font-semibold mono text-cyan-200">{val!==undefined&&val!==null?Number(val).toFixed(1):"—"}<span className="text-[10px] text-slate-500 ml-1">{s.unit}</span></div>
          <div className="mt-1 text-[9px] text-slate-600">{s.hardware}</div>
        </Card>;
      })}
    </div>

    {err ? <Empty text="Backend unreachable — check the API is running on :8000"/> : <div className="grid xl:grid-cols-2 gap-4">
      <Card className="p-5 xl:col-span-2">
        <div className="flex justify-between mb-3"><span className="font-semibold text-sm">PRESSURE / TEMPERATURE</span><span className="text-[10px] text-slate-500 mono">Pressure Transducer · RTD/Thermocouple</span></div>
        {data.length?<TelemetryChart data={data}/>:<Empty text="No telemetry available"/>}
      </Card>
      <Card className="p-5">
        <div className="flex justify-between mb-3"><span className="font-semibold text-sm">FLOW / PUMP-ESP</span><span className="text-[10px] text-slate-500 mono">Flow Meter · Pump/ESP Sensors</span></div>
        {data.length?<FlowPumpChart data={data}/>:<Empty text="No telemetry available"/>}
      </Card>
      <Card className="p-5">
        <div className="flex justify-between mb-3"><span className="font-semibold text-sm">TANK LEVEL / VIBRATION</span><span className="text-[10px] text-slate-500 mono">Level Transmitter · Vibration Sensor</span></div>
        {data.length?<TankVibrationChart data={data}/>:<Empty text="No telemetry available"/>}
      </Card>
    </div>}
    <div className="mt-4 text-[10px] text-slate-600">Live channel is a simulated hardware feed (2s cadence) mapped to real sensor types: Pressure Transducer, RTD/Thermocouple, Flow Meter, Pump/ESP Sensors, Level Sensor/Transmitter, Vibration Sensor.</div>
  </>;
}
