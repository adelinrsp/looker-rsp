
import React from 'react';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuStructure: MenuCategory[] = [
    {
      title: "Pilotage Stratégique",
      items: [
        { id: 'results', icon: 'fa-chart-pie', label: 'Tableau de bord' },
      ]
    },
    {
      title: "Performance Équipe",
      items: [
        { id: 'telepro_perf', icon: 'fa-headset', label: 'Téléprospection' },
        { id: 'sales_perf', icon: 'fa-user-tie', label: 'Force de Vente' },
      ]
    },
    {
      title: "Acquisition & Ads",
      items: [
        { id: 'sources', icon: 'fa-layer-group', label: 'Sources de trafic' },
        { id: 'targeting', icon: 'fa-bullseye', label: 'Ciblage Géo' },
        { id: 'creatives', icon: 'fa-ad', label: 'Créatives Ads' },
        { id: 'posts', icon: 'fa-hashtag', label: 'Flux Social' },
      ]
    },
    {
      title: "Opérations Terrain",
      items: [
        { id: 'appointments', icon: 'fa-calendar-check', label: 'Agenda RDV' },
        { id: 'map', icon: 'fa-map-location-dot', label: 'Carte des Leads' },
        { id: 'questionnaires', icon: 'fa-clipboard-question', label: 'Audits & Questionnaires' },
      ]
    },
    {
      title: "Gestion",
      items: [
        { id: 'expenses', icon: 'fa-wallet', label: 'Dépenses Structure' },
      ]
    }
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-40">
      {/* Logo centré */}
      <div className="p-8 border-b border-slate-800 flex justify-center items-center shrink-0">
        <div className="h-12 flex items-center justify-center">
          <img 
            src="https://www.rhonesolairepro.com/wp-content/uploads/2024/04/logo_rsp.svg" 
            alt="Rhône Solaire Pro" 
            className="h-full w-auto brightness-0 invert" 
          />
        </div>
      </div>
      
      {/* Menu scrollable */}
      <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-8 custom-scrollbar">
        {menuStructure.map((category, catIdx) => (
          <div key={catIdx} className="space-y-2">
            <h3 className="px-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4">
              {category.title}
            </h3>
            <div className="space-y-1">
              {category.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-4 px-6 py-3.5 rounded-2xl transition-all duration-300 text-left group ${
                    activeTab === item.id 
                      ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`w-5 flex justify-center transition-colors ${activeTab === item.id ? 'text-white' : 'text-slate-600 group-hover:text-amber-500'}`}>
                    <i className={`fas ${item.icon} text-sm`}></i>
                  </div>
                  <span className="font-bold text-[10px] uppercase tracking-premium leading-none">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer simple */}
      <div className="p-6 border-t border-slate-800 shrink-0">
        <div className="flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Système Connecté</span>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="font-bold text-[11px] uppercase tracking-widest">Déconnexion</span>
          </button>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
