
import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateSalesScript(lead: Lead) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tu es un expert en téléprospection pour la société Rhône Solaire Pro. 
    Génère un script d'appel personnalisé et court pour le prospect suivant :
    Nom: ${lead.firstName} ${lead.lastName}
    Ville: ${lead.city}
    Facture mensuelle: ${lead.monthlyBill || 'Inconnue'} €
    Surface toiture: ${lead.roofArea || 'Inconnue'} m2
    
    L'objectif est d'obtenir un rendez-vous pour une étude gratuite d'autoconsommation solaire. 
    Le ton doit être professionnel, chaleureux et axé sur les économies d'énergie.
    Donne aussi 3 conseils pour traiter les objections courantes (ex: c'est trop cher, j'ai pas le temps).`,
    config: {
      temperature: 0.7,
      topP: 0.95,
    }
  });
  return response.text;
}

export async function analyzeLeadPotential(lead: Lead) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyse le potentiel de ce prospect pour une installation solaire :
    Facture: ${lead.monthlyBill}€/mois
    Toiture: ${lead.roofArea}m2
    Localisation: ${lead.city}
    Notes précédentes: ${lead.notes.join(' | ')}
    
    Réponds en JSON avec un score de 1 à 10 et un court argumentaire.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
          keySellingPoint: { type: Type.STRING }
        },
        required: ["score", "reasoning", "keySellingPoint"]
      }
    }
  });
  
  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { score: 5, reasoning: "Analyse indisponible", keySellingPoint: "Économies d'énergie" };
  }
}
