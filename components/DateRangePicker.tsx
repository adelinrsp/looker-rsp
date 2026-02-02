
import React, { useState, useRef, useEffect } from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onRangeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(startDate));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper pour formater une date en YYYY-MM-DD local sans décalage UTC
  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const start = new Date(startDate);
  const end = new Date(endDate);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presets = [
    { label: "Aujourd'hui", getValue: () => { const d = new Date(); return [formatDateLocal(d), formatDateLocal(d)]; } },
    { label: "7 derniers jours", getValue: () => { 
        const d = new Date(); 
        const s = new Date(); s.setDate(d.getDate() - 7); 
        return [formatDateLocal(s), formatDateLocal(d)]; 
    } },
    { label: "30 derniers jours", getValue: () => { 
        const d = new Date(); 
        const s = new Date(); s.setDate(d.getDate() - 30); 
        return [formatDateLocal(s), formatDateLocal(d)]; 
    } },
    { label: "Ce mois-ci", getValue: () => { 
        const now = new Date(); 
        const s = new Date(now.getFullYear(), now.getMonth(), 1); 
        return [formatDateLocal(s), formatDateLocal(now)]; 
    } },
    { label: "Le mois dernier", getValue: () => { 
        const now = new Date(); 
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1); 
        const e = new Date(now.getFullYear(), now.getMonth(), 0); 
        return [formatDateLocal(s), formatDateLocal(e)]; 
    } },
    { label: "Cette année", getValue: () => { 
        const now = new Date(); 
        const s = new Date(now.getFullYear(), 0, 1); 
        return [formatDateLocal(s), formatDateLocal(now)]; 
    } },
    { label: "L'année dernière", getValue: () => { 
        const now = new Date(); 
        const lastYear = now.getFullYear() - 1;
        const s = new Date(lastYear, 0, 1); 
        const e = new Date(lastYear, 11, 31); 
        return [formatDateLocal(s), formatDateLocal(e)]; 
    } },
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    const [s, e] = preset.getValue();
    onRangeChange(s, e);
    setViewDate(new Date(s));
    setIsOpen(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay: (firstDay === 0 ? 6 : firstDay - 1), daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(viewDate);
  const prevMonthDays = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    
    // Si on a déjà une plage ou rien, on commence une nouvelle sélection
    if ((startDate && endDate && startDate !== endDate) || !startDate) {
      onRangeChange(formatDateLocal(clickedDate), formatDateLocal(clickedDate));
    } else {
      const currentStart = new Date(startDate);
      if (clickedDate < currentStart) {
        onRangeChange(formatDateLocal(clickedDate), startDate);
      } else {
        onRangeChange(startDate, formatDateLocal(clickedDate));
        setIsOpen(false);
      }
    }
  };

  const isSelected = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = formatDateLocal(d);
    return dateStr === startDate || dateStr === endDate;
  };

  const isInRange = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = formatDateLocal(d);
    return dateStr > startDate && dateStr < endDate;
  };

  const isHoveredRange = (day: number) => {
    if (!hoverDate || (startDate && endDate && startDate !== endDate)) return false;
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const s = new Date(startDate);
    return (d > s && d <= hoverDate) || (d < s && d >= hoverDate);
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-4 px-6 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-amber-500 transition-all group"
      >
        <div className="flex items-center space-x-2">
          <i className="far fa-calendar text-slate-400 group-hover:text-amber-500 transition-colors"></i>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Période :</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm font-black text-slate-900 tabular-nums">
            {startDate.split('-').reverse().join('/')}
          </span>
          <span className="text-slate-300 font-bold">→</span>
          <span className="text-sm font-black text-slate-900 tabular-nums">
            {endDate.split('-').reverse().join('/')}
          </span>
        </div>
        <i className={`fas fa-chevron-down text-[10px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 bg-white rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-slate-100 flex overflow-hidden z-[10001] w-[540px] animate-in fade-in zoom-in-95 duration-200">
          <div className="w-48 bg-slate-50 border-r border-slate-100 p-4 flex flex-col space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-2">Raccourcis</p>
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-white hover:text-amber-600 hover:shadow-sm transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors">
                <i className="fas fa-chevron-left text-xs text-slate-900"></i>
              </button>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h4>
              <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors">
                <i className="fas fa-chevron-right text-xs text-slate-900"></i>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(day => (
                <div key={day} className="text-center text-[9px] font-black text-slate-400 uppercase py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`prev-${i}`} className="h-10 flex items-center justify-center text-slate-200 text-xs font-bold">
                  {prevMonthDays - firstDay + i + 1}
                </div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const selected = isSelected(day);
                const inRange = isInRange(day);
                const hoverRange = isHoveredRange(day);
                
                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    onMouseEnter={() => setHoverDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))}
                    onMouseLeave={() => setHoverDate(null)}
                    className={`h-10 w-full relative flex items-center justify-center transition-all ${
                      selected ? 'bg-slate-900 text-white rounded-xl z-10 shadow-lg scale-105' : 
                      inRange ? 'bg-amber-100 text-amber-700' :
                      hoverRange ? 'bg-amber-50 text-amber-600' :
                      'text-slate-900 hover:bg-slate-100 rounded-xl'
                    }`}
                  >
                    <span className="text-xs font-black tabular-nums">{day}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
