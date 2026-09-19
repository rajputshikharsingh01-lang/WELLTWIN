"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Activity,BarChart3,Boxes,ChevronRight,Database,Gauge,LayoutDashboard,Settings,SlidersHorizontal,TriangleAlert,Wifi} from "lucide-react";
const items=[
 ["/dashboard","Overview",LayoutDashboard],[ "/wells","Wells",Boxes],[ "/telemetry","Telemetry",Activity],
 ["/simulation","Simulation",SlidersHorizontal],[ "/optimization","Optimization",Gauge],[ "/recommendations","Recommendations",TriangleAlert]
] as const;
export function Shell({children}:{children:React.ReactNode}){
 const path=usePathname();
 return <div className="min-h-screen bg-[#070a0d] grid-bg flex">
  <aside className="w-[245px] shrink-0 border-r border-[#1e2933] bg-[#090d11] p-4 hidden md:flex flex-col">
   <div className="px-3 py-4 border-b border-[#1e2933]">
    <div className="flex items-center gap-3"><div className="relative h-9 w-9 border border-cyan-400/50 rounded-md flex items-center justify-center"><Database size={19} className="text-cyan-300"/><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-cyan-300"/></div><div><div className="font-bold tracking-[.18em]">WELLTWIN</div><div className="text-[10px] text-slate-500 mt-1">BAGHEWALA FIELD DIGITAL TWIN</div></div></div>
   </div>
   <nav className="mt-5 space-y-1">{items.map(([href,label,Icon])=><Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md border ${path.startsWith(href)?"bg-cyan-400/10 border-cyan-400/20 text-cyan-200":"border-transparent text-slate-400 hover:text-white hover:bg-white/[.03]"}`}><Icon size={17}/>{label}<ChevronRight size={14} className="ml-auto opacity-40"/></Link>)}</nav>
   <div className="mt-auto border-t border-[#1e2933] pt-4"><div className="flex items-center gap-2 text-xs text-slate-500"><Settings size={14}/> System configuration</div></div>
  </aside>
  <main className="flex-1 min-w-0">
   <header className="h-16 border-b border-[#1e2933] bg-[#090d11]/95 backdrop-blur flex items-center justify-between px-5 md:px-7 sticky top-0 z-20">
    <div className="md:hidden font-bold tracking-[.18em]">WELLTWIN</div><div className="text-xs text-slate-500 hidden sm:block">BAGHEWALA / OPERATIONS CONTROL ROOM</div>
    <div className="flex items-center gap-5 text-xs"><span className="flex items-center gap-2 text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/>SYSTEM ONLINE</span><span className="text-slate-500 mono">API : 8000</span></div>
   </header>
   <div className="p-4 md:p-7 max-w-[1700px] mx-auto">{children}</div>
  </main>
 </div>
}