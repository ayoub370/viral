import { supabase } from './api';

const EXOCLICK_API_URL = 'https://api.exoclick.com/v2';
const EXOCLICK_API_TOKEN = 'd768dfa685427efbc1e6e20af679d879e188d272';

// Zone IDs used in the app
export const ZONE_IDS = {
  INTERSTITIAL_DESKTOP: 5947342,
  INTERSTITIAL_MOBILE: 5956288,
  OUTSTREAM: 5946880,
};

interface AdImpression {
  user_id: string;
  zone_id: number;
  ad_type: 'interstitial' | 'outstream' | 'banner' | 'native';
  sub_id?: string;
}

interface ExoClickStats {
  impressions: number;
  revenue: number;
  clicks?: number;
  ctr?: number;
  cpm?: number;
}

class ExoClickAPI {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl: string = EXOCLICK_API_URL) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  async getZoneStats(zoneId: number, dateFrom: string, dateTo: string): Promise<ExoClickStats | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/stats?zone_id=${zoneId}&date_from=${dateFrom}&date_to=${dateTo}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch ExoClick stats:', error);
      return null;
    }
  }

  async getAllZonesStats(dateFrom: string, dateTo: string): Promise<Map<number, ExoClickStats>> {
    const stats = new Map<number, ExoClickStats>();
    const zoneIds = Object.values(ZONE_IDS);

    await Promise.all(
      zoneIds.map(async (zoneId) => {
        const zoneStats = await this.getZoneStats(zoneId, dateFrom, dateTo);
        if (zoneStats) {
          stats.set(zoneId, zoneStats);
        }
      })
    );

    return stats;
  }
}

// Track an ad impression for a user
export async function trackAdImpression(impression: AdImpression): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ad_impressions')
      .insert({
        user_id: impression.user_id,
        zone_id: impression.zone_id,
        ad_type: impression.ad_type,
        sub_id: impression.sub_id || null,
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track impression',
    };
  }
}

// Get user's total ad revenue
export async function getUserAdRevenue(userId: string): Promise<{ total: number; impressions: number }> {
  try {
    const { data, error } = await supabase
      .from('ad_impressions')
      .select('revenue')
      .eq('user_id', userId);

    if (error) throw error;

    const total = data?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0;
    const impressions = data?.length || 0;

    return { total, impressions };
  } catch {
    return { total: 0, impressions: 0 };
  }
}

// Get user's ad impressions count by type
export async function getUserAdStats(userId: string): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('ad_impressions')
      .select('ad_type')
      .eq('user_id', userId);

    if (error) throw error;

    const stats: Record<string, number> = {
      interstitial: 0,
      outstream: 0,
      banner: 0,
      native: 0,
      total: 0,
    };

    data?.forEach((item) => {
      stats[item.ad_type] = (stats[item.ad_type] || 0) + 1;
      stats.total++;
    });

    return stats;
  } catch {
    return { interstitial: 0, outstream: 0, banner: 0, native: 0, total: 0 };
  }
}

export const exoClickAPI = new ExoClickAPI(EXOCLICK_API_TOKEN);

export default ExoClickAPI;
