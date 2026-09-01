
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
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, collapsed, onToggle }) => {
  const menuStructure: MenuCategory[] = [
    {
      title: "Pilotage Stratégique",
      items: [
        { id: 'results', icon: 'fa-chart-pie', label: 'Tableau de bord' },
        { id: 'monthly', icon: 'fa-calendar-days', label: 'Analyse Mensuelle' },
      ]
    },
    {
      title: "Performance Équipe",
      items: [
        { id: 'sales_perf', icon: 'fa-user-tie', label: 'Force de Vente' },
      ]
    },
    {
      title: "Acquisition & Ads",
      items: [
        { id: 'posts', icon: 'fa-hashtag', label: 'Flux Social' },
      ]
    },
    {
      title: "Opérations Terrain",
      items: [
        { id: 'appointments', icon: 'fa-calendar-check', label: 'Agenda RDV' },
        { id: 'map', icon: 'fa-map-location-dot', label: 'Carte des Leads' },
      ]
    },
  ];

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-40 transition-all duration-300`}>

      {/* Bouton toggle — à cheval sur le bord droit */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center shadow-lg hover:bg-amber-500 hover:border-amber-500 transition-all duration-200 z-50"
      >
        <i className={`fas fa-chevron-${collapsed ? 'right' : 'left'} text-white text-[8px]`}></i>
      </button>

      {/* Logo */}
      <div className={`border-b border-slate-800 flex justify-center items-center shrink-0 overflow-hidden transition-all duration-300 ${collapsed ? 'p-4 h-16' : 'p-8 h-auto'}`}>
        {collapsed ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 244.06 378.91" className="h-8 w-auto">
            <g>
              <polygon fill="#fff" points="66.26 340.71 133.41 297.38 129.46 377.2 164 378.91 178.76 270.72 133.83 244.78 47.51 311.66 66.26 340.71"/>
              <polygon fill="#fff" points="0 152.97 71.1 189.46 0 225.95 15.79 256.71 116.87 215.4 116.87 163.51 15.79 122.2 0 152.97"/>
              <polygon fill="#fff" points="129.46 1.71 133.41 81.53 66.26 38.2 47.51 67.26 133.83 134.13 178.76 108.19 164 0 129.46 1.71"/>
            </g>
            <rect fill="#fff" x="37.33" y="172.19" width="378.91" height="34.53" transform="translate(37.33 416.25) rotate(-90)"/>
          </svg>
        ) : (
          <div className="h-12 flex items-center justify-center">
            <img
              src="https://www.rhonesolairepro.com/wp-content/uploads/2024/04/logo_rsp.svg"
              alt="Rhône Solaire Pro"
              className="h-full w-auto brightness-0 invert"
            />
          </div>
        )}
      </div>

      {/* Menu scrollable */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar overflow-x-hidden">
        {menuStructure.map((category, catIdx) => (
          <div key={catIdx} className="space-y-1">
            {!collapsed && (
              <h3 className="px-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">
                {category.title}
              </h3>
            )}
            {collapsed && catIdx > 0 && (
              <div className="mx-3 border-t border-slate-800 mb-2"></div>
            )}
            <div className={`space-y-1 ${collapsed ? 'px-2' : 'px-4'}`}>
              {category.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center transition-all duration-300 text-left group rounded-2xl ${
                    collapsed ? 'justify-center px-0 py-3' : 'space-x-4 px-6 py-3.5'
                  } ${
                    activeTab === item.id
                      ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`flex justify-center transition-colors ${collapsed ? 'w-full' : 'w-5'} ${activeTab === item.id ? 'text-white' : 'text-slate-600 group-hover:text-amber-500'}`}>
                    <i className={`fas ${item.icon} text-sm`}></i>
                  </div>
                  {!collapsed && (
                    <span className="font-bold text-[10px] uppercase tracking-premium leading-none whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-slate-800 shrink-0 ${collapsed ? 'p-3' : 'p-6'}`}>
        <div className={`flex items-center bg-white/5 rounded-xl border border-white/5 ${collapsed ? 'justify-center p-2 mb-2' : 'space-x-3 px-4 py-2 mb-3'}`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></div>
          {!collapsed && <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Système Connecté</span>}
        </div>
        {onLogout && !collapsed && (
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="font-bold text-[11px] uppercase tracking-widest">Déconnexion</span>
          </button>
        )}
        {onLogout && collapsed && (
          <button
            onClick={onLogout}
            title="Déconnexion"
            className="w-full flex justify-center py-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <i className="fas fa-sign-out-alt text-sm"></i>
          </button>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default Sidebar;
