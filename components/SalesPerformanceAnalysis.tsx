
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LineChart, Line } from 'recharts';
import { Lead } from '../types';

interface SalesPerformanceAnalysisProps {
  leads: Lead[];
  startDate: string;
  endDate: string;
}

const SALESPERSONS = [
  { 
    id: 'LAURENT', 
    name: 'Laurent', 
    photo: 'https://www.rhonesolairepro.com/wp-content/uploads/2024/08/FXDriant-RSP_portraits-9-scaled-aspect-ratio-160-260-4.jpg' 
  },
  { 
    id: 'MORGAN', 
    name: 'Morgan', 
    photo: 'https://www.rhonesolairepro.com/wp-content/uploads/2024/09/FXDriant-RSP_portraits-26-scaled-aspect-ratio-160-260.jpg' 
  },
  { 
    id: 'PIERRE', 
    name: 'Pierre', 
    photo: 'https://www.rhonesolairepro.com/wp-content/uploads/2024/08/FXDriant-RSP_portraits-19-scaled-aspect-ratio-160-260-1.jpg' 
  }
];

const SalesPerformanceAnalysis: React.FC<SalesPerformanceAnalysisProps> = ({ leads, startDate, endDate }) => {
  const [viewMode, setViewMode] = useState<'team' | 'individual'>('team');
  const [dateType, setDateType] = useState<'lead' | 'appointment'>('lead');
  const [selectedIndividual, setSelectedIndividual] = useState(SALESPERSONS[0].id);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination when switching individual or filters
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedIndividual, dateType, startDate, endDate]);

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
    
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return 0;
  };

  const performanceData = useMemo(() => {
    const sLimit = dateToNum(startDate);
    const eLimit = dateToNum(endDate);

    const results = SALESPERSONS.map(sp => {
      const spLeads = leads.filter(l => {
        const refDateRaw = dateType === 'lead' ? l.dateEntry : l.dateAppointment;
        const refDate = dateToNum(refDateRaw);
        
        const nameMatch = l.salesperson?.trim().toUpperCase() === sp.id;
        return nameMatch && refDate >= sLimit && refDate <= eLimit;
      });

      const opportunities = spLeads.filter(l => 
        ['Opportunité Commerce', 'Parrainage', 'RDV Fixé'].includes(l.status)
      ).length;

      const sales = spLeads.filter(l => 
        l.salesStatus === 'Vendu' || l.salesStatus === 'Installé'
      ).length;

      const revenue = spLeads
        .filter(l => l.salesStatus === 'Vendu' || l.salesStatus === 'Installé')
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      const conversionRate = opportunities > 0 ? (sales / opportunities) * 100 : 0;

      const sortedLeads = [...spLeads].sort((a, b) => {
        const aIsVendu = a.salesStatus === 'Vendu';
        const bIsVendu = b.salesStatus === 'Vendu';
        
        if (aIsVendu && !bIsVendu) return -1;
        if (!aIsVendu && bIsVendu) return 1;

        const dateA = dateToNum(dateType === 'lead' ? a.dateEntry : a.dateAppointment);
        const dateB = dateToNum(dateType === 'lead' ? b.dateEntry : b.dateAppointment);
        return dateB - dateA;
      });

      return {
        ...sp,
        opportunities,
        sales,
        revenue,
        conversionRate,
        leads: sortedLeads
      };
    });

    return results;
  }, [leads, startDate, endDate, dateType]);

  const individualStats = useMemo(() => {
    return performanceData.find(p => p.id === selectedIndividual);
  }, [performanceData, selectedIndividual]);

  const paginatedLeads = useMemo(() => {
    if (!individualStats) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return individualStats.leads.slice(startIndex, startIndex + itemsPerPage);
  }, [individualStats, currentPage]);

  const totalPages = individualStats ? Math.ceil(individualStats.leads.length / itemsPerPage) : 0;

  const teamChartData = performanceData.map(p => ({
    name: p.name,
    Opportunités: p.opportunities,
    Ventes: p.sales
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 inline-flex space-x-1">
            <button 
              onClick={() => setViewMode('team')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'team' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Vue Équipe
            </button>
            <button 
              onClick={() => setViewMode('individual')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'individual' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Individuelle
            </button>
          </div>

          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 inline-flex space-x-1">
            <button 
              onClick={() => setDateType('lead')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateType === 'lead' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Date du Lead
            </button>
            <button 
              onClick={() => setDateType('appointment')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateType === 'appointment' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Date du RDV
            </button>
          </div>
        </div>

        {viewMode === 'individual' && (
          <div className="flex space-x-3">
            {SALESPERSONS.map(sp => (
              <button
                key={sp.id}
                onClick={() => setSelectedIndividual(sp.id)}
                className={`flex items-center space-x-3 px-4 py-2 rounded-2xl border transition-all ${
                  selectedIndividual === sp.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                }`}
              >
                <img src={sp.photo} className="w-6 h-6 rounded-full object-cover border border-white/20" alt={sp.name} />
                <span className="text-[10px] font-black uppercase tracking-widest">{sp.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {viewMode === 'team' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {performanceData.sort((a, b) => b.conversionRate - a.conversionRate).map((sp, idx) => (
              <div key={sp.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <i className={`fas ${idx === 0 ? 'fa-crown text-amber-500' : 'fa-medal text-slate-400'} text-6xl`}></i>
                </div>
                
                <div className="flex items-center space-x-6 mb-8">
                  <div className="relative">
                    <img src={sp.photo} className="w-20 h-20 rounded-[24px] object-cover shadow-2xl" alt={sp.name} />
                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-4 border-white ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {idx + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{sp.name}</h3>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Closing : {sp.conversionRate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Opportunités</p>
                    <p className="text-lg font-black text-slate-900">{sp.opportunities}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Ventes</p>
                    <p className="text-lg font-black text-emerald-600">{sp.sales}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-10 tracking-tight">
              Comparatif Équipe (Basé sur {dateType === 'lead' ? "la date d'entrée" : "la date de RDV"})
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamChartData} barGap={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: '900'}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: '700'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="top" align="right" height={40} iconType="circle" />
                  <Bar dataKey="Opportunités" fill="#0f172a" radius={[12, 12, 0, 0]} barSize={40} />
                  <Bar dataKey="Ventes" fill="#f59e0b" radius={[12, 12, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        individualStats && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-32 bg-slate-900"></div>
                <div className="relative pt-8">
                  <img src={individualStats.photo} className="w-48 h-48 rounded-[48px] object-cover mx-auto border-[10px] border-white shadow-2xl mb-6" alt={individualStats.name} />
                  <h3 className="text-3xl font-black text-slate-900 mb-2">{individualStats.name}</h3>
                  <div className="inline-flex items-center px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Sales Specialist RSP
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-slate-50 space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total CA Apporté</p>
                    <p className="text-3xl font-black text-slate-900 tabular-nums">
                      {individualStats.revenue.toLocaleString('fr-FR')} <span className="text-sm">€</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Objectifs Période</h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold">Volume Ventes</span>
                      <span className="text-xl font-black">{individualStats.sales} <span className="text-[10px] text-slate-500">/ 15</span></span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${Math.min(100, (individualStats.sales / 15) * 100)}%` }}></div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dossiers Reçus</p>
                  <h3 className="text-4xl font-black text-slate-900 tabular-nums">{individualStats.opportunities}</h3>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventes Réalisées</p>
                  <h3 className="text-4xl font-black text-emerald-500 tabular-nums">{individualStats.sales}</h3>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Closing Rate</p>
                  <h3 className="text-4xl font-black text-amber-500 tabular-nums">{individualStats.conversionRate.toFixed(1)}%</h3>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">
                  Opportunités traitées (par {dateType === 'lead' ? "date d'entrée" : "date de RDV"})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Prospect</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date {dateType === 'lead' ? 'Entrée' : 'RDV'}</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Statut Final</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">CA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedLeads.map((l, idx) => (
                        <tr key={idx} className={`hover:bg-slate-50/30 transition-colors ${l.salesStatus === 'Vendu' ? 'bg-emerald-50/20' : ''}`}>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black text-slate-900">{l.fullName || `${l.firstName} ${l.lastName}`}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-500 tabular-nums">
                            {dateType === 'lead' ? l.dateEntry : l.dateAppointment}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${l.salesStatus === 'Vendu' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {l.salesStatus || l.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">
                            {l.amount ? `${Number(l.amount).toLocaleString('fr-FR')}€` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination UI */}
                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-8">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Page {currentPage} sur {totalPages || 1} • {individualStats.leads.length} dossiers
                  </div>
                  <div className="flex space-x-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="px-5 py-2.5 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all"
                    >
                      Précédent
                    </button>
                    <button
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 transition-all shadow-lg shadow-slate-900/10"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default SalesPerformanceAnalysis;
