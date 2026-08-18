import { AccessToken } from 'npm:livekit-server-sdk@2';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const LIVEKIT_URL = 'wss://viewcoin-vmvuj9mm.livekit.cloud';

async function getLiveKitCredentials(): Promise<{ apiKey: string; apiSecret: string }> {
  // Try environment variables first
  const envKey = Deno.env.get('LIVEKIT_API_KEY');
  const envSecret = Deno.env.get('LIVEKIT_API_SECRET');
  if (envKey && envSecret) {
    return { apiKey: envKey, apiSecret: envSecret };
  }

  // Fall back to Supabase vault
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: keyData, error: keyError } = await supabase
    .from('vault')
    .select('decrypted_secret')
    .eq('name', 'LIVEKIT_API_KEY')
    .single();

  const { data: secretData, error: secretError } = await supabase
    .from('vault')
    .select('decrypted_secret')
    .eq('name', 'LIVEKIT_API_SECRET')
    .single();

  if (keyError || secretError || !keyData?.decrypted_secret || !secretData?.decrypted_secret) {
    throw new Error('LiveKit credentials not found in env or vault');
  }

  return {
    apiKey: keyData.decrypted_secret,
    apiSecret: secretData.decrypted_secret,
  };
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
    const { apiKey, apiSecret } = await getLiveKitCredentials();

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
      JSON.stringify({ token: jwt, url: LIVEKIT_URL }),
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
