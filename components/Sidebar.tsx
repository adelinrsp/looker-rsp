
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'results', icon: 'fa-chart-pie', label: 'Analyse générale' },
    { id: 'expenses', icon: 'fa-wallet', label: 'Dépenses' },
    { id: 'creatives', icon: 'fa-ad', label: 'Créatives Ads' },
    { id: 'posts', icon: 'fa-hashtag', label: 'Posts Natifs' },
    { id: 'sources', icon: 'fa-layer-group', label: 'Sources' },
    { id: 'map', icon: 'fa-map-location-dot', label: 'Carte Leads' },
    { id: 'targeting', icon: 'fa-bullseye', label: 'Ciblage Ads' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-40">
      {/* Logo centré */}
      <div className="p-10 border-b border-slate-800 flex justify-center items-center">
        <div className="h-14 flex items-center justify-center">
          <img 
            src="https://www.rhonesolairepro.com/wp-content/uploads/2024/04/logo_rsp.svg" 
            alt="Rhône Solaire Pro" 
            className="h-full w-auto brightness-0 invert" 
          />
        </div>
      </div>
      
      {/* Menu avec texte aligné à gauche */}
      <nav className="flex-1 mt-10 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 text-left ${
              activeTab === item.id 
                ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="w-5 flex justify-center">
              <i className={`fas ${item.icon} text-sm`}></i>
            </div>
            <span className="font-bold text-[11px] uppercase tracking-premium leading-none">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
