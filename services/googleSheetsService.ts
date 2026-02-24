
import { Lead, CompanyExpense, ClientDiscovery, SocialQuestionnaire } from '../types';

/**
 * Fonction générique pour effectuer un fetch sur Google Apps Script.
 */
async function fetchFromScript(url: string, params: Record<string, string>) {
  try {
    const queryParams = new URLSearchParams(params);
    const finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryParams.toString()}`;
    
    console.log(`[GAS DEBUG] Tentative de lecture (${params.type}) :`, finalUrl);

    const response = await fetch(finalUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error(`[GAS DEBUG] Erreur HTTP ${response.status} pour ${params.type}`);
      return [];
    }
    
    const data = await response.json();
    console.log(`[GAS DEBUG] Données brutes reçues pour ${params.type} :`, data);

    // Stratégie de récupération flexible :
    // 1. Si c'est déjà un tableau
    if (Array.isArray(data)) {
      return data;
    }
    
    // 2. Si c'est un objet qui contient un tableau sous la clé 'data' ou sous le nom du type
    if (data && typeof data === 'object') {
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data[params.type])) return data[params.type];
      
      // 3. Si l'objet contient une seule clé qui est un tableau (cas fréquent)
      const firstKey = Object.keys(data)[0];
      if (firstKey && Array.isArray(data[firstKey])) {
        return data[firstKey];
      }
    }
    
    console.warn(`[GAS DEBUG] Aucun tableau de données trouvé dans la réponse pour ${params.type}`);
    return [];
  } catch (err) {
    console.error(`[GAS DEBUG] Erreur de communication pour ${params.type} :`, err);
    return [];
  }
}

export async function fetchLeads(scriptUrl: string): Promise<Lead[]> {
  const data = await fetchFromScript(scriptUrl, { type: 'leads' });
  return data.map((item: any) => ({
    ...item,
    notes: item.notes ? String(item.notes).split(' | ').filter(Boolean) : []
  }));
}

export async function fetchDiscovery(scriptUrl: string): Promise<ClientDiscovery[]> {
  return await fetchFromScript(scriptUrl, { type: 'discovery' });
}

export async function fetchSocialQuestionnaire(scriptUrl: string): Promise<SocialQuestionnaire[]> {
  return await fetchFromScript(scriptUrl, { type: 'social_questionnaire' });
}

export async function fetchExpenses(scriptUrl: string): Promise<CompanyExpense[]> {
  return await fetchFromScript(scriptUrl, { type: 'expenses' });
}

export async function updateLead(scriptUrl: string, lead: Lead): Promise<void> {
  try {
    const payload = {
      ...lead,
      notes: Array.isArray(lead.notes) ? lead.notes.join(' | ') : lead.notes
    };
    
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Erreur Update Lead:", err);
    throw err;
  }
}
