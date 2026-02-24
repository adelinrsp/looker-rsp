
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LabelList, Legend } from 'recharts';
import { ClientDiscovery, SocialQuestionnaire } from '../types';

// Define the missing constant for the chart bar color
const RSP_ORANGE = '#f59e0b';
const COLORS = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#94a3b8'];

const HURDLE_COLORS: Record<string, string> = {
  'Étanchéité / Technique': '#3b82f6', // Bleu (Technique)
  'Esthétique': '#8b5cf6',             // Violet (Design)
  'Confiance / Sous-traitance': '#f43f5e', // Rouge (Risque perçu)
  'Budget / Prix': '#f59e0b',          // Orange (Argent)
  'Sécurité / Incendie': '#ef4444',    // Rouge vif (Sécurité)
  'Autres / Recyclage': '#94a3b8'      // Gris
};

const getEntryDate = (item: any): string | null => {
  if (!item) return null;
  return item.Date || item.Horodateur || item.Timestamp || item.timestamp || null;
};

const getCommercialName = (item: any): string => {
  if (!item) return 'Inconnu';
  const name = item.Commercial || item.commercial || item['Nom du commercial'] || item['Prénom'] || 'Inconnu';
  return String(name).trim();
};

interface QuestionnaireViewProps {
  discovery: ClientDiscovery[];
  social: SocialQuestionnaire[];
}

