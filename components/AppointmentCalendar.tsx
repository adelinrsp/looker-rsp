
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';

interface AppointmentCalendarProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const ALLOWED_SALESPERSONS = ['PIERRE', 'MORGAN', 'LAURENT'];

const SALESPERSON_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'PIERRE': { bg: 'bg-blue-50/50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500' },
  'MORGAN': { bg: 'bg-amber-50/50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' },
  'LAURENT': { bg: 'bg-emerald-50/50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  'default': { bg: 'bg-slate-50/50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' }
};

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ leads, onSelectLead }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSalespersons, setSelectedSalespersons] = useState<string[]>(ALLOWED_SALESPERSONS);

  const parseAppointmentDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const cleanStr = dateStr.trim();
    const dmyMatch = cleanStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2})[:h](\d{1,2}))?/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
      const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
      const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
      return new Date(year, month, day, hour, min);
    }
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    leads.forEach(lead => {
      const hasValidStatus = ['Opportunité Commerce', 'Parrainage'].includes(lead.status);
      if (!hasValidStatus) return;
      const rawSalesperson = lead.salesperson?.trim().toUpperCase() || '';
      if (!rawSalesperson || !ALLOWED_SALESPERSONS.includes(rawSalesperson)) return;
      if (!selectedSalespersons.includes(rawSalesperson)) return;

      const date = parseAppointmentDate(lead.dateAppointment);
      if (date) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = [];
        map[key].push(lead);
      }
    });
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => {
        const dateA = parseAppointmentDate(a.dateAppointment)?.getTime() || 0;
        const dateB = parseAppointmentDate(b.dateAppointment)?.getTime() || 0;
        return dateA - dateB;
      });
    });
    return map;
  }, [leads, selectedSalespersons]);

  const weeks = useMemo(() => {
    const result = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    let currentWeek: any[] = [];

    // Jours du mois précédent
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      currentWeek.push({ day: prevMonthDays - i, currentMonth: false, monthOffset: -1 });
    }

    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push({ day: i, currentMonth: true, monthOffset: 0 });
    }

    // Jours du mois suivant
    let nextDay = 1;
    while (currentWeek.length < 7 || result.length < 6) {
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push({ day: nextDay++, currentMonth: false, monthOffset: 1 });
      if (result.length >= 6 && currentWeek.length === 0) break;
    }
    if (currentWeek.length > 0) result.push(currentWeek);

    return result;
  }, [currentYear, currentMonth]);

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-fade-in">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between bg-white gap-6 shrink-0">
        <div className="flex items-center space-x-8">
          <div className="flex flex-col">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">
              {monthNames[currentMonth]}
            </h2>
            <span className="text-lg font-bold text-slate-300 tracking-widest uppercase">{currentYear}</span>
          </div>
          <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-slate-900"><i className="fas fa-chevron-left"></i></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all border-x border-slate-100">Aujourd'hui</button>
            <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-slate-900"><i className="fas fa-chevron-right"></i></button>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-end space-y-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Équipe Commerciale</span>
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              {ALLOWED_SALESPERSONS.map(s => {
                const isSelected = selectedSalespersons.includes(s);
                const colors = SALESPERSON_COLORS[s];
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedSalespersons(prev => prev.includes(s) ? prev.filter(n => n !== s) : [...prev, s])}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 border ${isSelected ? `${colors.bg} ${colors.border} ${colors.text} shadow-sm` : 'bg-white border-slate-200 text-slate-400 grayscale opacity-50'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? colors.dot : 'bg-slate-300'}`}></div>
                    <span>{s}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-5 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex flex-col items-center">
            <span className="text-lg font-black leading-none tabular-nums">{Object.values(appointmentsByDate).flat().length}</span>
            <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-70">Rendez-vous</span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50/20">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-white sticky top-0 z-20 shadow-sm">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        {/* Weeks Rendering */}
        <div className="flex flex-col">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 border-b border-slate-100/50 min-h-[140px]">
              {week.map((d: any, dayIdx: number) => {
                const dateObj = new Date(currentYear, currentMonth + d.monthOffset, d.day);
                const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                const dayAppointments = appointmentsByDate[dateKey] || [];
                const isToday = new Date().toDateString() === dateObj.toDateString();

                return (
                  <div 
                    key={dayIdx} 
                    className={`p-3 transition-all border-slate-100/50 border-r last:border-r-0 relative flex flex-col ${!d.currentMonth ? 'bg-slate-50/10 opacity-30 grayscale' : 'bg-white hover:bg-slate-50/40'} ${isToday ? 'bg-amber-50/30' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-black tabular-nums ${isToday ? 'bg-amber-500 text-white w-8 h-8 flex items-center justify-center rounded-2xl shadow-lg -mt-1 -ml-1 scale-110' : d.currentMonth ? 'text-slate-900' : 'text-slate-300'}`}>
                        {d.day}
                      </span>
                    </div>
                    
                    <div className="space-y-1.5 flex-1">
                      {dayAppointments.map((lead, idx) => {
                        const timePart = lead.dateAppointment?.match(/(\d{1,2}[:h]\d{1,2})/)?.[1] || '08:00';
                        const sKey = lead.salesperson?.trim().toUpperCase() || 'DEFAULT';
                        const colors = SALESPERSON_COLORS[sKey] || SALESPERSON_COLORS['default'];
                        
                        return (
                          <button 
                            key={`${lead.id}-${idx}`}
                            onClick={() => onSelectLead(lead)}
                            className={`w-full p-2 rounded-xl border transition-all text-left flex flex-col group/card shadow-sm hover:shadow-md ${colors.bg} ${colors.border} hover:bg-white`}
                          >
                            <div className="flex justify-between items-start mb-0.5">
                              <span className="text-[9px] font-black text-slate-900 truncate pr-1 leading-tight capitalize">
                                {lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim()}
                              </span>
                              <span className={`text-[8px] font-black tabular-nums bg-white px-1 py-0.5 rounded border ${colors.border} ${colors.text}`}>
                                {timePart}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <div className={`w-1 h-1 rounded-full ${colors.dot}`}></div>
                                <span className={`text-[7px] font-black uppercase tracking-widest ${colors.text}`}>
                                  {sKey}
                                </span>
                              </div>
                              <span className="text-[7px] font-bold text-slate-400 tabular-nums">{lead.postalCode}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 bg-white border-t border-slate-100 flex items-center justify-center space-x-10 shrink-0">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Légende :</span>
        <div className="flex items-center space-x-6">
          {ALLOWED_SALESPERSONS.map(name => {
            const colors = SALESPERSON_COLORS[name];
            return (
              <div key={name} className="flex items-center space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`}></div>
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;
