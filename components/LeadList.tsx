
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lead } from '../types';

interface LeadListProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
}

const STATUS_CONFIG: Record<string, { bg: string; text: 'dark' | 'light' }> = {
  'Opportunité Tertiaire': { bg: '#FCBC05', text: 'dark' },
  'Opportunité Commerce': { bg: '#76F475', text: 'dark' },
  'Parrainage': { bg: '#76F475', text: 'dark' },
  'Perdu': { bg: '#753800', text: 'light' },
  'RDV Annulé': { bg: '#284E13', text: 'light' },
  'Opportunité Service Technique': { bg: '#3C78D8', text: 'light' },
  'À rappeler': { bg: '#B7D7A8', text: 'dark' },
  'Répondeur': { bg: '#E2E8F0', text: 'dark' },
  'Nouveau': { bg: '#3b82f6', text: 'light' },
};

const LeadList: React.FC<LeadListProps> = ({ leads, onSelectLead, onUpdateLead }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const itemsPerPage = 50;
  const listRef = useRef<HTMLDivElement>(null);

  const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && listRef.current && !listRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const parseDateToTimestamp = (dateStr?: any): number => {
    if (!dateStr) return 0;
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.getTime();
    if (typeof dateStr === 'string') {
      try {
        const parts = dateStr.trim().split(' ');
        const datePart = parts[0];
        const dateBits = datePart.split('/');
        if (dateBits.length === 3) {
          const day = parseInt(dateBits[0], 10);
          const month = parseInt(dateBits[1], 10);
          let year = parseInt(dateBits[2], 10);
          if (year < 100) year += 2000;
          return new Date(year, month - 1, day).getTime();
        }
      } catch (e) { return 0; }
    }
    return 0;
  };

  const formatDisplayDate = (dateStr?: any): string => {
    if (!dateStr) return '—';
    const timestamp = parseDateToTimestamp(dateStr);
    if (timestamp === 0) return String(dateStr).split(' ')[0];
    const d = new Date(timestamp);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const allFilteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];
    const filtered = leads.filter(lead => {
      const name = String(lead.fullName || lead.firstName || lead.lastName || '').toLowerCase();
      const phone = String(lead.phone || '').toLowerCase();
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = name.includes(search) || phone.includes(search);
      const matchesFilter = filterStatus === 'All' || lead.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
    return [...filtered].sort((a, b) => {
      const dateA = parseDateToTimestamp(a.dateEntry);
      const dateB = parseDateToTimestamp(b.dateEntry);
      return dateB - dateA;
    });
  }, [leads, searchTerm, filterStatus]);

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allFilteredLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [allFilteredLeads, currentPage]);

  const totalPages = Math.ceil(allFilteredLeads.length / itemsPerPage);

  return (
    <div className="flex flex-col w-full space-y-6" ref={listRef}>
      {/* Barre d'outils flottante */}
      <div className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4 pl-2">
          <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
            <i className="fas fa-database text-sm"></i>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Base Prospects</h2>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1.5">{allFilteredLeads.length} dossiers identifiés</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-1 justify-end">
          <div className="relative max-w-sm w-full">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-900"></i>
            <input 
              type="text" 
              placeholder="Rechercher un prospect..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-100/50 border border-slate-300 rounded-2xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-amber-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-6 py-3 bg-slate-100 border border-slate-300 rounded-2xl text-xs font-black uppercase tracking-tight text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">Filtre Statut</option>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Le Tableau */}
      <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/60 border border-slate-200 overflow-visible w-full">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse table-fixed lg:table-auto">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest w-[25%]">Prospect</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest w-[20%]">Coordonnées</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center w-[10%]">CP</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center w-[15%]">Contact</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest w-[20%]">Statut</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center w-[5%]">Note</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right w-[5%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 overflow-visible">
              {paginatedLeads.map((lead, idx) => {
                const config = STATUS_CONFIG[lead.status] || { bg: '#ffffff', text: 'dark' };
                const isLight = config.text === 'dark';
                const rowId = lead.id || `idx-${idx}`;
                const isOpen = activeDropdown === rowId;
                
                return (
                  <tr 
                    key={rowId}
                    style={{ backgroundColor: config.bg, zIndex: isOpen ? 50 : 0 }}
                    className={`group transition-all duration-200 hover:brightness-[0.98] relative`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className={`text-sm font-black tracking-tight leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || '—'}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                          {lead.source || 'Direct'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className={`text-sm font-black tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {lead.phone}
                        </span>
                        <span className={`text-[10px] font-black truncate max-w-[140px] mt-1 ${isLight ? 'text-slate-900' : 'text-white/80'}`}>
                          {lead.email || 'Pas d\'email'}
                        </span>
                      </div>
                    </td>
                    <td className={`px-8 py-5 text-center text-sm font-black tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {lead.postalCode}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${isLight ? 'text-slate-900' : 'text-white/90'}`}>
                        {formatDisplayDate(lead.dateContact)}
                      </span>
                    </td>
                    <td className="px-8 py-5 overflow-visible">
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(isOpen ? null : rowId);
                          }}
                          className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/5 transition-all flex items-center justify-between group/btn ${
                            isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-black/40 text-white'
                          } hover:scale-[1.01] active:scale-95`}
                        >
                          <span className="truncate">{lead.status}</span>
                          <i className={`fas fa-chevron-down ml-2 text-[8px] transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                        </button>

                        {isOpen && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 z-[9999] overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-150 origin-top">
                            {STATUS_OPTIONS.map(opt => {
                              const optConfig = STATUS_CONFIG[opt];
                              return (
                                <button
                                  key={opt}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateLead({ ...lead, status: opt });
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-5 py-3 flex items-center space-x-3 hover:bg-slate-50 transition-colors group/item"
                                >
                                  <div className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner shrink-0" style={{ backgroundColor: optConfig.bg }}></div>
                                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest group-hover/item:text-amber-600 transition-colors">{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      {lead.notes && lead.notes.length > 0 ? (
                        <button 
                          onClick={() => onSelectLead(lead)}
                          className={`w-10 h-10 rounded-xl transition-all ${isLight ? 'bg-slate-900/10 text-slate-900' : 'bg-white/20 text-white'} flex items-center justify-center hover:scale-110 active:scale-95`}
                        >
                          <i className="fas fa-comment-dots text-sm"></i>
                        </button>
                      ) : <span className={`opacity-20 font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>—</span>}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => onSelectLead(lead)}
                        className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${
                          isLight ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-white text-slate-900 shadow-white/20'
                        } hover:scale-110 active:scale-90 shadow-xl`}
                      >
                        <i className="fas fa-chevron-right text-xs"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Moderne */}
        <div className="p-8 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Affichage de 1 à {paginatedLeads.length}</span>
            <span className="text-xs font-black text-slate-900 mt-1">Total : {allFilteredLeads.length} dossiers</span>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-11 px-5 rounded-2xl bg-white border border-slate-300 text-slate-900 font-black text-xs uppercase tracking-widest hover:border-amber-600 hover:text-amber-600 disabled:opacity-30 transition-all flex items-center shadow-sm"
            >
              <i className="fas fa-arrow-left mr-3"></i> Précédent
            </button>
            <div className="px-5 py-2.5 bg-slate-900 rounded-2xl text-white text-xs font-black shadow-lg">
              PAGE {currentPage} / {totalPages || 1}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-11 px-5 rounded-2xl bg-white border border-slate-300 text-slate-900 font-black text-xs uppercase tracking-widest hover:border-amber-600 hover:text-amber-600 disabled:opacity-30 transition-all flex items-center shadow-sm"
            >
              Suivant <i className="fas fa-arrow-right ml-3"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadList;
