
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
}) => {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [monthlyAdSpend, setMonthlyAdSpend] = useState<Record<string, MonthlyAdSpend>>({});

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const filterByCategory = (leadsToFilter: Lead[]): Lead[] =>
    leadsToFilter.filter(l => {
      const isTech = l.status === 'Opportunité Service Technique';
      if (category === 'commerce') return !isTech;
      if (category === 'technique') return isTech;
      return true;
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

  // ─── Données mensuelles issues des leads ─────────────────────────────────────

  const monthlyData = useMemo((): MonthData[] => {
    const sLimit = dateToNum(startDate);
    const eLimit = dateToNum(endDate);
    const monthMap: Record<string, MonthData> = {};

    filterByCategory(leads).forEach(lead => {
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
  }, [leads, startDate, endDate, category, expenses]);

  // ─── Fetch Ads par mois ──────────────────────────────────────────────────────

  useEffect(() => {
    if (monthlyData.length === 0) return;

    // Initialise loading pour chaque mois
    const initState: Record<string, MonthlyAdSpend> = {};
    monthlyData.forEach(m => { initState[m.monthYear] = { fbSpend: 0, googleSpend: 0, loading: true }; });
    setMonthlyAdSpend(initState);

    // Fetch en parallèle
    monthlyData.forEach(async (m) => {
      const [year, month] = m.monthYear.split('-');
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
        [m.monthYear]: { fbSpend, googleSpend, loading: false },
      }));
    });
  }, [monthlyData, scriptUrl]);

  // ─── Données sources par mois ────────────────────────────────────────────────

  const getSourceDataForMonth = (monthYear: string): SourceData[] => {
    const sLimit = dateToNum(startDate);
    const eLimit = dateToNum(endDate);
    const sourceMap: Record<string, SourceData> = {};

    filterByCategory(leads).forEach(lead => {
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

      {/* Lignes mensuelles */}
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
        <div className="bg-amber-50 p-5 rounded-[20px] border border-amber-100 shadow-sm">
          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">CA Total</p>
          <p className="text-3xl font-black text-amber-700 tabular-nums">{(totals.revenue / 1000).toFixed(0)}k€</p>
          <p className="text-[9px] text-amber-400 mt-1">
            {totals.salesCount > 0 ? fmt(totals.revenue / totals.salesCount) : '0'}€ / vente
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAnalysis;
