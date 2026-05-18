
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Lead } from '../types';
import { FacebookAdsData } from '../services/facebookAdsService';

interface DashboardProps {
  leads: Lead[];
  fbData: FacebookAdsData | null;
}

const Dashboard: React.FC<DashboardProps> = ({ leads, fbData }) => {
  const fbSpend = fbData?.spend || 0;
  
  const fbLeadsCount = leads.filter(l => {
    const s = String(l.source || '').toLowerCase();
    return s.includes('facebook') || s.includes('fb') || s.includes('ads');
  }).length;

  const cpl = fbLeadsCount > 0 ? (fbSpend / fbLeadsCount).toFixed(2) : "0.00";

  const stats = [
    { label: 'Total Prospects', value: leads.length, color: 'bg-slate-900', icon: 'fa-users' },
    { label: 'Rendez-vous', value: leads.filter(l => l.status.includes('RDV') || l.status.includes('Commerce')).length, color: 'bg-emerald-500', icon: 'fa-calendar-check' },
    { label: 'Dépenses Meta Ads', value: `${fbSpend.toLocaleString('fr-FR')} €`, color: 'bg-[#1877F2]', icon: 'fa-brands fa-facebook-f' },
    { label: 'CPL Facebook', value: `${cpl} €`, color: 'bg-amber-500', icon: 'fa-funnel-dollar' },
  ];

  const statusData = [
    { name: 'Nouveaux', value: leads.filter(l => l.status === 'Nouveau' || l.status === 'Parrainage').length, color: '#3b82f6' },
    { name: 'En cours', value: leads.filter(l => l.status === 'À rappeler' || l.status === 'Répondeur').length, color: '#f59e0b' },
    { name: 'RDV Fixés', value: leads.filter(l => l.status.includes('RDV') || l.status.includes('Commerce')).length, color: '#10b981' },
    { name: 'Perdus', value: leads.filter(l => l.status === 'Perdu' || l.status === 'RDV Annulé').length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8">
      {/* Alerte Facebook Performance */}
      <div className="bg-white border border-slate-200 p-6 rounded-[32px] shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1877F2] text-2xl shadow-inner">
            <i className="fab fa-facebook"></i>
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-lg tracking-tight">Acquisition Meta Ads</h4>
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mt-1">Données synchronisées en temps réel</p>
          </div>
        </div>
        <div className="flex space-x-12 mr-6">
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Impressions</p>
            <p className="font-black text-xl text-slate-900 tabular-nums">{fbData?.impressions.toLocaleString('fr-FR') || 0}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-12">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Leads Identifiés</p>
            <p className="font-black text-xl text-slate-900 tabular-nums">{fbLeadsCount}</p>
          </div>
        </div>
      </div>

      {/* Cartes KPI Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-7 rounded-[32px] shadow-sm border border-slate-100 flex items-center space-x-5 hover:scale-[1.02] transition-transform cursor-default">
            <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl shadow-black/5`}>
              <i className={`${stat.icon}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 min-h-[400px]">
          <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Performance Marketing vs Ventes</h3>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px'}}
                />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={60}>
                   {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Pipeline Global</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={10}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-4xl font-black text-slate-900 tabular-nums">{leads.length}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</span>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: item.color}}></div>
                  <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900 tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
