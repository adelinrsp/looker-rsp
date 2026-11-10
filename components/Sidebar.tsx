
import React from 'react';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
}

interface MenuCategory {
  items: MenuItem[];
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuCategories: MenuCategory[] = [
    {
      items: [
        { id: 'results',      icon: 'fa-chart-pie',         label: 'Tableau de bord' },
        { id: 'monthly',      icon: 'fa-calendar-days',     label: 'Analyse Mensuelle' },
      ]
    },
    {
      items: [
        { id: 'sales_perf',   icon: 'fa-user-tie',          label: 'Force de Vente' },
      ]
    },
    {
      items: [
        { id: 'posts',        icon: 'fa-hashtag',           label: 'Flux Social' },
      ]
    },
    {
      items: [
        { id: 'appointments', icon: 'fa-calendar-check',    label: 'Agenda RDV' },
        { id: 'map',          icon: 'fa-map-location-dot',  label: 'Carte des Leads' },
      ]
    },
  ];

  return (
    <div className="fixed left-4 top-4 bottom-4 z-40 flex flex-col w-16 bg-slate-900 rounded-3xl shadow-2xl shadow-black/40">

      {/* Logo */}
      <div className="flex items-center justify-center pt-5 pb-4 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 244.06 378.91" className="h-7 w-auto">
          <g>
            <polygon fill="#fff" points="66.26 340.71 133.41 297.38 129.46 377.2 164 378.91 178.76 270.72 133.83 244.78 47.51 311.66 66.26 340.71"/>
            <polygon fill="#fff" points="0 152.97 71.1 189.46 0 225.95 15.79 256.71 116.87 215.4 116.87 163.51 15.79 122.2 0 152.97"/>
            <polygon fill="#fff" points="129.46 1.71 133.41 81.53 66.26 38.2 47.51 67.26 133.83 134.13 178.76 108.19 164 0 129.46 1.71"/>
          </g>
          <rect fill="#fff" x="37.33" y="172.19" width="378.91" height="34.53" transform="translate(37.33 416.25) rotate(-90)"/>
        </svg>
      </div>

      <div className="mx-3 border-t border-white/5 mb-4" />

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1 px-2 overflow-y-auto overflow-x-visible">
        {menuCategories.map((cat, catIdx) => (
          <React.Fragment key={catIdx}>
            {catIdx > 0 && <div className="w-6 border-t border-white/5 my-1" />}
            {cat.items.map((item) => (
              <div key={item.id} className="relative group w-full">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-center rounded-2xl py-3 transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                      : 'text-slate-500 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <i className={`fas ${item.icon} text-[15px]`}></i>
                </button>
                {activeTab === item.id && (
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50" />
                )}
                {/* Tooltip */}
                <div className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                  <div className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap px-3 py-1.5 rounded-xl shadow-xl border border-white/5">
                    {item.label}
                  </div>
                  {/* Arrow */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="mx-3 border-t border-white/5 mt-4" />

      {/* Footer */}
      <div className="flex flex-col items-center gap-2 py-4 px-2 shrink-0">
        {/* Status */}
        <div className="relative group w-full">
          <div className="flex items-center justify-center py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            <div className="bg-slate-800 text-emerald-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap px-3 py-1.5 rounded-xl shadow-xl border border-white/5">
              Connecté
            </div>
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
          </div>
        </div>

        {/* Logout */}
        {onLogout && (
          <div className="relative group w-full">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center rounded-2xl py-2.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <i className="fas fa-sign-out-alt text-[14px]" />
            </button>
            <div className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
              <div className="bg-slate-800 text-red-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap px-3 py-1.5 rounded-xl shadow-xl border border-white/5">
                Déconnexion
              </div>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
