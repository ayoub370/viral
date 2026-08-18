import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EXOCLICK_API_URL = 'https://api.exoclick.com/v2';
const EXOCLICK_API_TOKEN = 'd768dfa685427efbc1e6e20af679d879e188d272';

const ZONE_IDS = [5947342, 5956288, 5946880];

interface ExoClickZoneStats {
  impressions: number;
  revenue: number;
  clicks?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'sync';
    const dateFrom = url.searchParams.get('date_from') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = url.searchParams.get('date_to') || new Date().toISOString().split('T')[0];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'sync') {
      const stats = await fetchExoClickStats(dateFrom, dateTo);

      for (const [zoneId, zoneStats] of stats) {
        if (zoneStats && zoneStats.impressions > 0) {
          await supabase.from('daily_ad_revenue').upsert({
            date: dateTo,
            zone_id: zoneId,
            impressions: zoneStats.impressions,
            revenue: zoneStats.revenue,
          }, { onConflict: 'date,zone_id' });

          const { data: impressions } = await supabase
            .from('ad_impressions')
            .select('id, user_id')
            .eq('zone_id', zoneId)
            .gte('created_at', dateFrom)
            .lte('created_at', dateTo + ' 23:59:59')
            .eq('converted', false);

          if (impressions && impressions.length > 0) {
            const revenuePerImpression = zoneStats.revenue / impressions.length;

            for (const impression of impressions) {
              await supabase
                .from('ad_impressions')
                .update({
                  revenue: revenuePerImpression,
                  converted: true
                })
                .eq('id', impression.id);
            }
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Revenue synced and distributed',
        stats: Object.fromEntries(stats)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'user_revenue') {
      const userId = url.searchParams.get('user_id');
      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: impressions } = await supabase
        .from('ad_impressions')
        .select('ad_type, revenue, created_at')
        .eq('user_id', userId);

      const totalRevenue = impressions?.reduce((sum, i) => sum + (i.revenue || 0), 0) || 0;
      const totalImpressions = impressions?.length || 0;

      const byType: Record<string, { count: number; revenue: number }> = {};
      impressions?.forEach(i => {
        if (!byType[i.ad_type]) {
          byType[i.ad_type] = { count: 0, revenue: 0 };
        }
        byType[i.ad_type].count++;
        byType[i.ad_type].revenue += i.revenue || 0;
      });

      return new Response(JSON.stringify({
        user_id: userId,
        total_revenue: totalRevenue,
        total_impressions: totalImpressions,
        by_type: byType
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'leaderboard') {
      const { data: leaderboard } = await supabase
        .from('ad_impressions')
        .select('user_id, revenue')
        .not('user_id', 'is', null);

      const userTotals: Record<string, number> = {};
      leaderboard?.forEach(i => {
        userTotals[i.user_id] = (userTotals[i.user_id] || 0) + (i.revenue || 0);
      });

      const sorted = Object.entries(userTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100)
        .map(([user_id, revenue], index) => ({ rank: index + 1, user_id, revenue }));

      return new Response(JSON.stringify({ leaderboard: sorted }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchExoClickStats(dateFrom: string, dateTo: string): Promise<Map<number, ExoClickZoneStats>> {
  const stats = new Map<number, ExoClickZoneStats>();

  for (const zoneId of ZONE_IDS) {
    try {
      const response = await fetch(
        `${EXOCLICK_API_URL}/stats?zone_id=${zoneId}&date_from=${dateFrom}&date_to=${dateTo}`,
        {
          headers: {
            'Authorization': `Bearer ${EXOCLICK_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        stats.set(zoneId, {
          impressions: data.impressions || 0,
          revenue: data.revenue || 0,
          clicks: data.clicks || 0,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch stats for zone ${zoneId}:`, error);
    }
  }

  return stats;
}
