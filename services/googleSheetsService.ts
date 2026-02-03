
import { Lead, CompanyExpense } from '../types';

// Use Netlify Function as proxy to avoid CORS and certificate issues
const API_BASE = '/.netlify/functions/sheets';

export async function fetchLeads(scriptUrl: string): Promise<Lead[]> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'leads' }),
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
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'expenses' }),
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

    await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'leads',
        method: 'POST',
        payload
      }),
    });
  } catch (err) {
    console.error("Erreur Update Lead:", err);
    throw err;
  }
}
