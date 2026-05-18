
import React, { useMemo } from 'react';
import { Lead } from '../types';

interface SourceAnalysisProps {
  leads: Lead[];
  startDate: string;
  endDate: string;
}

const SourceAnalysis: React.FC<SourceAnalysisProps> = ({ leads, startDate, endDate }) => {
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

  const sourceStats = useMemo(() => {
    const stats: Record<string, any> = {};
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;

    const filteredLeads = leads.filter(lead => {
      const entryTime = parseDate(lead.dateEntry);
      return entryTime >= start && entryTime <= end;
    });

    filteredLeads.forEach(lead => {
      const source = lead.source || 'Inconnue';
      if (!stats[source]) {
        stats[source] = {
          name: source,
          leads: 0,
          rdv: 0,
          sales: 0,
        };
      }
      stats[source].leads++;
      if (['Opportunité Commerce', 'Parrainage', 'RDV Fixé'].includes(lead.status)) {
        stats[source].rdv++;
      }
      if (lead.salesStatus === 'Vendu' || lead.salesStatus === 'Installé') {
        stats[source].sales++;
      }
    });

    return Object.values(stats).sort((a, b) => b.leads - a.leads);
  }, [leads, startDate, endDate]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Analyse par Sources d'Acquisition</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest">Canal</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Volume Leads</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Volume RDV</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Taux RDV</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Ventes</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {sourceStats.length > 0 ? (
                sourceStats.map((source, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                          {source.name.charAt(0)}
                        </div>
                        <span className="font-black text-slate-900 tracking-tight">{source.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center font-black text-slate-900 text-xl tabular-nums">{source.leads}</td>
                    <td className="px-8 py-6 text-center font-black text-amber-500 tabular-nums">{source.rdv}</td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-xs font-black shadow-sm">
                        {((source.rdv / source.leads) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center font-black text-emerald-500 tabular-nums">{source.sales}</td>
                    <td className="px-8 py-6 text-center">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-[120px] mx-auto mb-2 border border-slate-200 shadow-inner">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.min(100, (source.sales / source.leads) * 200)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        {((source.sales / source.leads) * 100).toFixed(1)}% de succès
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <i className="fas fa-search text-4xl text-slate-100 mb-4"></i>
                      <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Aucune donnée sur cette période</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SourceAnalysis;
