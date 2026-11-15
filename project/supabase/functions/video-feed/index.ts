import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

async function getApiKey(supabase: ReturnType<typeof createClient>, keyName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('key_name', keyName)
    .maybeSingle();
  if (error || !data) return null;
  return data.key_value;
}

interface NormalizedVideo {
  id: number;
  videos: { medium: { url: string } };
  user: string;
  user_id: number;
  userImageURL: string;
  likes: number;
  category: string;
  source: string;
  previewUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const queries: string[] = Array.isArray(body.queries) && body.queries.length > 0
      ? body.queries.slice(0, 5)
      : [typeof body.query === "string" ? body.query.trim().slice(0, 80) : "nature"];
    const page = Number.isInteger(body.page) && body.page > 0 ? Math.min(body.page, 20) : Math.floor(Math.random() * 10) + 1;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const pixabayKey = await getApiKey(supabase, 'PIXABAY_API_KEY');
    const pexelsKey = await getApiKey(supabase, 'PEXELS_API_KEY');

    const allVideos: NormalizedVideo[] = [];
    const seenIds = new Set<number>();

    const fetchPixabay = async (query: string): Promise<void> => {
      if (!pixabayKey) return;
      try {
        const response = await fetch(
          `https://pixabay.com/api/videos/?key=${encodeURIComponent(pixabayKey)}&q=${encodeURIComponent(query)}&per_page=10&page=${page}&order=popular`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!Array.isArray(data.hits)) return;
        for (const video of data.hits) {
          const file = video.videos?.small ?? video.videos?.medium;
          const id = video.id as number;
          if (seenIds.has(id) || !file?.url) continue;
          seenIds.add(id);
          allVideos.push({
            id,
            videos: { medium: { url: file.url } },
            user: video.user || "Pixabay",
            user_id: video.user_id || id,
            userImageURL: video.userImageURL || "",
            likes: video.likes || 0,
            category: query,
            source: "Pixabay",
            previewUrl: "",
          });
        }
      } catch { /* skip failed source */ }
    };

    const fetchPexels = async (query: string): Promise<void> => {
      if (!pexelsKey) return;
      try {
        const response = await fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=10&page=${page}`,
          { headers: { Authorization: pexelsKey } }
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!Array.isArray(data.videos)) return;
        for (const video of data.videos) {
          const id = (video.id as number) + 1000000;
          if (seenIds.has(id)) continue;
          // Prefer SD for faster loading, fallback to smallest available
          const link = video.video_files?.find((f: { quality: string }) => f.quality === "sd")?.link
            || video.video_files?.find((f: { quality: string }) => f.quality === "hd")?.link
            || video.video_files?.[0]?.link;
          if (!link) continue;
          seenIds.add(id);
          allVideos.push({
            id,
            videos: { medium: { url: link } },
            user: video.user?.name || "Pexels",
            user_id: video.user?.id || id,
            userImageURL: "",
            likes: 0,
            category: query,
            source: "Pexels",
            previewUrl: "",
          });
        }
      } catch { /* skip failed source */ }
    };

    const tasks: Promise<void>[] = [];
    for (const q of queries) {
      tasks.push(fetchPixabay(q));
      tasks.push(fetchPexels(q));
    }
    await Promise.allSettled(tasks);

    for (let i = allVideos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allVideos[i], allVideos[j]] = [allVideos[j], allVideos[i]];
    }

    return new Response(
      JSON.stringify({ videos: allVideos, hasKeys: !!(pixabayKey || pexelsKey) }),
      { headers: jsonHeaders }
    );
  } catch (error) {
    console.error("Video feed proxy error:", error);
    return new Response(JSON.stringify({ error: "Unable to load videos" }), { status: 500, headers: jsonHeaders });
  }
});
