
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Lead } from '../types';

interface GeoTargetingProps {
  leads: Lead[];
}

// URL du GeoJSON pour les départements français
const DEPARTMENTS_URL = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-avec-outre-mer.geojson';

// Coordonnées pour 23 Chemin de cornalon à décines
const SPECIAL_LOCATION: [number, number] = [45.765103, 4.960166];

const GeoTargeting: React.FC<GeoTargetingProps> = ({ leads }) => {
  const [deptGeoData, setDeptGeoData] = useState<any>(null);
  const [communesGeoData, setCommunesGeoData] = useState<Record<string, any>>({});
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
  const [selectedZips, setSelectedZips] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [importValue, setInputValue] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Initialisation : Chargement des départements
  useEffect(() => {
    fetch(DEPARTMENTS_URL)
      .then(res => res.json())
      .then(data => {
        setDeptGeoData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erreur départements:", err);
        setIsLoading(false);
      });
  }, []);

  // Heatmap : Calcul de la densité par département (2 chiffres) et par CP (5 chiffres)
  const stats = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    const zipCounts: Record<string, number> = {};
    leads.forEach(l => {
      const zip = String(l.postalCode || '').trim();
      const dCode = zip.substring(0, 2);
      if (dCode) deptCounts[dCode] = (deptCounts[dCode] || 0) + 1;
      if (zip.length === 5) zipCounts[zip] = (zipCounts[zip] || 0) + 1;
    });
    return { deptCounts, zipCounts };
  }, [leads]);

  // Chargement dynamique des communes d'un département quand on zoom dessus ou par import
  const loadCommunesForDept = async (deptCode: string) => {
    if (communesGeoData[deptCode]) return;
    try {
      const res = await fetch(`https://geo.api.gouv.fr/departements/${deptCode}/communes?format=geojson&geometry=contour`);
      const data = await res.json();
      setCommunesGeoData(prev => ({ ...prev, [deptCode]: data }));
    } catch (e) {
      console.error(`Erreur communes dept ${deptCode}:`, e);
    }
  };

  const toggleDept = (code: string) => {
    setSelectedDepts(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleZip = (zip: string) => {
    setSelectedZips(prev => {
      const next = new Set(prev);
      if (next.has(zip)) next.delete(zip);
      else next.add(zip);
      return next;
    });
  };

  // Traitement de l'import de liste
  const handleImport = async () => {
    const rawItems = importValue.split(/[\s,;]+/).map(i => i.trim()).filter(i => i.length > 0);
    const newDepts = new Set<string>();
    const newZips = new Set<string>();

    rawItems.forEach(item => {
      if (item.length === 2 || (item.length === 3 && item.startsWith('97'))) {
        newDepts.add(item);
      } else if (item.length === 5) {
        newZips.add(item);
        loadCommunesForDept(item.substring(0, 2));
      }
    });

    setSelectedDepts(new Set([...Array.from(selectedDepts), ...Array.from(newDepts)]));
    setSelectedZips(new Set([...Array.from(selectedZips), ...Array.from(newZips)]));
    setInputValue('');
    setShowImport(false);
  };

  // Styles pour les départements
  const deptStyle = (feature: any) => {
    const code = feature.properties.code;
    const isSelected = selectedDepts.has(code);
    const count = stats.deptCounts[code] || 0;
    
    return {
      fillColor: isSelected ? '#f59e0b' : (count > 100 ? '#94a3b8' : count > 20 ? '#cbd5e1' : '#f1f5f9'),
      fillOpacity: isSelected ? 0.8 : 0.6,
      weight: isSelected ? 3 : 1,
      color: isSelected ? '#fff' : '#cbd5e1',
      dashArray: isSelected ? '' : '3'
    };
  };

  // Styles pour les communes
  const communeStyle = (feature: any) => {
    const zipCandidates = feature.properties.codesPostaux || [];
    const isSelected = zipCandidates.some((z: string) => selectedZips.has(z));
    const firstZip = zipCandidates[0] || '';
    const count = stats.zipCounts[firstZip] || 0;

    return {
      fillColor: isSelected ? '#f59e0b' : (count > 20 ? '#94a3b8' : count > 5 ? '#cbd5e1' : '#fff'),
      fillOpacity: isSelected ? 0.9 : 0.4,
      weight: isSelected ? 2 : 0.5,
      color: isSelected ? '#fff' : '#cbd5e1'
    };
  };

  const generatedList = useMemo(() => {
    const depts = Array.from(selectedDepts);
    const zips = Array.from(selectedZips);
    return [...depts, ...zips].sort().join(', ');
  }, [selectedDepts, selectedZips]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedList);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const MapEvents = () => {
    const map = useMapEvents({
      zoomend: () => {
        const newZoom = map.getZoom();
        setZoomLevel(newZoom);
        if (newZoom >= 9) {
          deptGeoData?.features.forEach((f: any) => {
             if (selectedDepts.has(f.properties.code)) {
               loadCommunesForDept(f.properties.code);
             }
          });
        }
      }
    });
    
    useEffect(() => {
      map.invalidateSize();
    }, [map]);

    return null;
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement de la cartographie...</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in h-[75vh]">
      <div className="flex-1 bg-white rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col">
        {/* Overlay d'information */}
        <div className="absolute top-8 left-8 z-[1000] bg-white/90 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl border border-slate-100 pointer-events-none">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Ciblage Précis</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            {zoomLevel >= 10 ? 'Mode Code Postal (5 chiffres)' : 'Mode Département (2 chiffres)'}
          </p>
          <p className="text-[9px] font-bold text-amber-600 mt-2 italic">
            {zoomLevel < 10 ? 'Zoomez pour voir les détails ou utilisez l\'import' : 'Cliquez sur une commune pour l\'ajouter'}
          </p>
        </div>

        <div className="flex-1 w-full h-full min-h-0">
          <MapContainer 
            center={[45.75, 4.85]} 
            zoom={zoomLevel} 
            style={{ height: '100%', width: '100%', background: '#f8fafc' }}
            zoomControl={false}
            attributionControl={false}
          >
            <MapEvents />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            
            {/* Couche Départements */}
            {zoomLevel < 10 && deptGeoData && (
              <GeoJSON 
                key={`depts-${selectedDepts.size}-${selectedZips.size}`}
                data={deptGeoData} 
                style={deptStyle}
                onEachFeature={(feature, layer) => {
                  layer.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    toggleDept(feature.properties.code);
                  });
                  layer.bindTooltip(`<b>${feature.properties.code}</b> - ${feature.properties.nom}`, { sticky: true });
                }}
              />
            )}

            {/* Couches Communes */}
            {Object.entries(communesGeoData).map(([code, data]) => (
              <GeoJSON 
                key={`communes-${code}-${selectedZips.size}-${zoomLevel}`}
                data={data}
                style={communeStyle}
                onEachFeature={(feature, layer) => {
                  const zips = feature.properties.codesPostaux || [];
                  layer.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    if (zips.length > 0) toggleZip(zips[0]);
                  });
                  layer.bindTooltip(`<b>${zips.join(', ')}</b> - ${feature.properties.nom}`, { sticky: true });
                }}
              />
            ))}

            {/* Point Rouge Spécial (23 Chemin de Cornalon) - Placé en dernier pour être au dessus */}
            <CircleMarker 
              center={SPECIAL_LOCATION} 
              radius={8} 
              pathOptions={{ 
                fillColor: '#ef4444', 
                fillOpacity: 1, 
                color: '#fff', 
                weight: 3,
                className: 'special-marker' 
              }}
            >
              <Tooltip permanent direction="top" className="rounded-xl shadow-2xl border-none font-black text-[10px] uppercase">
                Siège RSP / Cornalon
              </Tooltip>
            </CircleMarker>
          </MapContainer>
        </div>
      </div>

      {/* Panneau latéral */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Configuration Ciblage</h4>
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowImport(!showImport)}
                className={`text-[9px] font-black uppercase tracking-widest transition-colors ${showImport ? 'text-amber-500' : 'text-slate-400 hover:text-white'}`}
              >
                {showImport ? 'Annuler' : 'Importer liste'}
              </button>
              <button 
                onClick={() => { setSelectedDepts(new Set()); setSelectedZips(new Set()); setCommunesGeoData({}); }}
                className="text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
              >
                Vider
              </button>
            </div>
          </div>

          {showImport ? (
            <div className="flex-1 bg-white/5 rounded-3xl p-6 border border-amber-500/30 mb-8 flex flex-col animate-in slide-in-from-top-2">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 italic">Collez vos codes (ex: 69, 38200, 75)</p>
              <textarea
                value={importValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ex: 69, 38200, 01, 75001..."
                className="flex-1 bg-transparent text-white text-sm font-bold border-none focus:ring-0 outline-none resize-none placeholder-slate-600"
              />
              <button
                onClick={handleImport}
                className="mt-4 w-full py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"
              >
                Visualiser la zone
              </button>
            </div>
          ) : (
            <div className="flex-1 bg-white/5 rounded-3xl p-6 border border-white/10 mb-8 overflow-y-auto max-h-[300px]">
              {selectedDepts.size > 0 || selectedZips.size > 0 ? (
                <div className="space-y-4">
                  {selectedDepts.size > 0 && (
                    <div>
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Départements ({selectedDepts.size})</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(selectedDepts).map(d => (
                          <span key={d} className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedZips.size > 0 && (
                    <div>
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Codes Postaux ({selectedZips.size})</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(selectedZips).map(z => (
                          <span key={z} className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold">{z}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <i className="fas fa-bullseye text-slate-700 text-3xl mb-4"></i>
                  <p className="text-[10px] font-black text-slate-500 uppercase leading-relaxed">
                    Importez une liste ou cliquez sur la carte pour définir votre zone
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-white/5 rounded-2xl mb-6 border border-white/5">
            <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-tight">Format Copié :</p>
            <p className="text-[10px] font-medium text-slate-500 break-all line-clamp-2 italic">
              {generatedList || "Aucune sélection..."}
            </p>
          </div>

          <button 
            disabled={!generatedList}
            onClick={handleCopy}
            className={`w-full py-5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-3 shadow-xl ${
              copySuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-amber-500 text-white hover:scale-[1.02] disabled:opacity-20 shadow-amber-500/20'
            }`}
          >
            {copySuccess ? <><i className="fas fa-check"></i><span>Copié !</span></> : <><i className="fas fa-copy"></i><span>Copier pour Meta Ads</span></>}
          </button>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads dans la zone</p>
              <i className="fas fa-users text-slate-200"></i>
           </div>
           <h3 className="text-4xl font-black text-slate-900 tabular-nums">
             {/* Use explicit number type for reduce and ensure operands are treated as numbers */}
             {Array.from(selectedDepts).reduce<number>((acc, code) => acc + (Number(stats.deptCounts[code]) || 0), 0) + 
              Array.from(selectedZips).reduce<number>((acc, zip) => acc + (Number(stats.zipCounts[zip]) || 0), 0)}
           </h3>
           <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Volume historique RSP identifié</p>
        </div>
      </div>
      
      <style>{`
        .special-marker {
          z-index: 999 !important;
          filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.5));
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { stroke-width: 3; stroke-opacity: 1; }
          50% { stroke-width: 8; stroke-opacity: 0.5; }
          100% { stroke-width: 3; stroke-opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default GeoTargeting;
