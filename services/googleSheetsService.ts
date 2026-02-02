
import { Lead, CompanyExpense } from '../types';

export async function fetchLeads(scriptUrl: string): Promise<Lead[]> {
  try {
    const response = await fetch(`${scriptUrl}?type=leads`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) throw new Error('Erreur réseau');
    const data = await response.json();
    
    return data.map((item: any) => ({
      ...item,
      notes: item.notes ? item.notes.split(' | ').filter(Boolean) : []
    }));
  } catch (err) {
    console.error("Erreur Fetch Leads:", err);
    throw err;
  }
}

export async function fetchExpenses(scriptUrl: string): Promise<CompanyExpense[]> {
  try {
    const response = await fetch(`${scriptUrl}?type=expenses`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    if (!response.ok) throw new Error('Erreur réseau');
    return await response.json();
  } catch (err) {
    console.error("Erreur Fetch Expenses:", err);
    return [];
  }
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
