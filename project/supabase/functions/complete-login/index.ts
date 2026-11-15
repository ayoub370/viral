import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CompleteLoginRequest {
  email: string;
  code: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, code }: CompleteLoginRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email et code requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify OTP code
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('purpose', 'login')
      .eq('verified', false)
      .single();

    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({ error: 'Code invalide ou expiré' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const now = new Date();
    const expiresAt = new Date(otpData.expires_at);

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Code expiré' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Mark OTP as verified
    await supabase
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', otpData.id);

    // Get user by email
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const user = usersData.users.find(u => u.email === email);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profil non trouvé' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return success with profile info
    // Note: The client will need to sign in with password to get a proper session
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: profile.id,
          email: user.email,
          username: profile.username,
          fullName: profile.full_name,
          coins: profile.coins,
          balance: parseFloat(profile.balance),
          profilePhotoUrl: profile.profile_photo_url,
          createdAt: profile.created_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
