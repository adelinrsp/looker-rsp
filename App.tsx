
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import ResultsAnalysis from './components/ResultsAnalysis';
import CreativeAnalysis from './components/CreativeAnalysis';
import SourceAnalysis from './components/SourceAnalysis';
import ExpenseAnalysis from './components/ExpenseAnalysis';
import LeadMapView from './components/LeadMapView';
import LeadDetailModal from './components/LeadDetailModal';
import ChatBot from './components/ChatBot';
import DateRangePicker from './components/DateRangePicker';
import GeoTargeting from './components/GeoTargeting';
import FacebookPosts from './components/FacebookPosts';
import AppointmentCalendar from './components/AppointmentCalendar';
import QuestionnaireView from './components/QuestionnaireView';
import SalesPerformanceAnalysis from './components/SalesPerformanceAnalysis';
import TeleproPerformance from './components/TeleproPerformance';
import { Lead, CompanyExpense, ClientDiscovery, SocialQuestionnaire } from './types';
import * as googleService from './services/googleSheetsService';
import { fetchFacebookAdsPerformance, fetchFacebookCreativesPerformance, FacebookAdsData, FacebookCreativeData } from './services/facebookAdsService';
import { fetchGoogleAdsPerformance, GoogleAdsData } from './services/googleAdsService';

// Ancienne URL pour les leads et dépenses
const LEADS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzrJZso0q9OdL2XTeCT3pLtDh7JqF349JJIAmRcrrLvl1z2XWHIi-78ygIX76SwhIiixw/exec';
// Nouvelle URL pour les questionnaires (Mise à jour avec l'URL correcte)
const QUESTIONNAIRE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw9QV5ZqVkqrEAC2jB91knBBCsii6CR3Kur9-qolHmpYY6BWvNfR_cJnDPN40ppO-mO7w/exec';

