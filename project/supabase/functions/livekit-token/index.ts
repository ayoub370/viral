import { AccessToken } from 'npm:livekit-server-sdk@2';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const DEFAULT_LIVEKIT_URL = 'wss://viewcoin-vmvuj9mm.livekit.cloud';

async function getStoredCredential(supabase: ReturnType<typeof createClient>, name: string): Promise<string | null> {
  const { data } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('key_name', name)
    .maybeSingle();
  return data?.key_value || null;
}

async function getLiveKitCredentials(): Promise<{ apiKey: string; apiSecret: string; url: string }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const storedApiKey = await getStoredCredential(supabase, 'LIVEKIT_API_KEY');
  const storedApiSecret = await getStoredCredential(supabase, 'LIVEKIT_API_SECRET');
  const storedUrl = await getStoredCredential(supabase, 'LIVEKIT_URL');

  const apiKey = storedApiKey || Deno.env.get('LIVEKIT_API_KEY');
  const apiSecret = storedApiSecret || Deno.env.get('LIVEKIT_API_SECRET');
  const url = storedUrl || Deno.env.get('LIVEKIT_URL') || DEFAULT_LIVEKIT_URL;

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit credentials are not configured');
  }

  return { apiKey, apiSecret, url };
}

interface TokenRequest {
  room: string;
  identity: string;
  name: string;
  canPublish: boolean;
  canSubscribe: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { apiKey, apiSecret, url } = await getLiveKitCredentials();

    const { room, identity, name, canPublish, canSubscribe }: TokenRequest = await req.json();

    if (!room || !identity) {
      return new Response(
        JSON.stringify({ error: 'room et identity requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      ttl: 60 * 60,
    });

    token.addGrant({
      room,
      roomJoin: true,
      canPublish: canPublish ?? false,
      canSubscribe: canSubscribe ?? true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    return new Response(
      JSON.stringify({ token: jwt, url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
