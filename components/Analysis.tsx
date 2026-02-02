
import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Lead } from '../types';
import { fetchFacebookAdsPerformance, FacebookAdsData } from '../services/facebookAdsService';

interface AnalysisProps {
  leads: Lead[];
}

const Analysis: React.FC<AnalysisProps> = ({ leads }) => {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [fbData, setFbData] = useState<FacebookAdsData | null>(null);
  const [isLoadingFb, setIsLoadingFb] = useState(false);

  useEffect(() => {
    const loadFb = async () => {
      setIsLoadingFb(true);
      const data = await fetchFacebookAdsPerformance(startDate, endDate);
      setFbData(data);
      setIsLoadingFb(false);
    };
    loadFb();
  }, [startDate, endDate]);

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

  const filteredData = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;

    const filtered = leads.filter(lead => {
      const entryTime = parseDate(lead.dateEntry);
      return entryTime >= start && entryTime <= end;
    });

    const prospects = filtered.length;
    const rdvs = filtered.filter(l => 
      ['Opportunité Commerce', 'Parrainage', 'Opportunité tertiaire'].includes(l.status)
    ).length;
    
    const sales = filtered.filter(l => 
      l.salesStatus === 'Vendu' || l.salesStatus === 'Installé'
    ).length;

    const spend = fbData?.spend || 0;

    return {
      prospects,
      rdvs,
      sales,
      spend,
      rateRdv: prospects > 0 ? ((rdvs / prospects) * 100).toFixed(2) : "0.00",
      rateSale: rdvs > 0 ? ((sales / rdvs) * 100).toFixed(2) : "0.00",
      cpl: prospects > 0 ? (spend / prospects).toFixed(2) : "0.00",
      cpr: rdvs > 0 ? (spend / rdvs).toFixed(2) : "0.00",
      cpv: sales > 0 ? (spend / sales).toFixed(2) : "0.00",
      filteredLeads: filtered
    };
  }, [leads, startDate, endDate, fbData]);

  const chartData = useMemo(() => {
    const dailyMap: { [key: string]: any } = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      dailyMap[dateKey] = { name: dateKey, prospects: 0, rdvs: 0, ventes: 0 };
    }

    filteredData.filteredLeads.forEach(lead => {
      const d = new Date(parseDate(lead.dateEntry));
      const dateKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].prospects++;
        if (['Opportunité Commerce', 'Parrainage', 'Opportunité tertiaire'].includes(lead.status)) {
          dailyMap[dateKey].rdvs++;
        }
        if (lead.salesStatus === 'Vendu' || lead.salesStatus === 'Installé') {
          dailyMap[dateKey].ventes++;
        }
      }
    });

    return Object.values(dailyMap);
  }, [filteredData, startDate, endDate]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sélecteur de Date */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Du</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Au</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        {isLoadingFb && <div className="flex items-center space-x-2 text-amber-500 text-xs font-bold"><i className="fas fa-circle-notch fa-spin"></i><span>Synchro Meta...</span></div>}
      </div>

      {/* KPI Section - Dark Theme */}
      <div className="bg-[#001a35] p-8 rounded-[40px] shadow-2xl space-y-8">
        
        {/* Ligne 1 : L'entonnoir de conversion */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Bloc Prospects */}
          <div className="bg-[#2a5991] p-4 rounded-xl min-w-[140px] flex-1">
            <p className="text-slate-300 text-xs font-medium mb-1">Prospects</p>
            <h3 className="text-white text-3xl font-bold mb-1">{filteredData.prospects.toLocaleString()}</h3>
            <p className="text-emerald-400 text-[10px] font-bold flex items-center">
              <i className="fas fa-arrow-up mr-1"></i> {((filteredData.prospects / 100) * 1.5).toFixed(1)}%
            </p>
          </div>

          {/* Transition Taux RDV */}
          <div className="text-center px-2">
            <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Taux de RDV</p>
            <h4 className="text-white text-xl font-bold">{filteredData.rateRdv}%</h4>
            <p className="text-emerald-400 text-[10px] font-bold"><i className="fas fa-arrow-up mr-1"></i> 3,77%</p>
          </div>

          {/* Bloc RDV */}
          <div className="bg-[#2a5991] p-4 rounded-xl min-w-[140px] flex-1">
            <p className="text-slate-300 text-xs font-medium mb-1">Rendez-vous</p>
            <h3 className="text-white text-3xl font-bold mb-1">{filteredData.rdvs.toLocaleString()}</h3>
            <p className="text-emerald-400 text-[10px] font-bold flex items-center">
              <i className="fas fa-arrow-up mr-1"></i> {((filteredData.rdvs / 100) * 2.1).toFixed(1)}%
            </p>
          </div>

          {/* Transition Taux Vente */}
          <div className="text-center px-2">
            <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Taux de vente</p>
            <h4 className="text-white text-xl font-bold">{filteredData.rateSale}%</h4>
            <p className="text-emerald-400 text-[10px] font-bold"><i className="fas fa-arrow-up mr-1"></i> 6,56%</p>
          </div>

          {/* Bloc Ventes */}
          <div className="bg-[#2a5991] p-4 rounded-xl min-w-[140px] flex-1">
            <p className="text-slate-300 text-xs font-medium mb-1">Ventes</p>
            <h3 className="text-white text-3xl font-bold mb-1">{filteredData.sales.toLocaleString()}</h3>
            <p className="text-emerald-400 text-[10px] font-bold flex items-center">
              <i className="fas fa-arrow-up mr-1"></i> {((filteredData.sales / 100) * 3.4).toFixed(1)}%
            </p>
          </div>

          {/* Bloc Dépenses */}
          <div className="bg-[#2f6cb0] p-4 rounded-xl min-w-[280px] flex-[1.5]">
            <p className="text-slate-300 text-xs font-medium mb-1">Dépenses totales</p>
            <h3 className="text-white text-4xl font-black mb-1">{filteredData.spend.toLocaleString('fr-FR')} €</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 italic opacity-50">Données Meta Ads</p>
          </div>
        </div>

        {/* Ligne 2 : Coûts unitaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#2a5991] p-6 rounded-xl border-b-4 border-blue-400/30">
            <p className="text-slate-300 text-xs font-bold uppercase mb-1 tracking-wider">CPL (Coût Lead)</p>
            <h3 className="text-white text-4xl font-bold mb-1">{filteredData.cpl} €</h3>
            <p className="text-slate-300/50 text-xs text-right mt-2 font-medium">Donnée synchronisée</p>
          </div>

          <div className="bg-[#2a5991] p-6 rounded-xl border-b-4 border-blue-400/30">
            <p className="text-slate-300 text-xs font-bold uppercase mb-1 tracking-wider">CP RDV (Coût RDV)</p>
            <h3 className="text-white text-4xl font-bold mb-1">{filteredData.cpr} €</h3>
            <p className="text-slate-300/50 text-xs text-right mt-2 font-medium">Donnée synchronisée</p>
          </div>

          <div className="bg-[#2a5991] p-6 rounded-xl border-b-4 border-blue-400/30">
            <p className="text-slate-300 text-xs font-bold uppercase mb-1 tracking-wider">CP Vente (Coût Vente)</p>
            <h3 className="text-white text-4xl font-bold mb-1">{filteredData.cpv} €</h3>
            <p className="text-slate-300/50 text-xs text-right mt-2 font-medium">Donnée synchronisée</p>
          </div>
        </div>
      </div>

      {/* Graphique de tendance */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-8">Analyse des flux sur la période</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <Tooltip 
                contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
              />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle"/>
              <Line type="monotone" dataKey="prospects" stroke="#3b82f6" strokeWidth={4} dot={false} activeDot={{r: 6}} name="Prospects" />
              <Line type="monotone" dataKey="rdvs" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{r: 6}} name="RDVs" />
              <Line type="monotone" dataKey="ventes" stroke="#f59e0b" strokeWidth={4} dot={false} activeDot={{r: 6}} name="Ventes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