const QuestionnaireView: React.FC<QuestionnaireViewProps> = ({ discovery, social }) => {
  const [subTab, setSubTab] = useState<'discovery' | 'social'>('discovery');

  const safeDiscovery = useMemo(() => 
    Array.isArray(discovery) ? discovery.filter(d => d && Object.keys(d).length > 2) : [], 
    [discovery]
  );
  
  const safeSocial = useMemo(() => 
    Array.isArray(social) ? social.filter(s => s && Object.keys(s).length > 2) : [], 
    [social]
  );

  const discoveryStats = useMemo(() => {
    if (!safeDiscovery.length) return null;

    const commMap: Record<string, number> = {};
    const stageMap: Record<string, number> = {};
    const hurdleCategories: Record<string, number> = {
      'Étanchéité / Technique': 0,
      'Esthétique': 0,
      'Confiance / Sous-traitance': 0,
      'Budget / Prix': 0,
      'Sécurité / Incendie': 0,
      'Autres / Recyclage': 0
    };

    let totalKwh = 0;
    let kwhCount = 0;
    let hasStudies = 0;

    safeDiscovery.forEach(item => {
      const comm = getCommercialName(item);
      commMap[comm] = (commMap[comm] || 0) + 1;

      const s = (item.avancement_projet || 'Non précisé').trim();
      stageMap[s] = (stageMap[s] || 0) + 1;

      // Analyse intelligente et granulaire des freins (Colonne O)
      const frein = String(item.freins_specifiques || '').toLowerCase().trim();
      if (frein && !['rien', 'ras', 'non', 'aucun', 'aucune', '/', 'no', '0'].includes(frein)) {
        
        // On vérifie les mots-clés spécifiques fournis par le client
        const hasEtancheite = frein.includes('etancheite') || frein.includes('étanchéité') || frein.includes('toiture') || frein.includes('fuite');
        const hasEsthetique = frein.includes('esthetique') || frein.includes('esthétique') || frein.includes('visuel') || frein.includes('look');
        const hasTrust = frein.includes('sous_traitance') || frein.includes('sous-traitance') || frein.includes('experience') || frein.includes('confiance') || frein.includes('société');
        const hasFire = frein.includes('incendie') || frein.includes('feu') || frein.includes('securité') || frein.includes('sécurité');
        const hasBudget = frein.includes('prix') || frein.includes('cher') || frein.includes('budget') || frein.includes('financement');
        const hasRecyclage = frein.includes('recyclage') || frein.includes('environnement');

        if (hasEtancheite) hurdleCategories['Étanchéité / Technique']++;
        if (hasEsthetique) hurdleCategories['Esthétique']++;
        if (hasTrust) hurdleCategories['Confiance / Sous-traitance']++;
        if (hasFire) hurdleCategories['Sécurité / Incendie']++;
        if (hasBudget) hurdleCategories['Budget / Prix']++;
        
        // Si c'est du recyclage ou autre chose non classé
        if (hasRecyclage || (!hasEtancheite && !hasEsthetique && !hasTrust && !hasFire && !hasBudget)) {
          hurdleCategories['Autres / Recyclage']++;
        }
      }

      const dejaEtude = String(item.deja_etudes_pv || '').toLowerCase();
      if (dejaEtude.includes('oui')) hasStudies++;

      const conso = String(item.consommation_actuelle || '');
      const kwhMatch = conso.match(/(\d+)\s*kWh/i) || conso.match(/^(\d+)/);
      if (kwhMatch) {
        totalKwh += parseInt(kwhMatch[1]);
        kwhCount++;
      }
    });

    return {
      commData: Object.entries(commMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      stageData: Object.entries(stageMap).map(([name, value]) => ({ name, value })),
      hurdleData: Object.entries(hurdleCategories)
        .map(([name, value]) => ({ name, value }))
        .filter(h => h.value > 0)
        .sort((a, b) => b.value - a.value),
      avgKwh: kwhCount > 0 ? Math.round(totalKwh / kwhCount) : 0,
      pvStudyRate: Math.round((hasStudies / safeDiscovery.length) * 100),
      total: safeDiscovery.length
    };
  }, [safeDiscovery]);

  const socialStats = useMemo(() => {
    if (!safeSocial.length) return null;

    const platformMap: Record<string, number> = {};
    let totalClarity = 0;
    let totalReassurance = 0;
    let countScores = 0;

    safeSocial.forEach(item => {
      const p = (item.social_usage || 'Autre').trim();
      platformMap[p] = (platformMap[p] || 0) + 1;

      const cScore = parseInt(String(item.clarity || '0').split('/')[0]);
      const rScore = parseInt(String(item.reassurance || '0').split('/')[0]);
      if (!isNaN(cScore) && cScore > 0) {
        totalClarity += cScore;
        totalReassurance += rScore;
        countScores++;
      }
    });

    return {
      platformData: Object.entries(platformMap).map(([name, value]) => ({ name, value })),
      avgClarity: countScores > 0 ? (totalClarity / countScores).toFixed(1) : '0',
      avgReassurance: countScores > 0 ? (totalReassurance / countScores).toFixed(1) : '0',
      total: safeSocial.length
    };
  }, [safeSocial]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center space-x-2 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button
          onClick={() => setSubTab('discovery')}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${
            subTab === 'discovery' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <i className="fas fa-chart-line mr-2"></i>
          <span>Analyse Commerciale</span>
        </button>
        <button
          onClick={() => setSubTab('social')}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${
            subTab === 'social' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <i className="fas fa-hashtag mr-2"></i>
          <span>Insights Réseaux</span>
        </button>
      </div>

      {subTab === 'discovery' ? (
        discoveryStats ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Audits</p>
                <h3 className="text-3xl font-black text-slate-900 tabular-nums">{discoveryStats.total}</h3>
              </div>
              <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conso Moyenne</p>
                <h3 className="text-3xl font-black text-amber-500 tabular-nums">{discoveryStats.avgKwh} <span className="text-sm font-bold text-slate-400">kWh</span></h3>
              </div>
              <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Maturité Projet</p>
                <h3 className="text-3xl font-black text-slate-900 tabular-nums">
                  {discoveryStats.stageData.find(d => d.name.toLowerCase().includes('imminent'))?.value || 0}
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Projets imminents</p>
              </div>
              <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Taux Études PV</p>
                <h3 className="text-3xl font-black text-blue-500 tabular-nums">{discoveryStats.pvStudyRate}%</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Prospects déjà consultés</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-widest text-[10px]">Volume par Commercial (Lignes traitées)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={discoveryStats.commData} layout="vertical" margin={{ left: 20, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 10, fontStyle: 'normal', fontWeight: 900}} 
                        width={110} 
                      />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                      />
                      <Bar 
                        dataKey="value" 
                        fill={RSP_ORANGE} 
                        radius={[0, 10, 10, 0]} 
                        barSize={32}
                      >
                        <LabelList 
                          dataKey="value" 
                          position="right" 
                          style={{ fill: '#0f172a', fontWeight: 900, fontSize: 12 }} 
                          formatter={(val: number) => `${val} dossiers`}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SECTION DES FREINS EN CAMEMBERT DÉTAILLÉE */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-widest text-[10px]">Analyse des Freins & Objections</h3>
                
                <div className="flex flex-col md:flex-row items-center justify-between flex-1">
                  <div className="h-64 w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={discoveryStats.hurdleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {discoveryStats.hurdleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={HURDLE_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full md:w-1/2 space-y-2 pl-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {discoveryStats.hurdleData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 hover:border-amber-200 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: HURDLE_COLORS[item.name] || COLORS[idx % COLORS.length]}}></div>
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900 tabular-nums">{item.value} <span className="text-[8px] text-slate-400">cas</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-widest text-[10px]">Maturité Globale du Pipeline</h3>
              <div className="flex flex-col lg:flex-row items-center gap-10">
                <div className="h-64 w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={discoveryStats.stageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {discoveryStats.stageData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
                  {discoveryStats.stageData.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl flex items-center space-x-4">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.name}</p>
                        <p className="text-lg font-black text-slate-900">{item.value} <span className="text-[10px] font-bold text-slate-400">cas</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState />
        )
      ) : (
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
                <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-widest text-[10px]">Visibilité par Plateforme</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={socialStats.platformData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {socialStats.platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name.toLowerCase().includes('facebook') ? '#1877F2' : '#E4405F'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-widest text-[10px]">Suggestions d'amélioration</h3>
                <div className="space-y-4 flex-1 overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                  {safeSocial.filter(s => s.improvement && s.improvement !== 'Non répondu').map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-700 italic">"{item.improvement}"</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{getEntryDate(item) || 'Récemment'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState />
        )
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

const EmptyState = () => (
  <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-24 text-center">
    <i className="fas fa-chart-pie text-slate-200 text-4xl mb-4"></i>
    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aucune donnée exploitable trouvée</p>
  </div>
);

export default QuestionnaireView;
