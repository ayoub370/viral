import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CompleteSignupRequest {
  email: string;
  password: string;
  username: string;
  fullName: string;
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, password, username, fullName, code }: CompleteSignupRequest = await req.json();

    if (!email || !password || !username || !fullName || !code) {
      return new Response(
        JSON.stringify({ error: 'Tous les champs sont requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Leaked-password protection via HaveIBeenPwned k-anonymity model.
    // Only the first 5 chars of the SHA-1 hash leave the server.
    const hashBuffer = await crypto.subtle.digest(
      'SHA-1',
      new TextEncoder().encode(password)
    );
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    const hibpRes = await fetch(
      `https://api.pwnedpasswords.com/range/${hashHex.slice(0, 5)}`
    );
    if (hibpRes.ok) {
      const suffix = hashHex.slice(5);
      const leaked = (await hibpRes.text())
        .split('\n')
        .some((line) => line.trim().split(':')[0] === suffix);
      if (leaked) {
        return new Response(
          JSON.stringify({
            error:
              'Ce mot de passe a été compromis dans une fuite de données. Veuillez en choisir un autre.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Verify OTP code
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('purpose', 'signup')
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

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Un compte existe déjà avec cet email' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if username is taken
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    let finalUsername = username;
    if (existingProfile) {
      finalUsername = `${username}${Math.floor(Math.random() * 10000)}`;
    }

    // Create user in Supabase auth with email confirmed
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: finalUsername,
        full_name: fullName,
      },
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du compte' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile was created by trigger
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (!profileData) {
      // Create profile manually if trigger didn't work
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          username: finalUsername,
          full_name: fullName,
          coins: 0,
          balance: 0,
        });

      if (profileError) {
        console.error('Profile error:', profileError);
      }
    }

    // Generate session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
    });

    // Return success with user info
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: finalUsername,
          fullName: fullName,
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
