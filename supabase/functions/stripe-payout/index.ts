const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface PayoutRequest {
  amount: number
  userId: string
}

async function getStripeAccountId(userId: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase configuration missing')
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/stripe_accounts?user_id=eq.${userId}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Stripe account')
  }

  const accounts = await response.json()
  if (!accounts || accounts.length === 0) {
    throw new Error('No Stripe account found for this user')
  }

  return accounts[0].stripe_account_id
}

async function createStripeTransfer(stripeAccountId: string, amount: number): Promise<any> {
  if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.trim() === '') {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  const amountInCents = Math.round(amount * 100)

  const transferResponse = await fetch('https://api.stripe.com/v1/transfers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: amountInCents.toString(),
      currency: 'eur',
      destination: stripeAccountId,
      description: 'Retrait ViewCoin'
    })
  })

  if (!transferResponse.ok) {
    const errorData = await transferResponse.text()
    throw new Error(`Transfer failed: ${errorData}`)
  }

  return await transferResponse.json()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    if (req.method === 'POST') {
      const { amount, userId }: PayoutRequest = await req.json()

      if (!userId || !amount || amount < 10) {
        return new Response(JSON.stringify({
          error: 'UserId required and minimum 10 EUR'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`Initiating Stripe payout for user ${userId}: ${amount} EUR`)

      const stripeAccountId = await getStripeAccountId(userId)
      const transferResult = await createStripeTransfer(stripeAccountId, amount)
      console.log('Stripe transfer created:', JSON.stringify(transferResult, null, 2))

      return new Response(JSON.stringify({
        success: true,
        message: 'Payout initiated successfully',
        transferId: transferResult.id,
        data: transferResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Stripe payout error:', error)

    return new Response(JSON.stringify({
      error: 'Payout error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})