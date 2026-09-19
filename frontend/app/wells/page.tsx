"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageTitle, SearchBox, Card, Status, ErrorBox, Empty } from "@/components/ui";

const v = (o: any, ...keys: string[]) => {
  for (const key of keys) if (o?.[key] !== undefined && o?.[key] !== null) return o[key];
  return "—";
};

export default function Wells() {
  const [data, setData] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState(false);

  const load = () => {
    setErr(false);
    api.wells()
      .then((x) => setData(Array.isArray(x) ? x : x?.wells || []))
      .catch(() => setErr(true));
  };

  useEffect(() => { load(); }, []);

  const rows = data.filter((w) => JSON.stringify(w).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageTitle title="WELLS" sub="Field asset registry and current operating state" />
      {err ? (
        <ErrorBox onRetry={load} />
      ) : (
        <>
          <div className="mb-4 max-w-sm"><SearchBox value={q} onChange={setQ} /></div>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-[#1e2933]">
                <tr>{["Well ID","Status","Production","Pressure","Water Cut","Temperature","Health","Last Update"].map((x) => <th className="p-4" key={x}>{x}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((w, i) => {
                  const id = String(v(w, "well_id", "id", "name") || `WELL-${i + 1}`);
                  return (
                    <tr key={id} className="border-b border-[#172129] hover:bg-white/[.025]">
                      <td className="p-4"><Link className="text-cyan-300 mono" href={`/wells/${encodeURIComponent(id)}`}>{id}</Link></td>
                      <td className="p-4"><Status value={String(v(w, "status"))} /></td>
                      <td className="p-4 mono">{String(v(w, "production", "oil_rate"))}</td>
                      <td className="p-4 mono">{String(v(w, "pressure"))}</td>
                      <td className="p-4 mono">{String(v(w, "water_cut"))}</td>
                      <td className="p-4 mono">{String(v(w, "temperature"))}</td>
                      <td className="p-4"><Status value={String(v(w, "health"))} /></td>
                      <td className="p-4 text-slate-500">{String(v(w, "last_update", "updated_at", "timestamp"))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rows.length && <Empty text="No matching wells" />}
          </Card>
        </>
      )}
    </>
  );
}
