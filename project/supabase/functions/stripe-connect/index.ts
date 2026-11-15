import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface CreateAccountRequest {
  email: string;
  userId: string;
}

interface OnboardingLinkRequest {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}

const createStripeAccount = async (email: string): Promise<string> => {
  const response = await fetch("https://api.stripe.com/v1/accounts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      type: "express",
      email: email,
      "capabilities[card_payments][requested]": "true",
      "capabilities[transfers][requested]": "true",
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe error: ${error}`);
  }

  const data = await response.json();
  return data.id;
};

const createAccountLink = async (
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string> => {
  const response = await fetch("https://api.stripe.com/v1/account_links", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      account: accountId,
      type: "account_onboarding",
      refresh_url: refreshUrl,
      return_url: returnUrl,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe error: ${error}`);
  }

  const data = await response.json();
  return data.url;
};

const saveAccountToDatabase = async (
  userId: string,
  stripeAccountId: string
): Promise<void> => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/stripe_accounts`,
    {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY!,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        stripe_account_id: stripeAccountId,
        status: "pending",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Database error: ${error}`);
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method === "POST") {
      const body = await req.json();

      // Si c'est une demande de création de compte
      if (body.email && body.userId && !body.accountId) {
        const { email, userId }: CreateAccountRequest = body;

        console.log(`Creating Stripe account for user ${userId} with email ${email}`);
        
        const stripeAccountId = await createStripeAccount(email);
        await saveAccountToDatabase(userId, stripeAccountId);

        console.log(`Stripe account created: ${stripeAccountId}`);

        return new Response(
          JSON.stringify({
            success: true,
            accountId: stripeAccountId,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Si c'est une demande de lien d'onboarding
      if (body.accountId && body.refreshUrl && body.returnUrl) {
        const { accountId, refreshUrl, returnUrl }: OnboardingLinkRequest = body;

        console.log(`Creating onboarding link for account ${accountId}`);
        
        const link = await createAccountLink(accountId, refreshUrl, returnUrl);

        console.log(`Onboarding link created: ${link}`);

        return new Response(
          JSON.stringify({
            success: true,
            url: link,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Stripe Connect Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});