export type AnalysisCategory = 'all' | 'commerce' | 'technique';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('results');
  const [analysisCategory, setAnalysisCategory] = useState<AnalysisCategory>('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
  const [discovery, setDiscovery] = useState<ClientDiscovery[]>([]);
  const [socialQuestionnaire, setSocialQuestionnaire] = useState<SocialQuestionnaire[]>([]);
  const [fbData, setFbData] = useState<FacebookAdsData | null>(null);
  const [googleData, setGoogleData] = useState<GoogleAdsData | null>(null);
  const [creatives, setCreatives] = useState<FacebookCreativeData[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getDefaultDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return {
      start: `${year}-${month}-01`,
      end: `${year}-${month}-${day}`
    };
  };

  const initialDates = getDefaultDates();
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);

  useEffect(() => {
    const token = localStorage.getItem('crm_auth_token');
    setIsAuthenticated(!!token);
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    initApp();
  }, [startDate, endDate]);

  const initApp = async () => {
    setIsLoading(true);
    try {
      // On utilise les deux URLs distinctes selon le type de données
      const [leadsData, fbPerf, googlePerf, creativesData, expensesData, discoveryData, socialData] = await Promise.all([
        googleService.fetchLeads(LEADS_SCRIPT_URL),
        fetchFacebookAdsPerformance(startDate, endDate),
        fetchGoogleAdsPerformance(LEADS_SCRIPT_URL, startDate, endDate),
        fetchFacebookCreativesPerformance(startDate, endDate),
        googleService.fetchExpenses(LEADS_SCRIPT_URL),
        googleService.fetchDiscovery(QUESTIONNAIRE_SCRIPT_URL),
        googleService.fetchSocialQuestionnaire(QUESTIONNAIRE_SCRIPT_URL)
      ]);
      setLeads(leadsData);
      setFbData(fbPerf);
      setGoogleData(googlePerf);
      setCreatives(creativesData);
      setExpenses(expensesData);
      setDiscovery(discoveryData);
      setSocialQuestionnaire(socialData);
    } catch (error) {
      console.error('Erreur initialisation App:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    if (updatedLead.rowIndex) {
      try {
        await googleService.updateLead(LEADS_SCRIPT_URL, updatedLead);
      } catch (error) {
        console.error("Erreur sync lead:", error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('crm_auth_token');
    setIsAuthenticated(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold">Vérification...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 ml-64 p-8 xl:p-12">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-end space-x-10">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                 <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg tracking-premium">Console Pilotage</span>
              </div>
              <h1 className="text-5xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
                {activeTab === 'results' ? 'Performance Globale' : 
                 activeTab === 'telepro_perf' ? 'Performance Téléprospection' :
                 activeTab === 'sales_perf' ? 'Analyse Commerciale' :
                 activeTab === 'questionnaires' ? 'Questionnaires Clients' :
                 activeTab === 'appointments' ? 'Agenda Commercial' :
                 activeTab === 'expenses' ? 'Dépenses Hors SEA' :
                 activeTab === 'creatives' ? 'Analyse Créatives' : 
                 activeTab === 'posts' ? 'Flux Natif Rhône Solaire' :
                 activeTab === 'sources' ? 'Sources de Trafic' : 
                 activeTab === 'targeting' ? 'Ciblage Meta Ads' : 'Géolocalisation Leads'}
              </h1>
            </div>

            {activeTab === 'results' && !isLoading && (
              <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 inline-flex space-x-1 mb-1 animate-in fade-in slide-in-from-left-4 duration-500">
                <button 
                  onClick={() => setAnalysisCategory('all')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${analysisCategory === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Tous
                </button>
                <button 
                  onClick={() => setAnalysisCategory('commerce')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${analysisCategory === 'commerce' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Commerce
                </button>
                <button 
                  onClick={() => setAnalysisCategory('technique')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${analysisCategory === 'technique' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Technique
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
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
        </header>

        <div className="w-full max-w-[1920px] mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="w-16 h-16 border-[6px] border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-slate-400 font-bold uppercase tracking-premium text-[11px] animate-pulse">Analyse Rhône Solaire en cours...</p>
            </div>
          ) : (
            <>
              {activeTab === 'results' && (
                <ResultsAnalysis 
                  leads={leads} 
                  startDate={startDate} 
                  endDate={endDate} 
                  fbData={fbData} 
                  gData={googleData} 
                  companyExpenses={expenses} 
                  category={analysisCategory}
                />
              )}
              {activeTab === 'telepro_perf' && (
                <TeleproPerformance 
                  leads={leads}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}
              {activeTab === 'sales_perf' && (
                <SalesPerformanceAnalysis 
                  leads={leads}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}
              {activeTab === 'questionnaires' && (
                <QuestionnaireView 
                  discovery={discovery}
                  social={socialQuestionnaire}
                />
              )}
              {activeTab === 'appointments' && (
                <AppointmentCalendar 
                  leads={leads}
                  onSelectLead={setSelectedLead}
                />
              )}
              {activeTab === 'expenses' && <ExpenseAnalysis expenses={expenses} leads={leads} startDate={startDate} endDate={endDate} />}
              {activeTab === 'creatives' && <CreativeAnalysis leads={leads} startDate={startDate} endDate={endDate} initialCreatives={creatives} />}
              {activeTab === 'posts' && <FacebookPosts />}
              {activeTab === 'sources' && <SourceAnalysis leads={leads} startDate={startDate} endDate={endDate} />}
              {activeTab === 'map' && <LeadMapView leads={leads} startDate={startDate} endDate={endDate} />}
              {activeTab === 'targeting' && <GeoTargeting leads={leads} />}
            </>
          )}
        </div>
      </main>

      {!isLoading && <ChatBot leads={leads} fbData={fbData} googleData={googleData} creatives={creatives} companyExpenses={expenses} />}

      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onUpdate={handleUpdateLead}
        />
      )}
    </div>
  );
};

export default App;
