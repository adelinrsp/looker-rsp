
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Lead, CompanyExpense } from '../types';
import { FacebookAdsData, FacebookCreativeData } from '../services/facebookAdsService';
import { GoogleAdsData } from '../services/googleAdsService';

interface ChatBotProps {
  leads: Lead[];
  fbData: FacebookAdsData | null;
  googleData: GoogleAdsData | null;
  creatives: FacebookCreativeData[];
  companyExpenses?: CompanyExpense[];
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ leads, fbData, googleData, creatives, companyExpenses = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Bonjour ! Je suis RSP Analyst. Je connais maintenant vos dépenses société et vos performances marketing. Comment puis-je vous aider ?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const topCreatives = creatives
        .map(c => ({
          nom: c.name,
          leads: leads.filter(l => (l.creative || '').toLowerCase() === c.name.toLowerCase()).length,
          cpl: leads.filter(l => (l.creative || '').toLowerCase() === c.name.toLowerCase()).length > 0 ? (c.spend / leads.filter(l => (l.creative || '').toLowerCase() === c.name.toLowerCase()).length).toFixed(2) : "0",
          img: c.imageUrl
        }))
        .sort((a, b) => b.leads - a.leads).slice(0, 5);

      const adsTotal = (fbData?.spend || 0) + (googleData?.spend || 0);
      const companyTotal = companyExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      const prompt = `Tu es l'assistant RSP Analyst. 
      Données Actuelles :
      - Leads : ${leads.length}
      - Ventes : ${leads.filter(l => l.salesStatus === 'Vendu' || l.salesStatus === 'Installé').length}
      - Budget Ads : ${adsTotal}€
      - Budget Société : ${companyTotal}€
      - Budget Global : ${adsTotal + companyTotal}€
      
      Dépenses Société (Top 5) : ${JSON.stringify(companyExpenses.slice(0, 5))}
      Top Créatives : ${JSON.stringify(topCreatives)}

      CONSIGNES :
      1. Calcule le ROI global si on te le demande (Coût total / Ventes).
      2. Utilise ![Nom](URL) pour les images.
      3. Sois bref et focalisé sur la rentabilité de Rhône Solaire Pro.

      Question : ${userMsg}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.6 }
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "Analyse impossible." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Erreur de connexion aux données." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessageText = (text: string) => {
    const parts = text.split(/(!\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      const imgMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        return (
          <div key={i} className="my-4 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full h-auto object-cover max-h-64" />
          </div>
        );
      }
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div className="w-[420px] h-[650px] bg-white rounded-[40px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden mb-6 animate-in slide-in-from-bottom-10">
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center"><i className="fas fa-brain"></i></div>
              <h4 className="text-sm font-black uppercase">RSP Analyst AI</h4>
            </div>
            <button onClick={() => setIsOpen(false)}><i className="fas fa-times text-slate-400"></i></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-5 rounded-3xl text-[13px] font-medium shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                  {renderMessageText(msg.text)}
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-white border-t border-slate-100">
            <div className="relative flex items-center">
              <input type="text" placeholder="Question sur le ROI ou les dépenses..." className="w-full pl-6 pr-14 py-4 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
              <button onClick={handleSend} className="absolute right-2 w-10 h-10 bg-amber-500 text-white rounded-xl shadow-lg"><i className="fas fa-bolt"></i></button>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-2xl transition-all ${isOpen ? 'bg-slate-900 rotate-90' : 'bg-amber-500 shadow-amber-500/40'}`}>
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-brain'} text-xl`}></i>
      </button>
    </div>
  );
};

export default ChatBot;
