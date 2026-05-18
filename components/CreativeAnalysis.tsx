
import React, { useState, useEffect, useMemo } from 'react';
import { Lead } from '../types';
import { fetchFacebookCreativesPerformance, FacebookCreativeData } from '../services/facebookAdsService';

interface CreativeAnalysisProps {
  leads: Lead[];
  startDate: string;
  endDate: string;
  initialCreatives?: FacebookCreativeData[];
}

const CreativeAnalysis: React.FC<CreativeAnalysisProps> = ({ leads, startDate, endDate, initialCreatives = [] }) => {
  const [creativesFb, setCreativesFb] = useState<FacebookCreativeData[]>(initialCreatives);
  const [isLoading, setIsLoading] = useState(initialCreatives.length === 0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialCreatives.length > 0) {
      setCreativesFb(initialCreatives);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchFacebookCreativesPerformance(startDate, endDate);
        setCreativesFb(data);
      } catch (error) {
        console.error("Error loading creatives:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [startDate, endDate, initialCreatives]);

  const parseDate = (dateStr?: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      return new Date(year, month - 1, day).getTime();
    }
    return new Date(dateStr).getTime();
  };

  const combinedData = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;

    const filteredLeads = leads.filter(l => {
      const d = parseDate(l.dateEntry);
      return d >= start && d <= end;
    });

    const results = creativesFb.map(fb => {
      const leadCount = filteredLeads.filter(l => {
        const leadCreative = String(l.creative || '').toLowerCase().trim();
        const fbCreative = String(fb.name || '').toLowerCase().trim();
        return leadCreative === fbCreative;
      }).length;

      const cpl = leadCount > 0 ? fb.spend / leadCount : fb.spend;

      return {
        ...fb,
        leadCount,
        cpl: cpl,
        ctr: fb.impressions > 0 ? (fb.clicks / fb.impressions) * 100 : 0
      };
    });

    const filteredBySearch = results.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filteredBySearch.sort((a, b) => b.spend - a.spend);
  }, [creativesFb, leads, startDate, endDate, searchTerm]);

  const totalSpend = combinedData.reduce((acc, curr) => acc + curr.spend, 0);
  const totalLeads = combinedData.reduce((acc, curr) => acc + curr.leadCount, 0);
  const avgCpl = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : "0.00";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 max-w-md relative">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text"
            placeholder="Rechercher une créative..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-3.5 bg-white border border-slate-100 rounded-[22px] shadow-sm text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 transition-all outline-none"
          />
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fas fa-th-large"></i>
              <span>Grille</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fas fa-list"></i>
              <span>Liste</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 p-8 rounded-[40px] text-white shadow-xl shadow-slate-200">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest flex items-center">
            Budget Engagé <span className="ml-2 text-slate-600 font-bold lowercase">(facebook uniquement)</span>
          </p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-4xl font-bold tabular-nums">{totalSpend.toLocaleString('fr-FR')}</h3>
            <span className="text-xl font-bold text-slate-600">€</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Volume Leads</p>
          <h3 className="text-4xl font-bold text-slate-900 tabular-nums">{totalLeads}</h3>
        </div>
        <div className="bg-amber-500 p-8 rounded-[40px] text-white shadow-xl shadow-amber-500/20">
          <p className="text-[10px] font-black text-amber-100 uppercase mb-2 tracking-widest">CPL Période</p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-4xl font-bold tabular-nums">{avgCpl}</h3>
            <span className="text-xl font-bold text-amber-200">€</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-24 flex flex-col items-center justify-center animate-fade-in">
          <div className="relative">
            <i className="fas fa-sun text-6xl text-amber-500 animate-[spin_3s_linear_infinite]"></i>
          </div>
          <p className="mt-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Chargement de la performance...</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {combinedData.length > 0 ? combinedData.map((creative) => (
            <div key={creative.id} className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
              <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                {creative.imageUrl ? (
                  <img src={creative.imageUrl} alt={creative.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-200">
                    <i className="fas fa-play-circle text-6xl opacity-20"></i>
                    <span className="text-[8px] font-black uppercase mt-4 tracking-widest">No Visual Data</span>
                  </div>
                )}
                
                <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
                  <div className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-[#1877F2] shadow-xl">
                    <i className="fab fa-facebook-f text-sm"></i>
                  </div>
                  {creative.cpl < parseFloat(avgCpl) && creative.leadCount > 0 && (
                    <div className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg shadow-lg">Excellent ROI</div>
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                   <div className="flex justify-between items-end text-white">
                      <div>
                        <p className="text-[8px] font-black uppercase text-white/60 tracking-widest mb-1">CTR Moyen</p>
                        <p className="text-xl font-black">{creative.ctr.toFixed(2)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase text-white/60 tracking-widest mb-1">Impressions</p>
                        <p className="text-xl font-black">{creative.impressions.toLocaleString()}</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-7 flex-1 flex flex-col">
                <div className="mb-6">
                  <h4 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 min-h-[40px] group-hover:text-amber-600 transition-colors">
                    {creative.name}
                  </h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">ID: {creative.id.split('_').pop()}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Budget</p>
                    <p className="text-sm font-black text-slate-900">{creative.spend.toFixed(2)}€</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Leads</p>
                    <p className="text-sm font-black text-slate-900">{creative.leadCount}</p>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CPL Actuel</p>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">{creative.cpl.toFixed(2)}<span className="text-sm text-slate-300 ml-1">€</span></p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${creative.cpl < parseFloat(avgCpl) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <i className={`fas ${creative.cpl < parseFloat(avgCpl) ? 'fa-trending-up' : 'fa-minus'}`}></i>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase text-[11px] tracking-widest">Aucune créative ne correspond</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-900 uppercase tracking-widest w-[120px]">Visuel</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-900 uppercase tracking-widest">Nom</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Dépense</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Leads</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">CPL</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 font-black text-slate-900">
              {combinedData.map((creative) => (
                <tr key={creative.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-8 py-5">
                    <div className="w-20 h-24 rounded-2xl bg-slate-100 overflow-hidden shadow-sm border border-slate-200">
                      {creative.imageUrl ? <img src={creative.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><i className="fas fa-image text-slate-300"></i></div>}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm group-hover:text-amber-600 transition-colors line-clamp-1">{creative.name}</td>
                  <td className="px-8 py-5 text-right tabular-nums">{creative.spend.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                  <td className="px-8 py-5 text-center tabular-nums">{creative.leadCount}</td>
                  <td className="px-8 py-5 text-right">
                    <span className={`inline-block px-4 py-1.5 rounded-xl text-xs tabular-nums ${creative.cpl < parseFloat(avgCpl) ? 'text-emerald-700 bg-emerald-50' : 'text-slate-900 bg-slate-100'}`}>
                      {creative.cpl.toFixed(2)} €
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right text-slate-500 text-xs tabular-nums">{creative.ctr.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CreativeAnalysis;
