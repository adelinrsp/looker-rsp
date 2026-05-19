
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { ClientDiscovery, SocialQuestionnaire } from '../types';

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const PALETTE = [
  '#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6',
  '#f97316', '#06b6d4', '#ec4899', '#6366f1', '#eab308',
];

// ─── LABEL MAP ───────────────────────────────────────────────────────────────
const LABEL_MAP: Record<string, string> = {
  decouverte: 'Découverte', prospect_reflexion: 'Réflexion', compare: 'Compare', projet_imminent: 'Imminent',
  facture: 'Facture', independance: 'Indépendance', valorisation: 'Valorisation', ecologie: 'Écologie',
  etancheite: 'Étanchéité', esthetique: 'Esthétique', sous_traitance: 'Sous-traitance', incendie: 'Incendie',
  experience: 'Expérience', aucun: 'Aucun', prix: 'Prix', recyclage: 'Recyclage',
  qualite: 'Qualité', confiance: 'Confiance', reactivite: 'Réactivité', transparence: 'Transparence',
  securite: 'Sécurité', expertise: 'Expertise', local: 'Local', service: 'Service',
  devis: 'Devis', rentabilite: 'Rentabilité', bon_partenaire: 'Bon partenaire',
  etude_energetique: 'Étude énergétique', etude_financiere: 'Étude financière',
  comptant: 'Comptant', financement: 'Financement', mix: 'Mix', indiscret: 'Indiscret',
  immediat: 'Immédiat', '1_mois': '1 mois', '3_mois': '3 mois', '6_mois': '6 mois',
  in_year: "Dans l'année", reseaux: 'Réseaux sociaux', google: 'Google',
  parrainage: 'Parrainage', autre: 'Autre',
  moins_10k: '<10k€', moins_15k: '<15k€', moins_20k: '<20k€', plus_20k: '>20k€',
  voiture_elec: 'Voiture élec.', piscine: 'Piscine', chauffage: 'Chauffage', clim: 'Clim', rien: 'Aucun',
  pense: 'Besoin d\'y penser', budget: 'Contrainte budget', prestataire: 'Choix prestataire', reputation: 'Réputation',
};
const L = (v: string): string => LABEL_MAP[v] || v;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function countField(data: ClientDiscovery[], field: string): [string, number][] {
  const counts: Record<string, number> = {};
  data.forEach((r: any) => {
    const v = r[field];
    if (!v) return;
    String(v).split(',').map((s: string) => s.trim()).filter(Boolean).forEach((p: string) => {
      counts[p] = (counts[p] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function countSingle(data: ClientDiscovery[], field: string): [string, number][] {
  const counts: Record<string, number> = {};
  data.forEach((r: any) => {
    const v = r[field];
    if (!v) return;
    const k = String(v).trim();
    counts[k] = (counts[k] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function extractKwh(str: string | undefined | null): number | null {
  if (!str) return null;
  const m = String(str).match(/^(\d+)/);
  return m ? parseInt(m[1]) : null;
}

const PAGE_SIZE = 10;

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
const BarItems: React.FC<{ entries: [string, number][]; max: number }> = ({ entries, max }) => (
  <div className="space-y-2.5">
    {entries.slice(0, 10).map(([label, count]) => (
      <div key={label} className="flex items-center gap-3">
        <span className="text-xs text-slate-600 w-36 shrink-0 font-medium truncate" title={label}>{label}</span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.round((count / Math.max(max, 1)) * 100)}%` }}
          />
        </div>
        <span className="text-xs font-bold text-slate-500 w-5 text-right shrink-0">{count}</span>
      </div>
    ))}
  </div>
);

const PILL_AVANCEMENT: Record<string, string> = {
  decouverte: 'bg-blue-100 text-blue-700',
  prospect_reflexion: 'bg-slate-100 text-slate-600',
  compare: 'bg-amber-100 text-amber-700',
  projet_imminent: 'bg-green-100 text-green-700',
};
const PILL_FINANCEMENT: Record<string, string> = {
  comptant: 'bg-green-100 text-green-700',
  financement: 'bg-blue-100 text-blue-700',
  mix: 'bg-amber-100 text-amber-700',
  indiscret: 'bg-slate-100 text-slate-500',
};

const Pill: React.FC<{ text: string; color?: string }> = ({ text, color = 'bg-slate-100 text-slate-500' }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border border-transparent ${color}`}>{text}</span>
);

const EmptyState = () => (
  <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-24 text-center">
    <i className="fas fa-chart-pie text-slate-200 text-4xl mb-4"></i>
    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aucune donnée exploitable trouvée</p>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 pb-3 border-b border-amber-200 flex items-center gap-2">
    {children}
  </h2>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
    <span className="w-1 h-4 bg-amber-400 rounded-full inline-block shrink-0" />
    {children}
  </h3>
);

// ─── MINI DOUGHNUT CARD ───────────────────────────────────────────────────────
const DoughnutCard: React.FC<{ title: string; data: { name: string; value: number }[] }> = ({ title, data }) => (
  <Card>
    <CardTitle>{title}</CardTitle>
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={55} paddingAngle={4} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="flex flex-wrap gap-1.5 mt-1">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
          <span className="text-[9px] text-slate-500">{d.name} ({d.value})</span>
        </div>
      ))}
    </div>
  </Card>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface QuestionnaireViewProps {
  discovery: ClientDiscovery[];
  social: SocialQuestionnaire[];
}

const QuestionnaireView: React.FC<QuestionnaireViewProps> = ({ discovery, social }) => {
  const [subTab, setSubTab] = useState<'discovery' | 'social'>('discovery');
  const [filterCommercial, setFilterCommercial] = useState('all');
  const [filterAvancement, setFilterAvancement] = useState('all');
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [sortCol, setSortCol] = useState('Date');
  const [sortAsc, setSortAsc] = useState(false);

  // Safe data
  const safeDiscovery = useMemo(() =>
    Array.isArray(discovery) ? discovery.filter(d => d && Object.keys(d).length > 2) : [],
    [discovery]
  );
  const safeSocial = useMemo(() =>
    Array.isArray(social) ? social.filter(s => s && Object.keys(s).length > 2) : [],
    [social]
  );

  // Unique filter values
  const commercials = useMemo(() => {
    const set = new Set(safeDiscovery.map(r => r.Commercial).filter(Boolean));
    return Array.from(set).sort();
  }, [safeDiscovery]);

  const avancements = useMemo(() => {
    const set = new Set(safeDiscovery.map(r => r.avancement_projet).filter(Boolean));
    return Array.from(set).sort();
  }, [safeDiscovery]);

  // Filtered dataset
  const filtered = useMemo(() =>
    safeDiscovery.filter(r => {
      if (filterCommercial !== 'all' && r.Commercial !== filterCommercial) return false;
      if (filterAvancement !== 'all' && r.avancement_projet !== filterAvancement) return false;
      return true;
    }),
    [safeDiscovery, filterCommercial, filterAvancement]
  );

  // KPIs
  const kpis = useMemo(() => {
    const consos = filtered.map(r => extractKwh(r.consommation_actuelle)).filter((v): v is number => v !== null && v < 50000);
    return {
      total: filtered.length,
      pvCount: filtered.filter(r => r.deja_etudes_pv === 'oui').length,
      avgConso: consos.length ? Math.round(consos.reduce((a, b) => a + b, 0) / consos.length) : 0,
      imminent: filtered.filter(r => r.avancement_projet === 'projet_imminent').length,
      reseaux: filtered.filter(r => r.comment_connu === 'reseaux').length,
    };
  }, [filtered]);

  // ── Chart data ──
  const avancData = useMemo(() =>
    countSingle(filtered, 'avancement_projet').map(([k, v]) => ({ name: L(k), value: v })),
    [filtered]
  );
  const ageData = useMemo(() =>
    countSingle(filtered, 'tranche_age').map(([k, v]) => ({ name: k, value: v })),
    [filtered]
  );
  const commercialData = useMemo(() =>
    countSingle(filtered, 'Commercial').map(([k, v]) => ({
      name: k.replace(/_/g, ' ').replace(/\b\w/g, (x: string) => x.toUpperCase()),
      value: v,
    })),
    [filtered]
  );
  const motivationsData = useMemo(() =>
    countField(filtered, 'motivations_priorite').map(([k, v]) => [L(k), v] as [string, number]),
    [filtered]
  );
  const freinsData = useMemo(() =>
    countField(filtered, 'freins_specifiques').map(([k, v]) => [L(k), v] as [string, number]),
    [filtered]
  );
  const attentesData = useMemo(() =>
    countField(filtered, 'attentes_partenaire').map(([k, v]) => [L(k), v] as [string, number]),
    [filtered]
  );
  const attentesRdvData = useMemo(() =>
    countField(filtered, 'attentes_rdv').map(([k, v]) => [L(k), v] as [string, number]),
    [filtered]
  );
  const pointImportantData = useMemo(() =>
    countSingle(filtered, 'point_plus_important').map(([k, v]) => ({ name: L(k), value: v })),
    [filtered]
  );
  const budgetConnData = useMemo(() =>
    countSingle(filtered, 'connaissance_budgets').map(([k, v]) => ({ name: L(k), value: v })),
    [filtered]
  );
  const financementData = useMemo(() =>
    countSingle(filtered, 'financement_envisage').map(([k, v]) => ({ name: L(k), value: v })),
    [filtered]
  );
  const echeanceData = useMemo(() =>
    countSingle(filtered, 'echeance_installation').map(([k, v]) => ({ name: L(k), value: v })),
    [filtered]
  );
  const commentConnuData = useMemo(() =>
    countSingle(filtered, 'comment_connu')
      .filter(([k]) => k && k !== 'null')
      .map(([k, v]) => ({ name: L(k), value: v })),
    [filtered]
  );
  const consoHistogram = useMemo(() => {
    const bins = ['<5k', '5-8k', '8-12k', '12-16k', '16-20k', '>20k'];
    const counts = [0, 0, 0, 0, 0, 0];
    filtered.forEach(r => {
      const v = extractKwh(r.consommation_actuelle);
      if (!v || v >= 50000) return;
      if (v < 5000) counts[0]++;
      else if (v < 8000) counts[1]++;
      else if (v < 12000) counts[2]++;
      else if (v < 16000) counts[3]++;
      else if (v < 20000) counts[4]++;
      else counts[5]++;
    });
    return bins.map((name, i) => ({ name, value: counts[i] }));
  }, [filtered]);
  const evolutionData = useMemo(() =>
    countField(filtered, 'Evolution')
      .filter(([k]) => k !== 'rien' && k !== 'null')
      .map(([k, v]) => [L(k), v] as [string, number]),
    [filtered]
  );

  // ── Table ──
  const tableData = useMemo(() => {
    const search = tableSearch.toLowerCase();
    let data = filtered.filter(r =>
      !search || (
        (r.Commercial || '') + (r.metier || '') + (r.avancement_projet || '') + (r.tranche_age || '')
      ).toLowerCase().includes(search)
    );
    data = [...data].sort((a: any, b: any) => {
      const va = String(a[sortCol] || '');
      const vb = String(b[sortCol] || '');
      const cmp = va.localeCompare(vb, 'fr');
      return sortAsc ? cmp : -cmp;
    });
    return data;
  }, [filtered, tableSearch, sortCol, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(tableData.length / PAGE_SIZE));
  const currentPage = Math.min(tablePage, totalPages);
  const tableSlice = tableData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortAsc(v => !v);
    else { setSortCol(col); setSortAsc(true); }
    setTablePage(1);
  };

  // ── Social stats ──
  const socialStats = useMemo(() => {
    if (!safeSocial.length) return null;
    const platformMap: Record<string, number> = {};
    let totalClarity = 0, totalReassurance = 0, countScores = 0;
    safeSocial.forEach(item => {
      const p = (item.social_usage || 'Autre').trim();
      platformMap[p] = (platformMap[p] || 0) + 1;
      const cScore = parseInt(String(item.clarity || '0').split('/')[0]);
      const rScore = parseInt(String(item.reassurance || '0').split('/')[0]);
      if (!isNaN(cScore) && cScore > 0) { totalClarity += cScore; totalReassurance += rScore; countScores++; }
    });
    return {
      platformData: Object.entries(platformMap).map(([name, value]) => ({ name, value })),
      avgClarity: countScores > 0 ? (totalClarity / countScores).toFixed(1) : '0',
      avgReassurance: countScores > 0 ? (totalReassurance / countScores).toFixed(1) : '0',
      total: safeSocial.length,
    };
  }, [safeSocial]);

  // ── Helpers ──
  const tabBtn = (active: boolean) =>
    `flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${
      active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
    }`;

  const filterBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
      active
        ? 'bg-amber-500 border-amber-500 text-white'
        : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600'
    }`;

  const thClass = (col: string) =>
    `text-left px-3 py-2.5 text-[10px] font-black text-amber-500 uppercase tracking-widest cursor-pointer hover:text-slate-700 whitespace-nowrap select-none`;

  // ── Pagination builder ──
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const items: React.ReactNode[] = [];
    items.push(
      <button key="prev" onClick={() => setTablePage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:border-amber-400 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed">
        ← Préc.
      </button>
    );
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(i => totalPages <= 7 || Math.abs(i - currentPage) <= 1 || i === 1 || i === totalPages);
    pages.forEach((i, idx) => {
      if (idx > 0 && i - pages[idx - 1] > 1) {
        items.push(<span key={`el-${i}`} className="text-slate-400 px-1 text-xs">…</span>);
      }
      items.push(
        <button key={i} onClick={() => setTablePage(i)}
          className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
            currentPage === i ? 'border-amber-400 text-amber-600 bg-amber-50 font-bold' : 'border-slate-200 text-slate-500 hover:border-amber-300'
          }`}>
          {i}
        </button>
      );
    });
    items.push(
      <button key="next" onClick={() => setTablePage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:border-amber-400 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed">
        Suiv. →
      </button>
    );
    return <div className="flex items-center justify-end gap-1.5 mt-4">{items}</div>;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Sub-tabs ── */}
      <div className="flex items-center space-x-2 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button onClick={() => setSubTab('discovery')} className={tabBtn(subTab === 'discovery')}>
          <i className="fas fa-chart-line mr-2" />
          <span>Analyse Commerciale</span>
        </button>
        <button onClick={() => setSubTab('social')} className={tabBtn(subTab === 'social')}>
          <i className="fas fa-hashtag mr-2" />
          <span>Insights Réseaux</span>
        </button>
      </div>

      {/* ══════════════ DISCOVERY TAB ══════════════ */}
      {subTab === 'discovery' ? (
        safeDiscovery.length === 0 ? <EmptyState /> : (
          <div className="space-y-8">

            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap bg-white px-5 py-3.5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Commercial :</span>
              <button onClick={() => { setFilterCommercial('all'); setTablePage(1); }} className={filterBtn(filterCommercial === 'all')}>Tous</button>
              {commercials.map(c => (
                <button key={c} onClick={() => { setFilterCommercial(c); setTablePage(1); }} className={filterBtn(filterCommercial === c)}>
                  {c.replace(/_/g, ' ').replace(/\b\w/g, (x: string) => x.toUpperCase())}
                </button>
              ))}
              <div className="w-px h-5 bg-slate-200 mx-2" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Avancement :</span>
              <button onClick={() => { setFilterAvancement('all'); setTablePage(1); }} className={filterBtn(filterAvancement === 'all')}>Tous</button>
              {avancements.map(a => (
                <button key={a} onClick={() => { setFilterAvancement(a); setTablePage(1); }} className={filterBtn(filterAvancement === a)}>
                  {L(a)}
                </button>
              ))}
              <div className="ml-auto text-[10px] text-slate-400 font-medium">
                <strong className="text-slate-700">{filtered.length}</strong> / {safeDiscovery.length} réponses
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Questionnaires', value: kpis.total, color: 'text-slate-900' },
                { label: 'Déjà eu études PV', value: kpis.pvCount, color: 'text-amber-500' },
                { label: 'Conso moy. kWh/an', value: kpis.avgConso.toLocaleString('fr-FR'), color: 'text-slate-900' },
                { label: 'Projets imminents', value: kpis.imminent, color: 'text-green-500' },
                { label: 'Via Réseaux sociaux', value: kpis.reseaux, color: 'text-blue-500' },
              ].map(({ label, value, color }) => (
                <Card key={label}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                  <h3 className={`text-3xl font-black tabular-nums ${color}`}>{value}</h3>
                  <div className="mt-2 h-0.5 w-8 bg-amber-400 rounded-full" />
                </Card>
              ))}
            </div>

            {/* ── Section 1: Profil ── */}
            <SectionTitle>📊 Profil des prospects</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Avancement */}
              <Card>
                <CardTitle>Avancement du projet</CardTitle>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={avancData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={4} dataKey="value">
                        {avancData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
                  {avancData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                      <span className="text-[10px] text-slate-600">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Âge */}
              <Card>
                <CardTitle>Tranche d'âge</CardTitle>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ageData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={4} dataKey="value">
                        {ageData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
                  {ageData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                      <span className="text-[10px] text-slate-600">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Commercial */}
              <Card>
                <CardTitle>Répartition par commercial</CardTitle>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={commercialData} layout="vertical" margin={{ left: 0, right: 30, top: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} width={90} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* ── Section 2: Motivations & Freins ── */}
            <SectionTitle>💡 Motivations & Freins</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardTitle>Motivations prioritaires (multi-choix)</CardTitle>
                <BarItems entries={motivationsData} max={filtered.length} />
              </Card>
              <Card>
                <CardTitle>Freins spécifiques (multi-choix)</CardTitle>
                <BarItems entries={freinsData} max={filtered.length} />
              </Card>
            </div>

            {/* ── Section 3: Attentes & Priorités ── */}
            <SectionTitle>🎯 Attentes & Priorités</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardTitle>Attentes vis-à-vis du partenaire</CardTitle>
                <BarItems entries={attentesData} max={filtered.length} />
              </Card>
              <Card>
                <CardTitle>Attentes pour le RDV</CardTitle>
                <BarItems entries={attentesRdvData} max={filtered.length} />
              </Card>
              <Card>
                <CardTitle>Point le plus important</CardTitle>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pointImportantData} margin={{ bottom: 24, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600 }} angle={-15} textAnchor="end" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                      <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* ── Section 4: Budget & Financement ── */}
            <SectionTitle>💶 Budget & Financement</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <DoughnutCard title="Connaissance budgets" data={budgetConnData} />
              <DoughnutCard title="Financement envisagé" data={financementData} />
              <Card>
                <CardTitle>Échéance installation</CardTitle>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={echeanceData} margin={{ bottom: 16, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                      <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <DoughnutCard title="Comment connu RSP" data={commentConnuData} />
            </div>

            {/* ── Section 5: Consommation & Évolution ── */}
            <SectionTitle>⚡ Consommation & Évolution</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardTitle>Distribution consommation (kWh/an)</CardTitle>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={consoHistogram}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                      <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card>
                <CardTitle>Évolution de consommation prévue (multi-choix)</CardTitle>
                {evolutionData.length > 0 ? (
                  <BarItems entries={evolutionData} max={filtered.length} />
                ) : (
                  <p className="text-sm text-slate-400 italic mt-4">Aucune donnée d'évolution dans ce jeu de données.</p>
                )}
              </Card>
            </div>

            {/* ── Section 6: Raw data table ── */}
            <SectionTitle>
              🗂 Données brutes
              <span className="font-normal text-slate-400 text-xs normal-case tracking-normal ml-1">
                ({tableData.length} entrée{tableData.length > 1 ? 's' : ''})
              </span>
            </SectionTitle>
            <Card>
              <input
                type="text"
                placeholder="Rechercher par commercial, métier, avancement…"
                value={tableSearch}
                onChange={e => { setTableSearch(e.target.value); setTablePage(1); }}
                className="w-72 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-400 mb-4"
              />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-100">
                      {([
                        ['Date', 'Date'],
                        ['Commercial', 'Commercial'],
                        ['tranche_age', 'Âge'],
                        ['avancement_projet', 'Avancement'],
                        ['motivations_priorite', 'Motivations'],
                        ['freins_specifiques', 'Freins'],
                        ['financement_envisage', 'Financement'],
                        ['echeance_installation', 'Échéance'],
                        ['deja_etudes_pv', 'Études PV'],
                        ['comment_connu', 'Source'],
                      ] as [string, string][]).map(([col, label]) => (
                        <th key={col} onClick={() => handleSort(col)} className={thClass(col)}>
                          {label} {sortCol === col ? (sortAsc ? '↑' : '↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableSlice.map((r, idx) => {
                      const motivTags = (r.motivations_priorite || '').split(',').map(s => s.trim()).filter(Boolean);
                      const freinsTags = (r.freins_specifiques || '').split(',').map(s => s.trim()).filter(Boolean);
                      return (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-amber-50/30 transition-colors">
                          <td className="px-3 py-2 text-slate-400 whitespace-nowrap font-mono text-[10px]">
                            {(r.Date || '').slice(0, 10)}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">
                            {(r.Commercial || '').replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase())}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{r.tranche_age || '—'}</td>
                          <td className="px-3 py-2">
                            <Pill
                              text={L(r.avancement_projet || '')}
                              color={PILL_AVANCEMENT[r.avancement_projet || ''] || 'bg-slate-100 text-slate-500'}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {motivTags.map(t => <Pill key={t} text={L(t)} />)}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {freinsTags.map(t => <Pill key={t} text={L(t)} />)}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {r.financement_envisage
                              ? <Pill text={L(r.financement_envisage)} color={PILL_FINANCEMENT[r.financement_envisage] || 'bg-slate-100 text-slate-500'} />
                              : '—'}
                          </td>
                          <td className="px-3 py-2">
                            {r.echeance_installation ? <Pill text={L(r.echeance_installation)} /> : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <Pill
                              text={r.deja_etudes_pv === 'oui' ? 'Oui' : 'Non'}
                              color={r.deja_etudes_pv === 'oui' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}
                            />
                          </td>
                          <td className="px-3 py-2">
                            {r.comment_connu
                              ? <Pill text={L(r.comment_connu)} color="bg-blue-100 text-blue-700" />
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {tableSlice.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-3 py-8 text-center text-slate-400 text-xs italic">
                          Aucun résultat pour cette recherche
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </Card>
          </div>
        )
      ) : (
        /* ══════════════ SOCIAL TAB ══════════════ */
        socialStats ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Clarté Globale</p>
                <h3 className="text-4xl font-black tabular-nums">{socialStats.avgClarity} <span className="text-sm text-slate-500">/ 5</span></h3>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Indice Confiance</p>
                <h3 className="text-4xl font-black text-slate-900 tabular-nums">{socialStats.avgReassurance} <span className="text-sm text-slate-300">/ 5</span></h3>
              </div>
              <div className="bg-amber-500 p-8 rounded-[40px] shadow-lg shadow-amber-500/20 text-white">
                <p className="text-[10px] font-black text-amber-100 uppercase tracking-widest mb-1">Nombre d'avis</p>
                <h3 className="text-4xl font-black tabular-nums">{socialStats.total}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-900 mb-8 uppercase tracking-widest">Visibilité par Plateforme</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={socialStats.platformData} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value">
                        {socialStats.platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name.toLowerCase().includes('facebook') ? '#1877F2' : '#E4405F'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                <h3 className="text-[10px] font-black text-slate-900 mb-6 uppercase tracking-widest">Suggestions d'amélioration</h3>
                <div className="space-y-4 flex-1 overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                  {safeSocial.filter(s => s.improvement && s.improvement !== 'Non répondu').map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-700 italic">"{item.improvement}"</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{item.Date || 'Récemment'}</span>
                      </div>
                    </div>
                  ))}
                  {safeSocial.filter(s => s.improvement && s.improvement !== 'Non répondu').length === 0 && (
                    <p className="text-sm text-slate-400 italic">Aucune suggestion enregistrée.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : <EmptyState />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default QuestionnaireView;
