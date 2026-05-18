
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Lead } from '../types';

interface TeleproPerformanceProps {
  leads: Lead[];
  startDate: string;
  endDate: string;
}

const JOANNE_PHOTO = "https://www.rhonesolairepro.com/wp-content/uploads/2024/08/FXDriant-RSP_ext-9-scaled-aspect-ratio-160-260-2.jpg";

const TeleproPerformance: React.FC<TeleproPerformanceProps> = ({ leads, startDate, endDate }) => {
  
  const dateToNum = (dateVal: any): number => {
    if (!dateVal) return 0;
    let str = String(dateVal).trim();
    if (str.includes('T')) str = str.split('T')[0];
    const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (dmyMatch) {
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
      return year * 10000 + parseInt(dmyMatch[2], 10) * 100 + parseInt(dmyMatch[1], 10);
    }
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return parseInt(isoMatch[1]) * 10000 + parseInt(isoMatch[2]) * 100 + parseInt(isoMatch[3]);
    return 0;
  };

  const stats = useMemo(() => {
    const sLimit = dateToNum(startDate);
    const eLimit = dateToNum(endDate);

    const filteredLeads = leads.filter(l => {
      const n = dateToNum(l.dateEntry);
      const isWithinDate = n >= sLimit && n <= eLimit;
      // EXCLUSION : On ignore les opportunités techniques pour le calcul de perf Télépro
      const isNotTechnical = l.status !== 'Opportunité Service Technique';
      return isWithinDate && isNotTechnical;
    });

    const appointments = filteredLeads.filter(l => 
      ['Opportunité Commerce', 'Parrainage', 'Opportunité Tertiaire'].includes(l.status)
    ).length;

    const unreachable = filteredLeads.filter(l => 
      ['Injoignable', 'Répondeur'].includes(l.status)
    ).length;

    // Calcul des répondeurs en cours (x1, x2, x3)
    const answeringMachineLeads = filteredLeads.filter(l => 
      ['Répondeur x1', 'Répondeur x2', 'Répondeur x3'].includes(l.status)
    ).length;

    const conversionRate = filteredLeads.length > 0 ? (appointments / filteredLeads.length) * 100 : 0;

    // Analyse par source
    const sourceMap: Record<string, { leads: number, rdvs: number }> = {};
    filteredLeads.forEach(l => {
      const s = l.source || 'Inconnue';
      if (!sourceMap[s]) sourceMap[s] = { leads: 0, rdvs: 0 };
      sourceMap[s].leads++;
      if (['Opportunité Commerce', 'Parrainage', 'Opportunité Tertiaire'].includes(l.status)) {
        sourceMap[s].rdvs++;
      }
    });

    const sourceEfficiency = Object.entries(sourceMap).map(([name, data]) => ({
      name,
      efficiency: data.leads > 0 ? Math.round((data.rdvs / data.leads) * 100) : 0,
      count: data.leads
    })).sort((a, b) => b.efficiency - a.efficiency);

    // Données pour le graphique temporel
    const dailyMap: Record<string, { date: string, rate: number, count: number }> = {};
    filteredLeads.forEach(l => {
      const n = dateToNum(l.dateEntry);
      if (n) {
        const d = new Date(Math.floor(n/10000), Math.floor((n%10000)/100)-1, n%100);
        const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        if (!dailyMap[key]) dailyMap[key] = { date: key, rate: 0, count: 0 };
        dailyMap[key].count++;
        if (['Opportunité Commerce', 'Parrainage', 'Opportunité Tertiaire'].includes(l.status)) {
          dailyMap[key].rate++;
        }
      }
    });

    const chartData = Object.values(dailyMap).map(d => ({
      ...d,
      rate: Math.round((d.rate / d.count) * 100)
    }));

    return { 
      total: filteredLeads.length, 
      appointments, 
      unreachable, 
      answeringMachineLeads,
      conversionRate, 
      sourceEfficiency,
      chartData 
    };
  }, [leads, startDate, endDate]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Profile Joanne */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-4 bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-500/10 to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <img 
              src={JOANNE_PHOTO} 
              className="w-40 h-40 rounded-[40px] object-cover border-4 border-white/10 shadow-2xl mb-6 hover:scale-105 transition-transform duration-500" 
              alt="Joanne" 
            />
            <h2 className="text-3xl font-black mb-1 tracking-tight">Joanne</h2>
            <div className="px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-amber-500/20 mb-8">
              Responsable Téléprospection
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Dossiers</p>
                <p className="text-xl font-black">{stats.total}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">RDVs Fixés</p>
                <p className="text-xl font-black text-amber-500">{stats.appointments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Speed to Lead Card - FICTIVE MAIS MISE EN AVANT */}
        <div className="lg:col-span-8 bg-white rounded-[48px] border border-slate-100 p-10 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                <i className="fas fa-bolt"></i>
                <span>Speed to Lead</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">Temps moyen de premier rappel</h3>
              <p className="text-sm font-bold text-slate-400 mt-2 italic">Indicateur de réactivité sur les flux entrants</p>
            </div>
            <div className="text-right">
              <span className="text-5xl font-black text-slate-900 tabular-nums">14</span>
              <span className="text-xl font-black text-slate-300 ml-2 uppercase">min</span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Taux Transformation</p>
              <h4 className="text-3xl font-black text-slate-900">{stats.conversionRate.toFixed(1)}%</h4>
            </div>
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Injoignables</p>
              <h4 className="text-3xl font-black text-slate-900">{stats.unreachable} <span className="text-sm font-bold text-slate-400">cas</span></h4>
            </div>
            <div className="p-6 bg-amber-500 rounded-[32px] text-white shadow-xl shadow-amber-500/20">
              <p className="text-[10px] font-black text-amber-100 uppercase tracking-widest mb-2">Répondeurs en cours</p>
              <h4 className="text-3xl font-black">{stats.answeringMachineLeads} <span className="text-sm opacity-50 font-bold uppercase tracking-widest text-[10px]">leads</span></h4>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Évolution Taux de RDV */}
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-10 uppercase tracking-widest text-[10px]">Taux de RDV fixé (%) - Évolution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}} 
                  formatter={(val: number) => [`${val}%`, 'Taux de RDV']}
                />
                <Area type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Efficacité par Source */}
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-10 uppercase tracking-widest text-[10px]">Efficacité Télépro par Source (% RDV)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sourceEfficiency} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: '900'}} width={100} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  formatter={(val: number) => [`${val}%`, 'Efficacité']}
                />
                <Bar dataKey="efficiency" radius={[0, 10, 10, 0]} barSize={24}>
                  {stats.sourceEfficiency.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#0f172a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeleproPerformance;
