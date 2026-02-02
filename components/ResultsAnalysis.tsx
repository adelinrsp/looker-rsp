
import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Lead, CompanyExpense } from '../types';
import { fetchFacebookAdsPerformance, FacebookAdsData } from '../services/facebookAdsService';
import { fetchGoogleAdsPerformance, GoogleAdsData } from '../services/googleAdsService';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

interface ResultsAnalysisProps {
  leads: Lead[];
  startDate: string;
  endDate: string;
  fbData: FacebookAdsData | null;
  gData: GoogleAdsData | null;
  companyExpenses?: CompanyExpense[];
  category: 'all' | 'commerce' | 'technique';
}

const ResultsAnalysis: React.FC<ResultsAnalysisProps> = ({ leads, startDate, endDate, fbData, gData, companyExpenses = [], category }) => {
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({
    prospects: false,
    rdvs: false,
    ventes: false
  });

  const [prevAdsData, setPrevAdsData] = useState<{ fb: FacebookAdsData | null; g: GoogleAdsData | null }>({ fb: null, g: null });
  const [isLoadingPrev, setIsLoadingPrev] = useState(false);

  const dateToNum = (dateVal: any): number => {
    if (!dateVal) return 0;
    let str = String(dateVal).trim();
    if (!str) return 0;
    if (str.includes('T')) str = str.split('T')[0];
    const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10);
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
      return year * 10000 + month * 100 + day;
    }
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return parseInt(isoMatch[1]) * 10000 + parseInt(isoMatch[2]) * 100 + parseInt(isoMatch[3]);
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return 0;
  };

  const cleanAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).replace(/[\s\u00A0\u202F\u0020]/g, '').replace(/[^\d.,-]/g, '').replace(',', '.');
    return parseFloat(str) || 0;
  };

  const prevPeriod = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = e.getTime() - s.getTime();
    const prevEnd = new Date(s.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - diff);
    return { start: prevStart.toISOString().split('T')[0], end: prevEnd.toISOString().split('T')[0] };
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchPrev = async () => {
      setIsLoadingPrev(true);
      try {
        const [fb, g] = await Promise.all([
          fetchFacebookAdsPerformance(prevPeriod.start, prevPeriod.end),
          fetchGoogleAdsPerformance(SCRIPT_URL, prevPeriod.start, prevPeriod.end)
        ]);
        setPrevAdsData({ fb, g });
      } catch (e) { console.error("Erreur fetch prev ads:", e); }
      finally { setIsLoadingPrev(false); }
    };
    fetchPrev();
  }, [prevPeriod]);

  const stats = useMemo(() => {
    const sLimit = dateToNum(startDate);
    const eLimit = dateToNum(endDate);
    const psLimit = dateToNum(prevPeriod.start);
    const peLimit = dateToNum(prevPeriod.end);

    const processStats = (lList: Lead[], eList: CompanyExpense[], fb: FacebookAdsData | null, g: GoogleAdsData | null, start: number, end: number) => {
      const categoryFilteredLeads = lList.filter(l => {
        const isTech = l.status === 'Opportunité Service Technique';
        if (category === 'commerce') return !isTech;
        if (category === 'technique') return isTech;
        return true;
      });
      const filteredLeads = categoryFilteredLeads.filter(l => {
        const n = dateToNum(l.dateEntry);
        return n >= start && n <= end;
      });
      const filteredExpenses = eList.filter(e => {
        const n = dateToNum(e.date);
        return n >= start && n <= end;
      });
      const prospects = filteredLeads.length;
      const qualifStatuses = ['Parrainage', 'Opportunité Commerce', 'Opportunité Service Technique', 'Opportunité Tertiaire', 'RDV Fixé'];
      const rdvs = filteredLeads.filter(l => qualifStatuses.includes(l.status)).length;
      const soldLeads = filteredLeads.filter(l => l.salesStatus === 'Vendu' || l.salesStatus === 'Installé');
      const sales = soldLeads.length;
      const revenue = soldLeads.reduce((acc, curr) => acc + cleanAmount(curr.amount), 0);
      
      const currentFbSpend = fb?.spend || 0;
      const currentGSpend = g?.spend || 0;
      const currentCompanySpend = filteredExpenses.reduce((acc, curr) => acc + cleanAmount(curr.amount), 0);
      const totalSpend = currentFbSpend + currentGSpend + currentCompanySpend;
      
      return { prospects, rdvs, sales, revenue, spend: totalSpend, fbSpend: currentFbSpend, gSpend: currentGSpend, companySpend: currentCompanySpend, filteredLeads };
    };

    const current = processStats(leads, companyExpenses, fbData, gData, sLimit, eLimit);
    const previous = processStats(leads, companyExpenses, prevAdsData.fb, prevAdsData.g, psLimit, peLimit);
    const calcTrend = (curr: number, prev: number) => prev === 0 ? 0 : ((curr - prev) / prev) * 100;

    return {
      current,
      previous,
      trends: {
        prospects: calcTrend(current.prospects, previous.prospects),
        rdvs: calcTrend(current.rdvs, previous.rdvs),
        sales: calcTrend(current.sales, previous.sales),
        revenue: calcTrend(current.revenue, previous.revenue),
        spend: calcTrend(current.spend, previous.spend),
        cpl: calcTrend(current.prospects > 0 ? current.spend / current.prospects : 0, previous.prospects > 0 ? previous.spend / previous.prospects : 0),
        cpr: calcTrend(current.rdvs > 0 ? current.spend / current.rdvs : 0, previous.rdvs > 0 ? previous.spend / previous.rdvs : 0),
        cpv: calcTrend(current.sales > 0 ? current.spend / current.sales : 0, previous.sales > 0 ? previous.spend / previous.sales : 0)
      }
    };
  }, [leads, startDate, endDate, fbData, gData, companyExpenses, prevAdsData, prevPeriod, category]);

  const TrendBadge = ({ value, prevValue, isInverted = false, unit = '' }: { value: number, prevValue: number, isInverted?: boolean, unit?: string }) => {
    if (isNaN(value)) return null;
    const isGood = isInverted ? value < 0 : value > 0;
    const colorClass = isGood ? 'text-emerald-500' : (value === 0 ? 'text-slate-400' : 'text-rose-500');
    const icon = value > 0 ? 'fa-arrow-trend-up' : (value < 0 ? 'fa-arrow-trend-down' : 'fa-minus');

    return (
      <div className={`flex items-center space-x-1.5 mt-1.5 ${colorClass}`}>
        <i className={`fas ${icon} text-[10px]`}></i>
        <span className="text-[10px] font-black uppercase tracking-widest">{value > 0 ? '+' : ''}{value.toFixed(1)}%</span>
        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">vs {prevValue.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}{unit}</span>
      </div>
    );
  };

  const chartData = useMemo(() => {
    const dailyMap: { [key: string]: any } = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    const curr = new Date(start);
    while (curr <= end) {
      const dateKey = curr.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      const dayNameRaw = curr.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayName = dayNameRaw.replace('.', '').charAt(0).toUpperCase() + dayNameRaw.replace('.', '').slice(1);
      dailyMap[dateKey] = { name: `${dayName} ${dateKey}`, prospects: 0, rdvs: 0, ventes: 0 };
      curr.setDate(curr.getDate() + 1);
    }
    const qualifStatuses = ['Parrainage', 'Opportunité Commerce', 'Opportunité Service Technique', 'Opportunité Tertiaire', 'RDV Fixé'];
    stats.current.filteredLeads.forEach(lead => {
      const n = dateToNum(lead.dateEntry);
      if (n) {
        const d = new Date(Math.floor(n/10000), Math.floor((n%10000)/100)-1, n%100);
        const dateKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].prospects++;
          if (qualifStatuses.includes(lead.status)) dailyMap[dateKey].rdvs++;
          if (lead.salesStatus === 'Vendu' || lead.salesStatus === 'Installé') dailyMap[dateKey].ventes++;
        }
      }
    });
    return Object.values(dailyMap);
  }, [stats.current.filteredLeads, startDate, endDate]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Colonne de Gauche : KPIs Standard */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Ligne 1 */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-premium mb-1.5">Acquisition</p>
              <h3 className="text-4xl font-bold text-slate-900 tabular-nums tracking-tighter">{stats.current.prospects.toLocaleString()}</h3>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Prospects générés</p>
            </div>
            <TrendBadge value={stats.trends.prospects} prevValue={stats.previous.prospects} />
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-premium mb-1.5">Qualification</p>
              <h3 className="text-4xl font-bold text-slate-900 tabular-nums tracking-tighter">{stats.current.rdvs.toLocaleString()}</h3>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Qualifiés • <span className="text-amber-600">{(stats.current.prospects > 0 ? (stats.current.rdvs / stats.current.prospects * 100) : 0).toFixed(1)}%</span></p>
            </div>
            <TrendBadge value={stats.trends.rdvs} prevValue={stats.previous.rdvs} />
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-premium mb-1.5">Transformation</p>
              <h3 className="text-4xl font-bold text-slate-900 tabular-nums tracking-tighter">{stats.current.sales.toLocaleString()}</h3>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Ventes • <span className="text-emerald-600">{(stats.current.rdvs > 0 ? (stats.current.sales / stats.current.rdvs * 100) : 0).toFixed(1)}%</span></p>
            </div>
            <TrendBadge value={stats.trends.sales} prevValue={stats.previous.sales} />
          </div>

          {/* Ligne 2 */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-premium mb-1.5">CPL Réel</p>
              <h3 className="text-4xl font-bold text-slate-900 tracking-tighter">{(stats.current.prospects > 0 ? stats.current.spend / stats.current.prospects : 0).toFixed(1)}<span className="text-lg text-slate-300">€</span></h3>
            </div>
            <TrendBadge value={stats.trends.cpl} prevValue={stats.previous.prospects > 0 ? stats.previous.spend / stats.previous.prospects : 0} unit=" €" isInverted={true} />
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-premium mb-1.5">CP Qualifié</p>
              <h3 className="text-4xl font-bold text-slate-900 tracking-tighter">{(stats.current.rdvs > 0 ? stats.current.spend / stats.current.rdvs : 0).toFixed(1)}<span className="text-lg text-slate-300">€</span></h3>
            </div>
            <TrendBadge value={stats.trends.cpr} prevValue={stats.previous.rdvs > 0 ? stats.previous.spend / stats.previous.rdvs : 0} unit=" €" isInverted={true} />
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-premium mb-1.5">CP Vente</p>
              <h3 className="text-4xl font-bold text-slate-900 tracking-tighter">{(stats.current.sales > 0 ? stats.current.spend / stats.current.sales : 0).toFixed(1)}<span className="text-lg text-slate-300">€</span></h3>
            </div>
            <TrendBadge value={stats.trends.cpv} prevValue={stats.previous.sales > 0 ? stats.previous.spend / stats.previous.sales : 0} unit=" €" isInverted={true} />
          </div>
        </div>

        {/* Colonne de Droite : BLOC RENTABILITÉ */}
        <div className="bg-slate-900 rounded-[40px] p-5 shadow-2xl border border-slate-800 flex flex-col justify-between min-h-[380px]">
          <div className="px-2 pt-2">
            <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase rounded shadow-lg tracking-widest">Rentabilité</span>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">Analyse de performance</p>
          </div>

          <div className="space-y-3 my-4">
            {/* Investissement avec Détail au Hover */}
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-[24px] border border-white/5 group hover:bg-white/10 transition-all cursor-default">
              <div className="flex justify-between items-start mb-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Investissement Total</p>
                <i className="fas fa-wallet text-[10px] text-slate-700"></i>
              </div>
              <h3 className="text-2xl font-black text-white tabular-nums tracking-tight">
                {stats.current.spend.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} <span className="text-xs font-medium text-slate-500">€</span>
              </h3>
              
              {/* Le Badge de tendance est masqué au profit du détail au hover pour gagner de la place */}
              <div className="group-hover:hidden block transition-all">
                <TrendBadge value={stats.trends.spend} prevValue={stats.previous.spend} unit=" €" isInverted={true} />
              </div>

              {/* SECTION DÉTAIL DYNAMIQUE (Uniquement au Hover) */}
              <div className="max-h-0 overflow-hidden group-hover:max-h-24 group-hover:mt-3 transition-all duration-300 border-t border-white/5 pt-0 group-hover:pt-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                    <span className="flex items-center text-slate-500"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>Meta Ads</span>
                    <span className="text-slate-300">{stats.current.fbSpend.toLocaleString('fr-FR')}€</span>
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                    <span className="flex items-center text-slate-500"><span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-1.5"></span>Google Ads</span>
                    <span className="text-slate-300">{stats.current.gSpend.toLocaleString('fr-FR')}€</span>
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                    <span className="flex items-center text-slate-500"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>Structure</span>
                    <span className="text-slate-300">{stats.current.companySpend.toLocaleString('fr-FR')}€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CA Généré */}
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-[24px] border border-white/5 group hover:bg-white/10 transition-all cursor-default">
              <div className="flex justify-between items-start mb-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CA Généré (Est.)</p>
                <i className="fas fa-hand-holding-dollar text-[10px] text-amber-500"></i>
              </div>
              <h3 className="text-2xl font-black text-amber-500 tabular-nums tracking-tight">
                {stats.current.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} <span className="text-xs font-medium text-amber-700">€</span>
              </h3>
              <TrendBadge value={stats.trends.revenue} prevValue={stats.previous.revenue} unit=" €" />
            </div>
          </div>

          <div className="px-2 pb-2">
            <div className="flex justify-between items-center border-t border-white/5 pt-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ROAS Global</span>
              <span className="text-base font-black text-emerald-400">
                {(stats.current.spend > 0 ? (stats.current.revenue / stats.current.spend).toFixed(2) : '0.00')}x
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
              <defs>
                <linearGradient id="colorProspects" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorRDVs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.05}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.05}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '600'}} />
              <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '20px', fontFamily: 'Outfit'}} />
              <Legend 
                verticalAlign="bottom" 
                align="center" 
                height={30}
                iconType="circle" 
                onClick={(o: any) => setHiddenSeries(p => ({...p, [o.dataKey]: !p[o.dataKey]}))} 
                formatter={(v, e: any) => (
                  <span className={`text-[9px] font-black uppercase tracking-widest ${hiddenSeries[e.dataKey] ? 'opacity-30' : 'opacity-100'}`}>
                    {v === 'prospects' ? 'Prospects' : v === 'rdvs' ? 'Qualifiés' : 'Ventes'}
                  </span>
                )} 
              />
              <Area type="monotone" dataKey="prospects" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProspects)" hide={hiddenSeries.prospects} />
              <Area type="monotone" dataKey="rdvs" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRDVs)" hide={hiddenSeries.rdvs} />
              <Area type="monotone" dataKey="ventes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentes)" hide={hiddenSeries.ventes} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ResultsAnalysis;
