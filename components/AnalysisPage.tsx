
import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import ResultsAnalysis from './ResultsAnalysis';
import CreativeAnalysis from './CreativeAnalysis';
import SourceAnalysis from './SourceAnalysis';
import DateRangePicker from './DateRangePicker';
import { fetchFacebookAdsPerformance, FacebookAdsData } from '../services/facebookAdsService';
import { fetchGoogleAdsPerformance, GoogleAdsData } from '../services/googleAdsService';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

interface AnalysisPageProps {
  leads: Lead[];
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ leads }) => {
  const [subTab, setSubTab] = useState<'results' | 'creatives' | 'sources'>('results');
  
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [fbData, setFbData] = useState<FacebookAdsData | null>(null);
  const [googleData, setGoogleData] = useState<GoogleAdsData | null>(null);

  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        const [fb, g] = await Promise.all([
          fetchFacebookAdsPerformance(startDate, endDate),
          fetchGoogleAdsPerformance(SCRIPT_URL, startDate, endDate)
        ]);
        setFbData(fb);
        setGoogleData(g);
      } catch (error) {
        console.error("Error loading performance data in AnalysisPage:", error);
      }
    };
    loadPerformanceData();
  }, [startDate, endDate]);

  const tabs = [
    { id: 'results', label: 'Résultats', icon: 'fa-chart-line' },
    { id: 'creatives', label: 'Créatives', icon: 'fa-ad' },
    { id: 'sources', label: 'Sources', icon: 'fa-layer-group' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm ${
                subTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <i className={`fas ${tab.icon} text-xs`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <DateRangePicker 
            startDate={startDate} 
            endDate={endDate} 
            onRangeChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }} 
          />
        </div>
      </div>

      <div className="min-h-[60vh]">
        {subTab === 'results' && (
          <ResultsAnalysis 
            leads={leads} 
            startDate={startDate} 
            endDate={endDate} 
            fbData={fbData}
            gData={googleData}
          />
        )}
        {subTab === 'creatives' && (
          <CreativeAnalysis 
            leads={leads} 
            startDate={startDate} 
            endDate={endDate} 
          />
        )}
        {subTab === 'sources' && (
          <SourceAnalysis 
            leads={leads} 
            startDate={startDate} 
            endDate={endDate} 
          />
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
