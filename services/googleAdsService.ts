
export interface GoogleAdsData {
  spend: number;
  impressions: number;
  clicks: number;
}

/**
 * RÉCUPÉRATION DES DÉPENSES GOOGLE ADS FILTRÉES PAR DATE
 */
export async function fetchGoogleAdsPerformance(scriptUrl: string, startDate?: string, endDate?: string): Promise<GoogleAdsData> {
  try {
    const params = new URLSearchParams({
      type: 'performance',
      startDate: startDate || '',
      endDate: endDate || ''
    });
    
    const response = await fetch(`${scriptUrl}?${params.toString()}`);
    if (!response.ok) throw new Error('Erreur réseau Google Ads');
    
    const data = await response.json();
    return {
      spend: parseFloat(data.googleAds?.spend || 0),
      impressions: parseInt(data.googleAds?.impressions || 0),
      clicks: parseInt(data.googleAds?.clicks || 0),
    };
  } catch (error) {
    console.error("Erreur lecture stats Google Ads depuis Sheets:", error);
    return { spend: 0, impressions: 0, clicks: 0 };
  }
}
