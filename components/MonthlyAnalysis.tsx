
import React, { useMemo, useState, useEffect } from 'react';
import { Lead, CompanyExpense } from '../types';
import { FacebookAdsData, fetchFacebookAdsPerformance } from '../services/facebookAdsService';
import { GoogleAdsData, fetchGoogleAdsPerformance } from '../services/googleAdsService';

interface MonthlyAnalysisProps {
  leads: Lead[];
  startDate: string;
  endDate: string;
  category?: 'all' | 'commerce' | 'technique';
  expenses?: CompanyExpense[];
  fbData?: FacebookAdsData | null;
  googleData?: GoogleAdsData | null;
  scriptUrl?: string;
  sourceFilters?: string[];
}

interface MonthData {
  monthYear: string;
  leadsCount: number;
  appointmentsCount: number;
  appointmentRate: number;
  salesCount: number;
  salesRate: number;
  revenue: number;
  expensesTotal: number;
}

interface MonthlyAdSpend {
  fbSpend: number;
  googleSpend: number;
  loading: boolean;
}

interface SourceData {
  source: string;
  leadsCount: number;
  appointmentsCount: number;
  appointmentRate: number;
  salesCount: number;
  salesRate: number;
  revenue: number;
}

const MonthlyAnalysis: React.FC<MonthlyAnalysisProps> = ({
  leads,
  startDate,
  endDate,
  category = 'all',
  expenses = [],
  fbData,
  googleData,
  scriptUrl = '',
  sourceFilters = [],
}) => {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [monthlyAdSpend, setMonthlyAdSpend] = useState<Record<string, MonthlyAdSpend>>({});
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');

  // ─── Helpers ────────────────────────────────────────────────────────────────

  // Filtre catégorie uniquement — utilisé pour le fetch des budgets ads (indépendant des sources)
  const filterByCategory = (leadsToFilter: Lead[]): Lead[] =>
    leadsToFilter.filter(l => {
      const isTech = l.status === 'Opportunité Service Technique';
      if (category === 'commerce' && isTech) return false;
      if (category === 'technique' && !isTech) return false;
      return true;
    });

  // Filtre catégorie + sources — utilisé pour l'affichage des métriques
  const filterByCategoryAndSource = (leadsToFilter: Lead[]): Lead[] =>
    filterByCategory(leadsToFilter).filter(l => {
      if (sourceFilters.length === 0) return true;
      return sourceFilters.includes(l.source || '');
    });

  const dateToNum = (dateVal: any): number => {
    if (!dateVal) return 0;
    let str = String(dateVal).trim();
    if (str.includes('T')) str = str.split('T')[0];
    const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (dmy) {
      let y = parseInt(dmy[3], 10);
      if (y < 100) y += 2000;
      return y * 10000 + parseInt(dmy[2], 10) * 100 + parseInt(dmy[1], 10);
    }
    const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return parseInt(iso[1]) * 10000 + parseInt(iso[2]) * 100 + parseInt(iso[3]);
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return 0;
  };

  const extractMonthYear = (dateVal: any): string => {
    if (!dateVal) return '';
    let str = String(dateVal).trim();
    if (str.includes('T')) str = str.split('T')[0];
    const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (dmy) {
      let y = parseInt(dmy[3], 10);
      if (y < 100) y += 2000;
      return `${y}-${String(parseInt(dmy[2], 10)).padStart(2, '0')}`;
    }
    const iso = str.match(/^(\d{4})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}`;
    const d = new Date(str);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return '';
  };

  const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const fmtCost = (spend: number, count: number): string => {
    if (count === 0 || spend === 0) return '—';
    return `${fmt(Math.round(spend / count))} €`;
  };

  const formatMonthLabel = (monthYear: string): string => {
    const [year, month] = monthYear.split('-');
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  // ─── Liste des mois présents (sans filtre source) — pour le fetch ads ────────

  const monthsForAdFetch = useMemo((): string[] => {
    const sLimit = dateToNum(startDate);
    const eLimit = dateToNum(endDate);
    const set = new Set<string>();
    filterByCategory(leads).forEach(lead => {
      const leadDate = dateToNum(lead.dateEntry);
      if (leadDate < sLimit || leadDate > eLimit) return;
      const my = extractMonthYear(lead.dateEntry);
      if (my) set.add(my);
    });
    return Array.from(set).sort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, startDate, endDate, category]); // PAS sourceFilters ici intentionnellement

  // ─── Données mensuelles issues des leads ─────────────────────────────────────

  const monthlyData = useMemo((): MonthData[] => {
    const sLimit = dateToNum(startDate);
    const eLimit = dateToNum(endDate);
    const monthMap: Record<string, MonthData> = {};

    filterByCategoryAndSource(leads).forEach(lead => {
      const leadDate = dateToNum(lead.dateEntry);
      if (leadDate < sLimit || leadDate > eLimit) return;
      const monthYear = extractMonthYear(lead.dateEntry);
      if (!monthYear) return;

      if (!monthMap[monthYear]) {
        monthMap[monthYear] = {
          monthYear,
          leadsCount: 0,
          appointmentsCount: 0,
          appointmentRate: 0,
          salesCount: 0,
          salesRate: 0,
          revenue: 0,
          expensesTotal: 0,
        };
      }
      const m = monthMap[monthYear];
      m.leadsCount += 1;
      if (['RDV Fixé', 'Opportunité Commerce', 'Parrainage'].includes(lead.status)) m.appointmentsCount += 1;
      if (['Vendu', 'Installé'].includes(lead.salesStatus || '')) {
        m.salesCount += 1;
        m.revenue += Number(lead.amount) || 0;
      }
    });

    // Dépenses CompanyExpense par mois
    expenses.forEach(e => {
      const my = extractMonthYear(e.date);
      if (monthMap[my]) monthMap[my].expensesTotal += Number(e.amount) || 0;
    });

    Object.values(monthMap).forEach(m => {
      m.appointmentRate = m.leadsCount > 0 ? (m.appointmentsCount / m.leadsCount) * 100 : 0;
      m.salesRate = m.appointmentsCount > 0 ? (m.salesCount / m.appointmentsCount) * 100 : 0;
    });

    return Object.values(monthMap).sort((a, b) => a.monthYear.localeCompare(b.monthYear));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, startDate, endDate, category, expenses, sourceFilters]);

  // ─── Fetch Ads par mois ──────────────────────────────────────────────────────

  // Fetch ads uniquement quand la liste des mois change (date/catégorie) — PAS sur sourceFilters
  useEffect(() => {
    if (monthsForAdFetch.length === 0) return;

    // Initialise loading uniquement pour les mois pas encore chargés
    setMonthlyAdSpend(prev => {
      const next = { ...prev };
      monthsForAdFetch.forEach(my => {
        if (!next[my]) next[my] = { fbSpend: 0, googleSpend: 0, loading: true };
      });
      return next;
    });

    // Fetch en parallèle uniquement les mois non encore chargés
    monthsForAdFetch.forEach(async (my) => {
      setMonthlyAdSpend(prev => {
        if (prev[my] && !prev[my].loading) return prev; // déjà chargé, rien à faire
        return prev;
      });

      const [year, month] = my.split('-');
      const since = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const until = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      const [fbRes, googleRes] = await Promise.allSettled([
        fetchFacebookAdsPerformance(since, until),
        scriptUrl ? fetchGoogleAdsPerformance(scriptUrl, since, until) : Promise.resolve({ spend: 0, impressions: 0, clicks: 0 }),
      ]);

      const fbSpend = fbRes.status === 'fulfilled' ? (fbRes.value?.spend || 0) : 0;
      const googleSpend = googleRes.status === 'fulfilled' ? (googleRes.value?.spend || 0) : 0;

      setMonthlyAdSpend(prev => ({
        ...prev,
        [my]: { fbSpend, googleSpend, loading: false },
      }));
    });
  }, [monthsForAdFetch, scriptUrl]);

  // ─── Données sources par mois ────────────────────────────────────────────────

  const getSourceDataForMonth = (monthYear: string): SourceData[] => {
    const sLimit = dateToNum(startDate);
    const eLimit = dateToNum(endDate);
    const sourceMap: Record<string, SourceData> = {};

    filterByCategoryAndSource(leads).forEach(lead => {
      const leadDate = dateToNum(lead.dateEntry);
      if (extractMonthYear(lead.dateEntry) !== monthYear || leadDate < sLimit || leadDate > eLimit) return;
      const source = lead.source || 'Non renseigné';
      if (!sourceMap[source]) {
        sourceMap[source] = { source, leadsCount: 0, appointmentsCount: 0, appointmentRate: 0, salesCount: 0, salesRate: 0, revenue: 0 };
      }
      const d = sourceMap[source];
      d.leadsCount += 1;
      if (['RDV Fixé', 'Opportunité Commerce', 'Parrainage'].includes(lead.status)) d.appointmentsCount += 1;
      if (['Vendu', 'Installé'].includes(lead.salesStatus || '')) {
        d.salesCount += 1;
        d.revenue += Number(lead.amount) || 0;
      }
    });

    Object.values(sourceMap).forEach(d => {
      d.appointmentRate = d.leadsCount > 0 ? (d.appointmentsCount / d.leadsCount) * 100 : 0;
      d.salesRate = d.appointmentsCount > 0 ? (d.salesCount / d.appointmentsCount) * 100 : 0;
    });

    return Object.values(sourceMap).sort((a, b) => b.leadsCount - a.leadsCount);
  };

  // ─── Données pour la vue détaillée ──────────────────────────────────────────

  const detailedData = useMemo(() => {
    const sLimit = dateToNum(startDate);
    const eLimit = dateToNum(endDate);
    const sourceSet = new Set<string>();
    const monthSourceMap: Record<string, Record<string, { leads: number; rdv: number; ventes: number }>> = {};

    filterByCategoryAndSource(leads).forEach(lead => {
      const leadDate = dateToNum(lead.dateEntry);
      if (leadDate < sLimit || leadDate > eLimit) return;
      const my = extractMonthYear(lead.dateEntry);
      if (!my) return;
      const src = lead.source || 'Autre';

      sourceSet.add(src);
      if (!monthSourceMap[my]) monthSourceMap[my] = {};
      if (!monthSourceMap[my][src]) monthSourceMap[my][src] = { leads: 0, rdv: 0, ventes: 0 };

      const d = monthSourceMap[my][src];
      d.leads += 1;
      if (['RDV Fixé', 'Opportunité Commerce', 'Parrainage'].includes(lead.status)) d.rdv += 1;
      if (['Vendu', 'Installé'].includes(lead.salesStatus || '')) d.ventes += 1;
    });

    // Sources triées : SEA en premier, puis alphabétique
    const sources = Array.from(sourceSet).sort((a, b) => {
      if (a === 'SEA') return -1;
      if (b === 'SEA') return 1;
      return a.localeCompare(b, 'fr');
    });

    return { sources, monthSourceMap };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, startDate, endDate, category, sourceFilters]);

  // ─── Totaux ──────────────────────────────────────────────────────────────────

  const totals = useMemo(() => ({
    leadsCount: monthlyData.reduce((s, m) => s + m.leadsCount, 0),
    appointmentsCount: monthlyData.reduce((s, m) => s + m.appointmentsCount, 0),
    salesCount: monthlyData.reduce((s, m) => s + m.salesCount, 0),
    revenue: monthlyData.reduce((s, m) => s + m.revenue, 0),
  }), [monthlyData]);

  const fbSpendTotal = fbData?.spend || 0;
  const googleSpendTotal = googleData?.spend || 0;
  const expensesTotal = monthlyData.reduce((s, m) => s + m.expensesTotal, 0);
  const totalSpend = fbSpendTotal + googleSpendTotal + expensesTotal;

  const { sources: detailedSources, monthSourceMap } = detailedData;

  // ─── Rendu ───────────────────────────────────────────────────────────────────

  if (monthlyData.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[48px] border border-slate-100 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Aucune donnée pour cette période</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Switch vue Simplifiée / Détaillée */}
      <div className="flex justify-end">
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('simple')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'simple'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className="fas fa-list text-[10px]"></i>
            Simplifiée
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'detailed'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className="fas fa-table text-[10px]"></i>
            Détaillée
          </button>
        </div>
      </div>

      {/* Bandeau dépenses globales période */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-4 bg-[#1877F2]/5 border border-[#1877F2]/10 rounded-2xl px-6 py-4">
          <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center flex-shrink-0">
            <i className="fab fa-facebook-f text-white text-sm"></i>
          </div>
          <div>
            <p className="text-[9px] font-black text-[#1877F2]/60 uppercase tracking-widest">Meta Ads — Période</p>
            <p className="text-2xl font-black text-[#1877F2] tabular-nums">{fmt(fbSpendTotal)} €</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-rose-50 border border-rose-100 rounded-2xl px-6 py-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center flex-shrink-0">
            <i className="fab fa-google text-white text-sm"></i>
          </div>
          <div>
            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Google Ads — Période</p>
            <p className="text-2xl font-black text-rose-600 tabular-nums">{fmt(googleSpendTotal)} €</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-wallet text-white text-sm"></i>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Dépenses — Période</p>
            <p className="text-2xl font-black text-white tabular-nums">{fmt(totalSpend)} €</p>
          </div>
        </div>
      </div>

      {/* Vue détaillée — tableau croisé mois × sources */}
      {viewMode === 'detailed' && (
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm w-full overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="text-xs border-collapse w-full min-w-max">
                <thead>
                  {/* Ligne 1 : groupes */}
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-10 min-w-[90px]" rowSpan={2}>
                      Mois
                    </th>
                    <th
                      colSpan={detailedSources.length}
                      className="px-4 py-2 text-center text-[9px] font-black text-slate-600 uppercase tracking-widest border-l border-slate-200 bg-slate-100"
                    >
                      <i className="fas fa-users mr-1 text-slate-400"></i>Leads
                    </th>
                    <th
                      colSpan={detailedSources.length}
                      className="px-4 py-2 text-center text-[9px] font-black text-blue-600 uppercase tracking-widest border-l border-blue-100 bg-blue-50"
                    >
                      <i className="fas fa-calendar-check mr-1 text-blue-400"></i>RDV
                    </th>
                    <th
                      colSpan={detailedSources.length}
                      className="px-4 py-2 text-center text-[9px] font-black text-emerald-600 uppercase tracking-widest border-l border-emerald-100 bg-emerald-50"
                    >
                      <i className="fas fa-check-circle mr-1 text-emerald-400"></i>Ventes
                    </th>
                    <th className="px-4 py-2 text-center text-[9px] font-black text-sky-600 uppercase tracking-widest border-l border-sky-100 bg-sky-50" rowSpan={2}>
                      Budget<br/>SEA
                    </th>
                  </tr>
                  {/* Ligne 2 : sous-colonnes sources */}
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {/* Leads sources */}
                    {detailedSources.map((src, i) => (
                      <th key={`l-${src}`} className={`px-3 py-2 text-center text-[8px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap ${i === 0 ? 'border-l border-slate-200' : ''}`}>
                        {src}
                      </th>
                    ))}
                    {/* RDV sources */}
                    {detailedSources.map((src, i) => (
                      <th key={`r-${src}`} className={`px-3 py-2 text-center text-[8px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap ${i === 0 ? 'border-l border-blue-100' : ''}`}>
                        {src}
                      </th>
                    ))}
                    {/* Ventes sources */}
                    {detailedSources.map((src, i) => (
                      <th key={`v-${src}`} className={`px-3 py-2 text-center text-[8px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap ${i === 0 ? 'border-l border-emerald-100' : ''}`}>
                        {src}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((month, rowIdx) => {
                    const ads = monthlyAdSpend[month.monthYear];
                    const isLoading = ads?.loading ?? true;
                    const seaSpend = (ads?.fbSpend || 0) + (ads?.googleSpend || 0);
                    const srcMap = monthSourceMap[month.monthYear] || {};
                    return (
                      <tr
                        key={month.monthYear}
                        className={`border-b border-slate-50 hover:bg-amber-50/30 transition-colors ${rowIdx % 2 !== 0 ? 'bg-slate-50/40' : 'bg-white'}`}
                      >
                        <td className="px-4 py-3 font-black text-slate-900 whitespace-nowrap sticky left-0 bg-inherit z-10">
                          {formatMonthLabel(month.monthYear)}
                        </td>
                        {/* Leads par source */}
                        {detailedSources.map((src, i) => (
                          <td key={`l-${src}`} className={`px-3 py-3 text-center tabular-nums font-bold text-slate-700 ${i === 0 ? 'border-l border-slate-100' : ''}`}>
                            {srcMap[src]?.leads ?? 0}
                          </td>
                        ))}
                        {/* RDV par source */}
                        {detailedSources.map((src, i) => (
                          <td key={`r-${src}`} className={`px-3 py-3 text-center tabular-nums font-bold text-blue-600 ${i === 0 ? 'border-l border-blue-50' : ''}`}>
                            {srcMap[src]?.rdv ?? 0}
                          </td>
                        ))}
                        {/* Ventes par source */}
                        {detailedSources.map((src, i) => (
                          <td key={`v-${src}`} className={`px-3 py-3 text-center tabular-nums font-bold text-emerald-600 ${i === 0 ? 'border-l border-emerald-50' : ''}`}>
                            {srcMap[src]?.ventes ?? 0}
                          </td>
                        ))}
                        {/* Budget SEA */}
                        <td className="px-4 py-3 text-center tabular-nums font-black text-sky-700 border-l border-sky-50 whitespace-nowrap">
                          {isLoading ? (
                            <span className="inline-block h-3 w-14 bg-sky-100 animate-pulse rounded"></span>
                          ) : (
                            `${fmt(seaSpend)} €`
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
      )}

      {/* Vue simplifiée — Lignes mensuelles */}
      {viewMode === 'simple' && (
      <div className="space-y-3">
        {monthlyData.map((month) => {
          const ads = monthlyAdSpend[month.monthYear];
          const monthSpend = (ads?.fbSpend || 0) + (ads?.googleSpend || 0) + month.expensesTotal;
          const isLoading = ads?.loading ?? true;
          const isExpanded = expandedMonth === month.monthYear;

          return (
            <React.Fragment key={month.monthYear}>
              <div
                onClick={() => setExpandedMonth(isExpanded ? null : month.monthYear)}
                className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center px-6 py-4 gap-3">

                  {/* Label mois */}
                  <div className="flex items-center space-x-3 w-36 flex-shrink-0">
                    <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} text-slate-300 group-hover:text-amber-500 transition-colors text-xs`}></i>
                    <span className="text-sm font-black text-slate-900">{formatMonthLabel(month.monthYear)}</span>
                  </div>

                  {/* Métriques leads */}
                  <div className="flex gap-2 flex-1">
                    <div className="bg-slate-50 rounded-xl px-3 py-2 text-center flex-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Leads</p>
                      <p className="text-base font-black text-slate-900 tabular-nums">{month.leadsCount}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl px-3 py-2 text-center flex-1">
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-0.5">RDV</p>
                      <p className="text-base font-black text-blue-700 tabular-nums">{month.appointmentsCount}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl px-3 py-2 text-center flex-1">
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Tx RDV</p>
                      <p className="text-base font-black text-blue-700 tabular-nums">{month.appointmentRate.toFixed(0)}%</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl px-3 py-2 text-center flex-1">
                      <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Ventes</p>
                      <p className="text-base font-black text-emerald-700 tabular-nums">{month.salesCount}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl px-3 py-2 text-center flex-1">
                      <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Closing</p>
                      <p className="text-base font-black text-emerald-700 tabular-nums">{month.salesRate.toFixed(0)}%</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl px-3 py-2 text-center flex-1">
                      <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-0.5">CA</p>
                      <p className="text-base font-black text-amber-700 tabular-nums">{(month.revenue / 1000).toFixed(0)}k€</p>
                    </div>
                  </div>

                  {/* Séparateur */}
                  <div className="w-px h-10 bg-slate-100 flex-shrink-0"></div>

                  {/* CPL / CPRDV / CPVente */}
                  <div className="flex gap-2 flex-shrink-0">
                    <div className="bg-violet-50 rounded-xl px-3 py-2 text-center w-24">
                      <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest mb-0.5">CPL</p>
                      {isLoading ? (
                        <div className="h-4 w-12 bg-violet-100 animate-pulse rounded mx-auto mt-1"></div>
                      ) : (
                        <p className="text-sm font-black text-violet-700 tabular-nums">{fmtCost(monthSpend, month.leadsCount)}</p>
                      )}
                    </div>
                    <div className="bg-violet-50 rounded-xl px-3 py-2 text-center w-24">
                      <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest mb-0.5">CPRDV</p>
                      {isLoading ? (
                        <div className="h-4 w-12 bg-violet-100 animate-pulse rounded mx-auto mt-1"></div>
                      ) : (
                        <p className="text-sm font-black text-violet-700 tabular-nums">{fmtCost(monthSpend, month.appointmentsCount)}</p>
                      )}
                    </div>
                    <div className="bg-violet-50 rounded-xl px-3 py-2 text-center w-24">
                      <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest mb-0.5">CPVente</p>
                      {isLoading ? (
                        <div className="h-4 w-12 bg-violet-100 animate-pulse rounded mx-auto mt-1"></div>
                      ) : (
                        <p className="text-sm font-black text-violet-700 tabular-nums">{fmtCost(monthSpend, month.salesCount)}</p>
                      )}
                    </div>
                  </div>

                  {/* Séparateur */}
                  <div className="w-px h-10 bg-slate-100 flex-shrink-0"></div>

                  {/* Budget SEA */}
                  <div className="bg-sky-50 rounded-xl px-3 py-2 text-center w-28 flex-shrink-0">
                    <p className="text-[8px] font-black text-sky-400 uppercase tracking-widest mb-0.5">Budget SEA</p>
                    {isLoading ? (
                      <div className="h-4 w-16 bg-sky-100 animate-pulse rounded mx-auto mt-1"></div>
                    ) : (
                      <p className="text-sm font-black text-sky-700 tabular-nums">
                        {fmt((ads?.fbSpend || 0) + (ads?.googleSpend || 0))} €
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Détail par origine — tableau */}
              {isExpanded && (
                <div className="bg-white border border-slate-100 rounded-[20px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 ml-4">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Détail par Origine — {formatMonthLabel(month.monthYear)}
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Origine</th>
                          <th className="text-center px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Leads</th>
                          <th className="text-center px-4 py-3 text-[9px] font-black text-blue-400 uppercase tracking-widest">RDV</th>
                          <th className="text-center px-4 py-3 text-[9px] font-black text-blue-400 uppercase tracking-widest">Taux RDV</th>
                          <th className="text-center px-4 py-3 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Ventes</th>
                          <th className="text-center px-4 py-3 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Closing</th>
                          <th className="text-center px-4 py-3 text-[9px] font-black text-amber-400 uppercase tracking-widest">CA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSourceDataForMonth(month.monthYear).map((source, idx) => (
                          <tr key={source.source} className={`border-t border-slate-50 ${idx % 2 !== 0 ? 'bg-slate-50/40' : ''} hover:bg-amber-50/30 transition-colors`}>
                            <td className="px-6 py-3">
                              <span className="text-sm font-bold text-slate-900">{source.source}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-black text-slate-700 tabular-nums">{source.leadsCount}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-black text-blue-600 tabular-nums">{source.appointmentsCount}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(100, source.appointmentRate)}%` }}></div>
                                </div>
                                <span className="text-sm font-black text-blue-600 tabular-nums w-8 text-right">{source.appointmentRate.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-black text-emerald-600 tabular-nums">{source.salesCount}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, source.salesRate)}%` }}></div>
                                </div>
                                <span className="text-sm font-black text-emerald-600 tabular-nums w-8 text-right">{source.salesRate.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-black text-slate-900 tabular-nums">{(source.revenue / 1000).toFixed(1)}k€</span>
                            </td>
                          </tr>
                        ))}
                        {getSourceDataForMonth(month.monthYear).length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-6 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                              Aucune donnée pour ce mois
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      )}

      {/* Totaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
        <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Leads</p>
          <p className="text-3xl font-black text-slate-900 tabular-nums">{totals.leadsCount}</p>
          <p className="text-[9px] text-slate-400 mt-1">Sur {monthlyData.length} mois</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-[20px] border border-blue-100 shadow-sm">
          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Total RDV</p>
          <p className="text-3xl font-black text-blue-700 tabular-nums">{totals.appointmentsCount}</p>
          <p className="text-[9px] text-blue-400 mt-1">
            {totals.leadsCount > 0 ? ((totals.appointmentsCount / totals.leadsCount) * 100).toFixed(1) : '0'}% taux
          </p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-[20px] border border-emerald-100 shadow-sm">
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Ventes</p>
          <p className="text-3xl font-black text-emerald-700 tabular-nums">{totals.salesCount}</p>
          <p className="text-[9px] text-emerald-400 mt-1">
            {totals.appointmentsCount > 0 ? ((totals.salesCount / totals.appointmentsCount) * 100).toFixed(1) : '0'}% closing
          </p>
        </div>
        <div className="bg-violet-50 p-5 rounded-[20px] border border-violet-100 shadow-sm">
          <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">CP Vente</p>
          <p className="text-3xl font-black text-violet-700 tabular-nums">{fmtCost(totalSpend, totals.salesCount)}</p>
          <p className="text-[9px] text-violet-400 mt-1">
            Budget total : {fmt(totalSpend)} €
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAnalysis;
