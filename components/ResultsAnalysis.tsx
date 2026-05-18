import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Lead, CompanyExpense, EditorialEvent } from '../types';
import { fetchFacebookAdsPerformance, FacebookAdsData, fetchSocialFeed, SocialPost } from '../services/facebookAdsService';
import { fetchGoogleAdsPerformance, GoogleAdsData } from '../services/googleAdsService';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzrJZso0q9OdL2XTeCT3pLtDh7JqF349JJIAmRcrrLvl1z2XWHIi-78ygIX76SwhIiixw/exec';

interface ResultsAnalysisProps {
  leads: Lead[];
  startDate: string;
  endDate: string;
  fbData: FacebookAdsData | null;
  gData: GoogleAdsData | null;
  companyExpenses?: CompanyExpense[];
  category: 'all' | 'commerce' | 'technique';
  editorialEvents?: EditorialEvent[];
}

const ResultsAnalysis: React.FC<ResultsAnalysisProps> = ({ leads, startDate, endDate, fbData, gData, companyExpenses = [], category, editorialEvents = [] }) => {
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({
    prospects: false,
    rdvs: false,
    ventes: false,
    tendance: false
  });

  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    fetchSocialFeed()
      .then(setSocialPosts)
      .catch(e => console.error('Erreur fetch social posts pour events:', e));
  }, []);
  
  const [prevAdsData, setPrevAdsData] = useState<{ fb: FacebookAdsData | null; g: GoogleAdsData | null }>({ fb: null, g: null });
  const [isLoadingPrev, setIsLoadingPrev] = useState(false);

  // Fermeture du dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Liste des sources uniques (hors "Inconnue")
  const availableSources = useMemo(() => {
    // FIX: ensured 's' is treated as string for toLowerCase by adding a type guard
    return Array.from(new Set(leads.map(l => l.source)))
      .filter((s): s is string => typeof s === 'string' && s.toLowerCase() !== 'inconnue')
      .sort();
  }, [leads]);

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source) 
        : [...prev, source]
    );
  };

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
      // Filtrage par multi-sources
      const filteredBySource = lList.filter(l => 
        selectedSources.length === 0 || selectedSources.includes(l.source)
      );
      
      const categoryFilteredLeads = filteredBySource.filter(l => {
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
      
      // Calcul des dépenses publicitaires : toujours toutes sources (indépendant du filtre graphique)
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
  }, [leads, startDate, endDate, fbData, gData, companyExpenses, prevAdsData, prevPeriod, category, selectedSources]);

  const shouldHideCommercialMetrics = category === 'technique' || selectedSources.some(s => ['mylight150', 'enphase'].includes(s.toLowerCase()));

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
      const dateKey = curr.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const dayNameRaw = curr.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayName = dayNameRaw.replace('.', '').charAt(0).toUpperCase() + dayNameRaw.replace('.', '').slice(1);
      dailyMap[dateKey] = { name: `${dayName} ${dateKey}`, prospects: 0, rdvs: 0, ventes: 0, events: [] };
      curr.setDate(curr.getDate() + 1);
    }
    const qualifStatuses = ['Parrainage', 'Opportunité Commerce', 'Opportunité Service Technique', 'Opportunité Tertiaire', 'RDV Fixé'];
    stats.current.filteredLeads.forEach(lead => {
      const n = dateToNum(lead.dateEntry);
      if (n) {
        const d = new Date(Math.floor(n/10000), Math.floor((n%10000)/100)-1, n%100);
        const dateKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].prospects++;
          if (qualifStatuses.includes(lead.status)) dailyMap[dateKey].rdvs++;
          if (lead.salesStatus === 'Vendu' || lead.salesStatus === 'Installé') dailyMap[dateKey].ventes++;
        }
      }
    });

    // ─── Événements : posts sociaux ───────────────────────────────────────────
    socialPosts.forEach(post => {
      if (!post.created_time) return;
      const d = new Date(post.created_time);
      const dateKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].events.push({
          type: 'post' as const,
          label: (post.message || '').slice(0, 120) || 'Post sans texte',
          platform: post.platform,
        });
      }
    });

    // ─── Événements : dépenses hors SEA ──────────────────────────────────────
    companyExpenses.forEach(exp => {
      const n = dateToNum(exp.date);
      if (!n) return;
      const d = new Date(Math.floor(n/10000), Math.floor((n%10000)/100)-1, n%100);
      const dateKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].events.push({
          type: 'expense' as const,
          label: exp.name || 'Dépense sans titre',
          platform: undefined,
        });
      }
    });

    // ─── Événements : Planning édito ────────────────────────────────────────
    const frMonths: Record<string, number> = {
      'janv': 0, 'févr': 1, 'mars': 2, 'avr': 3, 'mai': 4, 'juin': 5,
      'juil': 6, 'août': 7, 'sept': 8, 'oct': 9, 'nov': 10, 'déc': 11,
      'jan': 0, 'fev': 1, 'jul': 6, 'aou': 7, 'sep': 8,
    };

    const parseEditorialDate = (raw: string): Date | null => {
      const s = raw.trim();
      // Format DD/MM/YYYY
      const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmy) return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));
      // Format "11 avr. 2026" ou "07 oct. 2023"
      const parts = s.split(' ');
      if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const monthRaw = parts[1].replace('.', '').toLowerCase();
        const year = parseInt(parts[2], 10);
        const monthIdx = frMonths[monthRaw];
        if (!isNaN(day) && monthIdx !== undefined && !isNaN(year))
          return new Date(year, monthIdx, day);
      }
      return null;
    };

    editorialEvents.forEach(ev => {
      if (!ev.datePublication) return;
      const d = parseEditorialDate(ev.datePublication);
      if (!d) return;
      const dateKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].events.push({
          type: 'post' as const,
          label: `${ev.titre}${ev.reseaux ? ' · ' + ev.reseaux : ''}`,
          platform: ev.type === 'Mailing' ? 'email' : 'editorial',
        });
      }
    });

    const data = Object.values(dailyMap);

    // Moyenne mobile centrée sur 7 jours (variations hebdomadaires)
    const n = data.length;
    if (n > 1) {
      const half = 3;
      data.forEach((d: any, i) => {
        const from = Math.max(0, i - half);
        const to = Math.min(n - 1, i + half);
        const window = data.slice(from, to + 1);
        const avg = window.reduce((acc: number, w: any) => acc + w.prospects, 0) / window.length;
        d.tendance = Math.max(0, parseFloat(avg.toFixed(2)));
      });
    }

    // Marqueur d'événement sur l'axe Y (null si aucun événement ce jour)
    data.forEach((d: any) => {
      d.eventMark = d.events.length > 0 ? Math.max(d.prospects, 0.3) : null;
    });

    return data;
  }, [stats.current.filteredLeads, startDate, endDate, socialPosts, companyExpenses, editorialEvents]);

  // ─── Dot jaune pulsant pour les événements ─────────────────────────────────
  const EventDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload?.events?.length || cx == null || cy == null) return <></>;
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill="#fbbf24" className="event-pulse-ring" />
        <circle cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="white" strokeWidth={2.5} />
      </g>
    );
  };

  // ─── Tooltip personnalisé (données + événements) ────────────────────────────
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    const events: { type: 'post' | 'expense'; label: string; platform?: string }[] = data?.events || [];
    const series = payload.filter((p: any) => p.dataKey !== 'eventMark');
    return (
      <div style={{ background: 'white', borderRadius: '20px', padding: '18px 22px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontFamily: 'Outfit', minWidth: 200, maxWidth: 320 }}>
        <p style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{label}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: events.length ? 12 : 0 }}>
          {series.map((p: any) => (
            <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: p.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {p.dataKey === 'prospects' ? 'Prospects' : p.dataKey === 'rdvs' ? 'Qualifiés' : p.dataKey === 'ventes' ? 'Ventes' : 'Tendance'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{p.value}</span>
            </div>
          ))}
        </div>
        {events.length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <p style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 2 }}>
              Événements ce jour
            </p>
            {events.map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ flexShrink: 0, width: 20, height: 20, background: ev.type === 'post' ? '#1877F2' : '#f59e0b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fas ${ev.type === 'post' ? (ev.platform === 'instagram' ? 'fa-instagram' : 'fa-facebook-f') : 'fa-receipt'}`} style={{ color: 'white', fontSize: 9 }}></i>
                </span>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#334155', lineHeight: 1.4, margin: 0 }}>{ev.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
          {!shouldHideCommercialMetrics && (
            <>
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
            </>
          )}
        </div>

        {/* Colonne de Droite : BLOC RENTABILITÉ */}
        <div className="bg-slate-900 rounded-[40px] p-5 shadow-2xl border border-slate-800 flex flex-col justify-between">
          <div className="px-2 pt-2">
            <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase rounded shadow-lg tracking-widest">Rentabilité</span>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">Analyse de performance</p>
          </div>

          <div className="space-y-3 my-4">
            {/* Investissement avec Détail au Hover */}
            {!shouldHideCommercialMetrics && (
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-[24px] border border-white/5 group hover:bg-white/10 transition-all cursor-default">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Investissement Total</p>
                  <i className="fas fa-wallet text-[10px] text-slate-700"></i>
                </div>
                <h3 className="text-2xl font-black text-white tabular-nums tracking-tight">
                  {stats.current.spend.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} <span className="text-xs font-medium text-slate-500">€</span>
                </h3>

                <div className="group-hover:hidden block transition-all">
                  <TrendBadge value={stats.trends.spend} prevValue={stats.previous.spend} unit=" €" isInverted={true} />
                </div>

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
            )}

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

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 overflow-visible">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Analyse des flux</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Évolution temporelle des prospects et ventes</p>
          </div>
          
          {/* MULTI-SELECT DROPDOWN CUSTOM */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2 whitespace-nowrap">Sources :</span>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-amber-500 shadow-sm flex items-center space-x-2 min-w-[140px] justify-between"
              >
                <span>
                  {selectedSources.length === 0 
                    ? "Toutes" 
                    : `${selectedSources.length} sélectionnée${selectedSources.length > 1 ? 's' : ''}`}
                </span>
                <i className={`fas fa-chevron-down text-[8px] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[100] p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-50">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filtrer par canal</span>
                   <button 
                    onClick={() => setSelectedSources([])}
                    className="text-[8px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-600"
                   >
                     Tout voir
                   </button>
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                  {availableSources.map(source => (
                    <label key={source} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectedSources.includes(source)}
                          onChange={() => toggleSource(source)}
                          className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-amber-500 checked:border-amber-500 transition-all cursor-pointer"
                        />
                        <i className="fas fa-check absolute text-[8px] text-white left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></i>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${selectedSources.includes(source) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                        {source}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

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
              <Tooltip content={<CustomChartTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                align="center" 
                height={30}
                iconType="circle" 
                onClick={(o: any) => setHiddenSeries(p => ({...p, [o.dataKey]: !p[o.dataKey]}))} 
                formatter={(v, e: any) => (
                  <span className={`text-[9px] font-black uppercase tracking-widest ${hiddenSeries[e.dataKey] ? 'opacity-30' : 'opacity-100'}`}>
                    {v === 'prospects' ? 'Prospects' : v === 'rdvs' ? 'Qualifiés' : v === 'ventes' ? 'Ventes' : 'Tendance Prospects'}
                  </span>
                )}
              />
              <Area type="monotone" dataKey="prospects" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProspects)" hide={hiddenSeries.prospects} />
              <Area type="monotone" dataKey="rdvs" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRDVs)" hide={hiddenSeries.rdvs} />
              <Area type="monotone" dataKey="ventes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentes)" hide={hiddenSeries.ventes} />
              <Line
                type="linear"
                dataKey="tendance"
                stroke="#ef4444"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={false}
                activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                hide={hiddenSeries.tendance}
              />
              {/* ── Points d'événements (posts & dépenses) ── */}
              <Line
                type="monotone"
                dataKey="eventMark"
                stroke="transparent"
                strokeWidth={0}
                connectNulls={false}
                legendType="none"
                dot={(props: any) => <EventDot {...props} />}
                activeDot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload?.events?.length || cx == null || cy == null) return <></>;
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={12} fill="#fbbf24" opacity={0.4} />
                      <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="white" strokeWidth={2.5} />
                    </g>
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

        @keyframes event-pulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          70%  { transform: scale(2.4); opacity: 0.1; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .event-pulse-ring {
          transform-box: fill-box;
          transform-origin: center;
          animation: event-pulse 1.8s ease-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ResultsAnalysis;