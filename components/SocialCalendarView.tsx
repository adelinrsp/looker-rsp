
import React, { useState, useMemo } from 'react';
import { SocialPost } from '../services/facebookAdsService';

interface SocialCalendarViewProps {
  posts: SocialPost[];
}

const SocialCalendarView: React.FC<SocialCalendarViewProps> = ({ posts }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const parseDateToKey = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const postsByDate = useMemo(() => {
    const map: Record<string, SocialPost[]> = {};
    posts.forEach(post => {
      const key = parseDateToKey(post.created_time);
      if (!map[key]) map[key] = [];
      map[key].push(post);
    });
    return map;
  }, [posts]);

  const days = useMemo(() => {
    const result = [];
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      result.push({ day: prevMonthDays - i, currentMonth: false, monthOffset: -1 });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      result.push({ day: i, currentMonth: true, monthOffset: 0 });
    }

    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({ day: i, currentMonth: false, monthOffset: 1 });
    }

    return result;
  }, [currentYear, currentMonth]);

  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));

  return (
    <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[75vh] animate-fade-in">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-6">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
            {monthNames[currentMonth]} <span className="text-slate-400 font-bold">{currentYear}</span>
          </h2>
          <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
            <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-all"><i className="fas fa-chevron-left text-slate-400"></i></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-amber-500 transition-all">Aujourd'hui</button>
            <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-all"><i className="fas fa-chevron-right text-slate-400"></i></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 overflow-y-auto">
          {days.map((d, i) => {
            const dateObj = new Date(currentYear, currentMonth + d.monthOffset, d.day);
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            const dayPosts = postsByDate[dateKey] || [];
            const isToday = parseDateToKey(new Date().toISOString()) === dateKey;

            const isLastColumn = i % 7 === 6;
            const isLastRow = i >= 35;

            return (
              <div 
                key={i} 
                className={`min-h-[140px] p-2 transition-colors group ${
                  !d.currentMonth ? 'bg-slate-50/30 opacity-50' : 'bg-white hover:bg-slate-50/50'
                } ${isToday ? 'bg-amber-50/30' : ''} ${!isLastColumn ? 'border-r' : ''} ${!isLastRow ? 'border-b' : ''} border-slate-50`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-black tabular-nums ${
                    isToday ? 'bg-amber-500 text-white w-7 h-7 flex items-center justify-center rounded-full shadow-lg' : 
                    d.currentMonth ? 'text-slate-900' : 'text-slate-300'
                  }`}>
                    {d.day}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-1.5">
                  {dayPosts.map(post => (
                    <a 
                      key={post.id}
                      href={post.permalink_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:scale-105 transition-all group/post"
                    >
                      {post.full_picture ? (
                        <img src={post.full_picture} className="w-full h-full object-cover" alt="Social Post" />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <i className="fas fa-file-alt text-[10px] text-white"></i>
                        </div>
                      )}
                      
                      {/* Indicateur Play si vidéo */}
                      {post.isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                          <i className="fas fa-play text-white text-[10px] opacity-70"></i>
                        </div>
                      )}

                      <div className={`absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center text-[7px] text-white ${post.platform === 'facebook' ? 'bg-[#1877F2]' : 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]'}`}>
                        <i className={`fab fa-${post.platform === 'facebook' ? 'facebook-f' : 'instagram'}`}></i>
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/post:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-black uppercase">
                        Voir
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SocialCalendarView;
