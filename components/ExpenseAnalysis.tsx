
import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CompanyExpense, Lead } from '../types';

interface ExpenseAnalysisProps {
  expenses: CompanyExpense[];
  leads: Lead[];
  startDate: string;
  endDate: string;
}

const ExpenseAnalysis: React.FC<ExpenseAnalysisProps> = ({ expenses, leads, startDate, endDate }) => {
  
  // CONVERTIT TOUTE DATE EN NOMBRE YYYYMMDD (Timezone Proof)
  const dateToNum = (dateVal: any): number => {
    if (!dateVal) return 0;
    let str = String(dateVal).trim();
    if (!str) return 0;

    if (str.includes('T')) {
      str = str.split('T')[0];
    }

    const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10);
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
      return year * 10000 + month * 100 + day;
    }
    
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return parseInt(isoMatch[1]) * 10000 + parseInt(isoMatch[2]) * 100 + parseInt(isoMatch[3]);
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }

    return 0;
  };

  const cleanAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).replace(/[\s\u00A0\u202F]/g, '').replace(/[^\d.,-]/g, '').replace(',', '.');
    return parseFloat(str) || 0;
  };

  const filteredData = useMemo(() => {
    const sLimit = dateToNum(startDate);
    const eLimit = dateToNum(endDate);

    const filteredExpenses = expenses.filter(e => {
      const n = dateToNum(e.date);
      return n >= sLimit && n <= eLimit;
    });

    const filteredLeads = leads.filter(l => {
      const n = dateToNum(l.dateEntry);
      return n >= sLimit && n <= eLimit;
    });

    const totalAmount = filteredExpenses.reduce((acc, curr) => acc + cleanAmount(curr.amount), 0);
    const leadsCount = filteredLeads.length;
    const globalCpl = leadsCount > 0 ? (totalAmount / leadsCount).toFixed(2) : "0.00";

    return { filteredExpenses, totalAmount, leadsCount, globalCpl };
  }, [expenses, leads, startDate, endDate]);

  const chartData = useMemo(() => {
    const monthlyMap: Record<string, any> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
      const key = current.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      monthlyMap[key] = { name: key, depenses: 0, leads: 0 };
      current.setMonth(current.getMonth() + 1);
    }

    expenses.forEach(e => {
      const n = dateToNum(e.date);
      if (n) {
        const d = new Date(Math.floor(n/10000), Math.floor((n%10000)/100)-1, n%100);
        const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        if (monthlyMap[key]) monthlyMap[key].depenses += cleanAmount(e.amount);
      }
    });

    leads.forEach(l => {
      const n = dateToNum(l.dateEntry);
      if (n) {
        const d = new Date(Math.floor(n/10000), Math.floor((n%10000)/100)-1, n%100);
        const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        if (monthlyMap[key]) monthlyMap[key].leads++;
      }
    });

    return Object.values(monthlyMap);
  }, [expenses, leads, startDate, endDate]);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <i className="fas fa-wallet text-6xl"></i>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Dépenses Société (HT)</p>
          <h3 className="text-5xl font-black tabular-nums tracking-tighter">
            {filteredData.totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
          </h3>
          <p className="mt-4 text-xs font-bold text-slate-400 italic">Analyse en cours</p>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Volume Acquisition</p>
          <h3 className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">{filteredData.leadsCount}</h3>
          <p className="mt-4 text-xs font-bold text-slate-500">Prospects entrants</p>
        </div>
        <div className="bg-amber-500 p-10 rounded-[40px] text-white shadow-xl shadow-amber-500/20">
          <p className="text-[10px] font-black text-amber-100 uppercase tracking-[0.2em] mb-4">CPL Global Structurel</p>
          <h3 className="text-5xl font-black tabular-nums tracking-tighter">{filteredData.globalCpl}€</h3>
          <p className="mt-4 text-xs font-bold text-amber-50">Dépenses / Prospects</p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-widest text-xs">Évolution Mensuelle ROI</h3>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} dy={15} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#f59e0b', fontSize: 10, fontWeight: '700'}} />
              <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontFamily: 'Outfit'}} />
              <Bar yAxisId="left" dataKey="depenses" fill="#0f172a" radius={[10, 10, 0, 0]} barSize={40} />
              <Line yAxisId="right" type="monotone" dataKey="leads" stroke="#f59e0b" strokeWidth={4} dot={{r: 6, fill: '#f59e0b', strokeWidth: 3, stroke: '#fff'}} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Détail des lignes de dépenses</h4>
          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black">{filteredData.filteredExpenses.length} flux</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-slate-900 uppercase tracking-widest">Libellé</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-900 uppercase tracking-widest">Type</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Montant HT</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.filteredExpenses.map((expense, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5">
                  <p className="text-sm font-black text-slate-900">{expense.name || 'Sans nom'}</p>
                  <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">{expense.provider}</p>
                </td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">{expense.expenseType}</span>
                </td>
                <td className="px-8 py-5 text-right font-black text-slate-900 tabular-nums">
                  {cleanAmount(expense.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </td>
                <td className="px-8 py-5 text-center text-[10px] font-black text-slate-400">
                  {expense.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseAnalysis;
