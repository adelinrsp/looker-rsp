
export interface FacebookAdsData {
  spend: number;
  impressions: number;
  clicks: number;
}

export interface FacebookCreativeData {
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  id: string;
  imageUrl?: string;
}

export interface SocialPost {
  id: string;
  message?: string;
  created_time: string;
  full_picture?: string;
  permalink_url: string;
  shares?: { count: number };
  likes_count: number;
  comments_count: number;
  platform: 'facebook' | 'instagram';
  isVideo?: boolean;
}

const ACCESS_TOKEN = import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN || '';
const AD_ACCOUNT_ID = import.meta.env.VITE_FACEBOOK_AD_ACCOUNT_ID || '';
const PAGE_ID = import.meta.env.VITE_FACEBOOK_PAGE_ID || '';

export async function fetchFacebookAdsPerformance(since?: string, until?: string): Promise<FacebookAdsData> {
  try {
    let timeRangeParam = 'date_preset=last_30d';
    if (since && until) {
      const range = JSON.stringify({ since, until });
      timeRangeParam = `time_range=${encodeURIComponent(range)}`;
    }
    const url = `https://graph.facebook.com/v18.0/act_${AD_ACCOUNT_ID}/insights?fields=spend,impressions,clicks&${timeRangeParam}&access_token=${ACCESS_TOKEN}`;
    const response = await fetch(url);
    const result = await response.json();
    if (result.error) return { spend: 0, impressions: 0, clicks: 0 };
    if (result.data && result.data.length > 0) {
      const insight = result.data[0];
      return {
        spend: parseFloat(insight.spend || 0),
        impressions: parseInt(insight.impressions || 0),
        clicks: parseInt(insight.clicks || 0),
      };
    }
    return { spend: 0, impressions: 0, clicks: 0 };
  } catch (error) {
    return { spend: 0, impressions: 0, clicks: 0 };
  }
}

export async function fetchFacebookCreativesPerformance(since?: string, until?: string): Promise<FacebookCreativeData[]> {
  try {
    let timeRangeParam = 'date_preset=last_30d';
    if (since && until) {
      const range = JSON.stringify({ since, until });
      timeRangeParam = `time_range=${encodeURIComponent(range)}`;
    }
    const insightsUrl = `https://graph.facebook.com/v18.0/act_${AD_ACCOUNT_ID}/insights?level=ad&fields=ad_name,spend,impressions,clicks,ad_id&${timeRangeParam}&access_token=${ACCESS_TOKEN}`;
    const insightsResponse = await fetch(insightsUrl);
    const insightsResult = await insightsResponse.json();
    if (insightsResult.error || !insightsResult.data) return [];
    const adsUrl = `https://graph.facebook.com/v18.0/act_${AD_ACCOUNT_ID}/ads?fields=id,creative{image_url,thumbnail_url}&access_token=${ACCESS_TOKEN}&limit=200`;
    const adsResponse = await fetch(adsUrl);
    const adsResult = await adsResponse.json();
    const adsMetaMap: Record<string, string> = {};
    if (adsResult.data) {
      adsResult.data.forEach((ad: any) => {
        adsMetaMap[ad.id] = ad.creative?.image_url || ad.creative?.thumbnail_url || '';
      });
    }
    return insightsResult.data.map((item: any) => ({
      name: item.ad_name,
      spend: parseFloat(item.spend || 0),
      impressions: parseInt(item.impressions || 0),
      clicks: parseInt(item.clicks || 0),
      id: item.ad_id,
      imageUrl: adsMetaMap[item.ad_id] || ''
    }));
  } catch (error) {
    return [];
  }
}

export async function fetchSocialFeed(): Promise<SocialPost[]> {
  try {
    // 1. Fetch FB Posts
    const fbUrl = `https://graph.facebook.com/v18.0/${PAGE_ID}/posts?fields=message,created_time,id,full_picture,permalink_url,shares,likes.summary(true),comments.summary(true)&access_token=${ACCESS_TOKEN}&limit=50`;
    const fbResponse = await fetch(fbUrl);
    const fbResult = await fbResponse.json();

    let fbPosts: SocialPost[] = [];
    if (!fbResult.error && fbResult.data) {
      fbPosts = fbResult.data.map((post: any) => ({
        id: post.id,
        message: post.message,
        created_time: post.created_time,
        full_picture: post.full_picture,
        permalink_url: post.permalink_url,
        shares: post.shares,
        likes_count: post.likes?.summary?.total_count || 0,
        comments_count: post.comments?.summary?.total_count || 0,
        platform: 'facebook' as const,
        isVideo: false // FB posts fields are simpler here, could be enhanced
      }));
    }

    // 2. Fetch IG Posts
    const pageInfoUrl = `https://graph.facebook.com/v18.0/${PAGE_ID}?fields=instagram_business_account&access_token=${ACCESS_TOKEN}`;
    const pageInfoResponse = await fetch(pageInfoUrl);
    const pageInfo = await pageInfoResponse.json();

    let igPosts: SocialPost[] = [];
    if (pageInfo.instagram_business_account) {
      const igId = pageInfo.instagram_business_account.id;
      // Ajout de thumbnail_url et media_type pour gérer les vidéos
      const igUrl = `https://graph.facebook.com/v18.0/${igId}/media?fields=caption,media_url,thumbnail_url,media_type,permalink,timestamp,like_count,comments_count&access_token=${ACCESS_TOKEN}&limit=50`;
      const igResponse = await fetch(igUrl);
      const igResult = await igResponse.json();

      if (!igResult.error && igResult.data) {
        igPosts = igResult.data.map((post: any) => ({
          id: post.id,
          message: post.caption,
          created_time: post.timestamp,
          // Utilisation de la miniature si c'est une vidéo
          full_picture: post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url,
          permalink_url: post.permalink,
          likes_count: post.like_count || 0,
          comments_count: post.comments_count || 0,
          platform: 'instagram' as const,
          isVideo: post.media_type === 'VIDEO'
        }));
      }
    }

    return [...fbPosts, ...igPosts].sort((a, b) => 
      new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
    );
  } catch (error) {
    console.error("Error fetching social feed:", error);
    return [];
  }
}
