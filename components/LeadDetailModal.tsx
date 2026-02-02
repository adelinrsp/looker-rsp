
import React, { useState } from 'react';
import { Lead } from '../types';

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onUpdate }) => {
  const [newNote, setNewNote] = useState('');
  const [status, setStatus] = useState<string>(lead.status);

  const handleSaveNote = () => {
    if (!newNote.trim()) return;
    const updatedLead: Lead = {
      ...lead,
      notes: [...lead.notes, newNote.trim()],
    };
    onUpdate(updatedLead);
    setNewNote('');
  };

  const handleUpdateStatus = (newStatus: string) => {
    setStatus(newStatus);
    const updatedLead: Lead = {
      ...lead,
      status: newStatus,
    };
    onUpdate(updatedLead);
  };

  const handleConvert = () => {
    handleUpdateStatus('Opportunité Commerce');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
        
        {/* Header Ultra-Clean */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 bg-slate-100 rounded-[22px] flex items-center justify-center text-slate-900 shadow-inner">
              <i className="fas fa-user text-2xl"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">
                {lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Prospect Anonyme'}
              </h2>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-amber-500/20">
                  {status}
                </span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  ID: {lead.id} • {lead.source}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-2xl flex items-center justify-center transition-all group"
          >
            <i className="fas fa-times text-slate-900 group-hover:rotate-90 transition-transform"></i>
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-10 bg-slate-50/30">
          
          {/* Colonne Gauche : Données Techniques & Contact */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Cartes de Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-amber-500 transition-colors">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                  <i className="fas fa-phone mr-2 text-amber-500"></i> Téléphone
                </p>
                <p className="text-xl font-black text-slate-900 tabular-nums">{lead.phone || '—'}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-amber-500 transition-colors">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                  <i className="fas fa-envelope mr-2 text-amber-500"></i> Email
                </p>
                <p className="text-sm font-black text-slate-900 truncate">{lead.email || 'Pas d\'email'}</p>
              </div>
            </div>

            {/* Fiche Technique Maison */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                Configuration Technique
              </h4>
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Toiture</p>
                  <p className="text-lg font-black text-slate-900">{lead.roofArea || '—'} <span className="text-xs">m²</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Facture Mensuelle</p>
                  <p className="text-lg font-black text-slate-900">{lead.monthlyBill || '—'} <span className="text-xs">€</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Localisation</p>
                  <p className="text-lg font-black text-slate-900">{lead.postalCode || '—'}</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Adresse Complète</p>
                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  {lead.address || 'Adresse non renseignée'}
                </p>
              </div>
            </div>

            {/* Historique des notes (Timeline) */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest pl-2">Fil d'activité</h4>
              <div className="space-y-3">
                {lead.notes.length > 0 ? (
                  [...lead.notes].reverse().map((note, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex space-x-4 animate-in slide-in-from-left-2 duration-300">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[10px] font-black text-slate-900">
                        N
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed">{note}</p>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-100/50 border border-dashed border-slate-300 rounded-3xl p-10 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aucun historique disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne Droite : Actions de Pilotage */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Actions Rapides */}
            <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Actions de contact</h4>
              
              <a 
                href={`tel:${lead.phone}`}
                className="flex items-center justify-between w-full p-5 bg-emerald-500 hover:bg-emerald-600 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <i className="fas fa-phone-alt"></i>
                  </div>
                  <span className="text-sm font-black text-white uppercase tracking-widest">Appel Rapide</span>
                </div>
                <i className="fas fa-arrow-right text-white/50 group-hover:translate-x-1 transition-transform"></i>
              </a>

              <a 
                href={`mailto:${lead.email}`}
                className="flex items-center justify-between w-full p-5 bg-blue-500 hover:bg-blue-600 rounded-2xl transition-all shadow-lg shadow-blue-500/20 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <span className="text-sm font-black text-white uppercase tracking-widest">Envoyer un mail</span>
                </div>
                <i className="fas fa-arrow-right text-white/50 group-hover:translate-x-1 transition-transform"></i>
              </a>

              <button 
                onClick={handleConvert}
                className="flex items-center justify-between w-full p-5 bg-amber-500 hover:bg-amber-600 rounded-2xl transition-all shadow-lg shadow-amber-500/20 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <i className="fas fa-star"></i>
                  </div>
                  <span className="text-sm font-black text-white uppercase tracking-widest">Passer en Opportunité</span>
                </div>
                <i className="fas fa-bolt text-white group-hover:scale-125 transition-transform"></i>
              </button>
            </div>

            {/* Gestion du Statut & Notes */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Changer le statut manuel</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Nouveau', 'À rappeler', 'Répondeur', 'Injoignable', 'Perdu', 'RDV Fixé'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleUpdateStatus(opt)}
                      className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        status === opt 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                        : 'bg-white text-slate-900 border-slate-200 hover:border-amber-500'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Ajouter un commentaire</label>
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Tapez le compte-rendu d'appel ici..."
                  className="w-full h-32 p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                ></textarea>
                <button 
                  onClick={handleSaveNote}
                  disabled={!newNote.trim()}
                  className="w-full mt-4 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-20 transition-all shadow-xl shadow-slate-900/20"
                >
                  Ajouter à l'historique
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] hover:text-slate-900 transition-colors"
            >
              Fermer la fiche prospect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
