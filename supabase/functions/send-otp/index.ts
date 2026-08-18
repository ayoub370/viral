import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SendOTPRequest {
  email: string;
  purpose: 'signup' | 'login';
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, purpose }: SendOTPRequest = await req.json();

    if (!email || !purpose) {
      return new Response(
        JSON.stringify({ error: 'Email et purpose requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error: deleteError } = await supabase
      .from('otp_codes')
      .delete()
      .eq('email', email)
      .eq('purpose', purpose)
      .eq('verified', false);

    if (deleteError) {
      console.error('Error deleting old codes:', deleteError);
    }

    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        email,
        code,
        purpose,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error inserting OTP:', insertError);
      return new Response(
        JSON.stringify({ error: 'Échec de création du code' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .code-box {
              background: #f4f4f4;
              border: 2px solid #000;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #000;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Votre code de vérification</h2>
            <p>Vous avez demandé un code de vérification pour ${purpose === 'signup' ? 'créer votre compte' : 'vous connecter'}.</p>

            <div class="code-box">
              <div class="code">${code}</div>
            </div>

            <p>Ce code expire dans 10 minutes.</p>
            <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>

            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.log('Code OTP généré:', code, 'pour', email);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Code créé (email non envoyé - configurer RESEND_API_KEY)',
          code: code
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ViewCoin <onboarding@resend.dev>',
        to: [email],
        subject: `Votre code de vérification: ${code}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', errorData);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Code créé mais email non envoyé',
          code: code
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Code envoyé par email' }),
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
