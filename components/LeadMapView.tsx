
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, CircleMarker, Tooltip as LeafletTooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Lead } from '../types';

interface LeadMapViewProps {
  leads: Lead[];
  startDate: string;
  endDate: string;
}

const CACHE_KEY = 'rsp_geo_cache_v2';
const getGeoCache = (): Record<string, [number, number]> => {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
};

const setGeoCache = (coords: Record<string, [number, number]>) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(coords));
  } catch (e) {}
};

// CONVERTIT TOUTE DATE EN NOMBRE YYYYMMDD (Timezone Proof) - UNIFIÉ
const dateToNum = (dateVal: any): number => {
  if (!dateVal) return 0;
  let str = String(dateVal).trim();
  if (!str) return 0;
  if (str.includes('T')) str = str.split('T')[0];
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    return year * 10000 + month * 100 + day;
  }
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return parseInt(isoMatch[1]) * 10000 + parseInt(isoMatch[2]) * 100 + parseInt(isoMatch[3]);
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return 0;
};

const MapStateController = ({ coords, leadsCount }: { coords: Record<string, [number, number]>, leadsCount: number }) => {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    const points = Object.values(coords);
    if (points.length > 0 && !hasCentered.current && leadsCount > 0) {
      const bounds = L.latLngBounds(points as L.LatLngExpression[]);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 10 });
      hasCentered.current = true;
    }
  }, [coords, map, leadsCount]);

  return null;
};

const LeadMapView: React.FC<LeadMapViewProps> = ({ leads, startDate, endDate }) => {
  const [coords, setCoords] = useState<Record<string, [number, number]>>(getGeoCache());
  const [zoomLevel, setZoomLevel] = useState(8);
  const [progress, setProgress] = useState(0);

  const filteredLeads = useMemo(() => {
    const sLimit = dateToNum(startDate);
    const eLimit = dateToNum(endDate);
    return leads.filter(l => {
      const n = dateToNum(l.dateEntry);
      return n >= sLimit && n <= eLimit;
    });
  }, [leads, startDate, endDate]);

  const uniqueCPs = useMemo(() => {
    return Array.from(new Set(filteredLeads.map(l => String(l.postalCode || '').trim()).filter(cp => cp.length >= 4)));
  }, [filteredLeads]);

  useEffect(() => {
    let isMounted = true;
    const geocodeAll = async () => {
      const newCoords = { ...coords };
      const toGeocode = uniqueCPs.filter(cp => !newCoords[cp]);
      
      if (toGeocode.length === 0) {
        setProgress(100);
        return;
      }

      const batchSize = 10;
      for (let i = 0; i < toGeocode.length; i += batchSize) {
        if (!isMounted) break;
        const batch = toGeocode.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (cp) => {
          try {
            const resp = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${cp}&type=municipality&limit=1`);
            const data = await resp.json();
            if (data.features?.[0]) {
              const [lng, lat] = data.features[0].geometry.coordinates;
              newCoords[cp] = [lat, lng];
            }
          } catch (e) {
            console.warn(`Erreur geocoding pour ${cp}:`, e);
          }
        }));

        if (isMounted) {
          setCoords({ ...newCoords });
          setGeoCache(newCoords);
          setProgress(Math.round(((i + batch.length) / toGeocode.length) * 100));
        }
        // Petit délai pour respecter les limites d'API
        await new Promise(r => setTimeout(r, 100));
      }
    };
    geocodeAll();
    return () => { isMounted = false; };
  }, [uniqueCPs]);

  const clusters = useMemo(() => {
    const results: any[] = [];
    const groupedLeads: Record<string, Lead[]> = {};

    filteredLeads.forEach(l => {
      const cp = String(l.postalCode || '').trim();
      if (!groupedLeads[cp]) groupedLeads[cp] = [];
      groupedLeads[cp].push(l);
    });

    Object.entries(groupedLeads).forEach(([cp, leadsInCP]) => {
      const pos = coords[cp];
      if (!pos) return;

      const rdv = leadsInCP.filter(l => ['RDV Fixé', 'Opportunité Commerce', 'Parrainage'].includes(l.status)).length;
      const sales = leadsInCP.filter(l => l.salesStatus === 'Vendu' || l.salesStatus === 'Installé').length;
      
      results.push({
        id: cp,
        center: [...pos],
        total: leadsInCP.length,
        rdv,
        sales,
        code: cp.substring(0, 2)
      });
    });

    return results;
  }, [filteredLeads, coords]);

  return (
    <div className="bg-white rounded-[40px] p-2 shadow-sm border border-slate-100 h-[78vh] min-h-[600px] relative overflow-hidden flex flex-col animate-fade-in">
      {/* Panneau d'information flottant */}
      <div className="absolute top-8 left-8 z-[1000] w-64 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl border border-slate-100 pointer-events-auto">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Répartition Géo</h3>
          
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads Filtrés</span>
              <span className="text-sm font-black text-slate-900">{filteredLeads.length}</span>
            </div>

            {progress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase text-amber-600">
                  <span>Géolocalisation...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase">Secteurs</span>
                <span className="text-xs font-black text-slate-900">{clusters.length} zones</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-[32px] overflow-hidden bg-slate-50">
        <MapContainer 
          center={[45.75, 4.85]} 
          zoom={8} 
          style={{ height: '100%', width: '100%' }} 
          zoomControl={false} 
          attributionControl={false}
        >
          <MapStateController coords={coords} leadsCount={filteredLeads.length} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <ZoomControl position="bottomright" />

          {clusters.map(c => {
            const rateRdv = c.total > 0 ? (c.rdv / c.total) * 100 : 0;
            return (
              <CircleMarker
                key={c.id}
                center={c.center}
                radius={8 + Math.sqrt(c.total) * 5}
                pathOptions={{
                  fillColor: rateRdv > 20 ? '#10b981' : rateRdv > 10 ? '#f59e0b' : '#3b82f6',
                  fillOpacity: 0.7,
                  color: 'white',
                  weight: 2
                }}
              >
                <LeafletTooltip sticky direction="top" className="custom-tooltip">
                  <div className="p-3 min-w-[160px]">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.id}</span>
                      <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded uppercase">Dépt {c.code}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Prospects</span>
                        <span className="text-xs font-black text-slate-900">{c.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-amber-600 uppercase">RDV Fixés</span>
                        <span className="text-xs font-black text-amber-600">{c.rdv}</span>
                      </div>
                      {c.sales > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">Ventes</span>
                          <span className="text-xs font-black text-emerald-600">{c.sales}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </LeafletTooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <style>{`
        .custom-tooltip { 
          background: white !important; 
          border: none !important; 
          border-radius: 20px !important; 
          box-shadow: 0 15px 40px -10px rgba(0,0,0,0.15) !important; 
          padding: 0 !important; 
        }
        .leaflet-container { 
          font-family: 'Outfit', sans-serif !important; 
        }
      `}</style>
    </div>
  );
};

export default LeadMapView;
