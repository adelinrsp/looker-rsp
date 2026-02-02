
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, CircleMarker, Tooltip as LeafletTooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Lead } from '../types';

interface LeadMapViewProps {
  leads: Lead[];
  startDate: string;
  endDate: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Nouveau': '#3b82f6',
  'À rappeler': '#b7d7a8',
  'En cours': '#6366f1',
  'RDV Fixé': '#10b981',
  'Opportunité Commerce': '#76F475',
  'Parrainage': '#76F475',
  'Injoignable': '#94a3b8',
  'Perdu': '#753800',
  'RDV Annulé': '#284e13',
  'Répondeur': '#cbd5e1',
};

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

const parseDate = (dateStr?: string) => {
  if (!dateStr) return 0;
  const parts = dateStr.split(' ')[0].split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day).getTime();
  }
  return new Date(dateStr).getTime();
};

const MapStateController = ({ onZoomChange, coords, leadsCount }: { onZoomChange: (zoom: number) => void, coords: any, leadsCount: number }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map]);

  useMapEvents({ zoomend: () => onZoomChange(map.getZoom()) });

  const hasCentered = useRef(false);
  useEffect(() => {
    const points = Object.values(coords);
    if (points.length > 10 && !hasCentered.current && leadsCount > 0) {
      const bounds = L.latLngBounds(points as L.LatLngExpression[]);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 9 });
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
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;
    return leads.filter(l => {
      const entryTime = parseDate(l.dateEntry);
      return entryTime >= start && entryTime <= end;
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

      const batchSize = 40;
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
          } catch {}
        }));

        if (isMounted) {
          setCoords({ ...newCoords });
          setGeoCache(newCoords);
          setProgress(Math.round(((i + batch.length) / toGeocode.length) * 100));
        }
        await new Promise(r => setTimeout(r, 40));
      }
    };
    geocodeAll();
    return () => { isMounted = false; };
  }, [uniqueCPs]);

  const clusters = useMemo(() => {
    let threshold = 0.5; 
    if (zoomLevel >= 9) threshold = 0.2;
    if (zoomLevel >= 11) threshold = 0.05;
    if (zoomLevel >= 12) threshold = 0.01;

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

      let target = results.find(c => {
        const d = Math.sqrt(Math.pow(c.center[0] - pos[0], 2) + Math.pow(c.center[1] - pos[1], 2));
        return d < threshold;
      });

      if (target) {
        target.total += leadsInCP.length;
        leadsInCP.forEach(l => {
          if (['RDV Fixé', 'Opportunité Commerce', 'Parrainage'].includes(l.status)) target.rdv++;
          if (l.salesStatus === 'Vendu' || l.salesStatus === 'Installé') target.sales++;
          target.codes.add(cp.substring(0, 2));
        });
      } else {
        const rdv = leadsInCP.filter(l => ['RDV Fixé', 'Opportunité Commerce', 'Parrainage'].includes(l.status)).length;
        const sales = leadsInCP.filter(l => l.salesStatus === 'Vendu' || l.salesStatus === 'Installé').length;
        results.push({
          id: cp,
          center: [...pos],
          total: leadsInCP.length,
          rdv,
          sales,
          codes: new Set([cp.substring(0, 2)])
        });
      }
    });

    return results.map(c => ({
      ...c,
      rateRdv: (c.rdv / c.total) * 100,
      label: `Secteur ${Array.from(c.codes).join('/')}`
    }));
  }, [filteredLeads, coords, zoomLevel]);

  return (
    <div className="bg-white rounded-[40px] p-2 shadow-sm border border-slate-100 h-[78vh] min-h-[600px] relative overflow-hidden flex flex-col">
      <div className="absolute top-6 left-6 z-[1000] w-64 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[28px] shadow-2xl border border-slate-100/50 pointer-events-auto">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Répartition Géo</h3>
          
          {progress < 100 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[9px] font-black uppercase text-amber-600">
                <span>Calcul des positions</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div><div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mb-1"></div><span className="text-[8px] font-bold text-slate-400">Normal</span></div>
            <div><div className="w-2 h-2 bg-amber-500 rounded-full mx-auto mb-1"></div><span className="text-[8px] font-bold text-slate-400">Bon</span></div>
            <div><div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto mb-1"></div><span className="text-[8px] font-bold text-slate-400">Elite</span></div>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-[32px] overflow-hidden bg-slate-50">
        <MapContainer 
          center={[45.75, 4.85]} 
          zoom={8} 
          style={{ height: '100%' }} 
          zoomControl={false} 
          attributionControl={false}
        >
          <MapStateController onZoomChange={setZoomLevel} coords={coords} leadsCount={filteredLeads.length} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <ZoomControl position="bottomright" />

          {clusters.map(c => (
            <CircleMarker
              key={c.id}
              center={c.center}
              radius={10 + Math.sqrt(c.total) * 4}
              pathOptions={{
                fillColor: c.rateRdv > 20 ? '#10b981' : c.rateRdv > 10 ? '#f59e0b' : '#3b82f6',
                fillOpacity: 0.8,
                color: 'white',
                weight: 2
              }}
            >
              <LeafletTooltip sticky direction="top" className="custom-tooltip">
                <div className="p-3 min-w-[180px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-2">{c.label}</p>
                  <p className="text-sm font-black text-slate-900 mb-2">{c.total} Prospects</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <div className="text-amber-600">RDV: {c.rdv}</div>
                    <div className="text-emerald-600">Ventes: {c.sales}</div>
                  </div>
                </div>
              </LeafletTooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <style>{`
        .custom-tooltip { background: white !important; border: none !important; border-radius: 20px !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; padding: 0 !important; }
      `}</style>
    </div>
  );
};

export default LeadMapView;
