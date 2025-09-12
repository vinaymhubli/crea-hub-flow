import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PhonePe API configuration - using environment variables
const PHONEPE_BASE_URL = Deno.env.get('PHONEPE_BASE_URL') || 'https://api-preprod.phonepe.com/apis/pg-sandbox'
const PHONEPE_CLIENT_ID = Deno.env.get('PHONEPE_CLIENT_ID') || 'TEST-M23SH3F1QDQ88_25081'
const PHONEPE_CLIENT_SECRET = Deno.env.get('PHONEPE_CLIENT_SECRET') || 'YWEzMjcyYTMtNzI4Yy00YjMwLWE1YmMtYjYzNmIxMjFjMmMx'
const PHONEPE_MERCHANT_ID = Deno.env.get('PHONEPE_MERCHANT_ID') || 'TEST-M23SH3F1QDQ88_25081'
const PHONEPE_SALT_KEY = Deno.env.get('PHONEPE_SALT_KEY') || 'YWEzMjcyYTMtNzI4Yy00YjMwLWE1YmMtYjYzNmIxMjFjMmMx'

// Generate checksum for PhonePe API
async function generateChecksum(payload: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex + '###' + salt;
}

// Generate X-VERIFY header for PhonePe API
async function generateXVerify(payload: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex + '###' + salt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, userId, redirectUrl } = await req.json()
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing payment request:', {
      amount: amount,
      userId: user.id,
      redirectUrl: redirectUrl
    });

    console.log('PhonePe Configuration:', {
      baseUrl: PHONEPE_BASE_URL,
      merchantId: PHONEPE_MERCHANT_ID,
      hasSaltKey: !!PHONEPE_SALT_KEY,
      saltKeyLength: PHONEPE_SALT_KEY?.length
    });

    // Generate unique transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create PhonePe payment request payload
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: user.id,
      amount: amount * 100, // Convert to paise
      redirectUrl: redirectUrl || `${req.headers.get('origin')}/customer-dashboard/wallet?payment_success=true`,
      redirectMode: 'POST',
      callbackUrl: `${req.headers.get('origin')}/functions/v1/phonepe-callback`,
      mobileNumber: user.phone || '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    }

    const payloadString = JSON.stringify(payload)
    const salt = PHONEPE_SALT_KEY
    const checksum = await generateChecksum(payloadString, salt)
    const xVerify = await generateXVerify(payloadString, salt)

    console.log('PhonePe Request:', {
      url: `${PHONEPE_BASE_URL}/pg/v1/pay`,
      payload: payload,
      xVerify: xVerify
    });

    // Create PhonePe payment request
    const requestBody = {
      request: btoa(payloadString)
    };
    
    console.log('Request body:', requestBody);
    
    const phonepeResponse = await fetch(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'accept': 'application/json',
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID
      },
      body: JSON.stringify(requestBody)
    })

    if (!phonepeResponse.ok) {
      const error = await phonepeResponse.text()
      console.error('PhonePe API Error:', {
        status: phonepeResponse.status,
        statusText: phonepeResponse.statusText,
        error: error
      })
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create payment session',
          details: error,
          status: phonepeResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await phonepeResponse.json()
    console.log('PhonePe Response:', response)
    
    // Store pending transaction in database
    const { error: insertError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        transaction_type: 'deposit',
        status: 'pending',
        description: `Wallet top-up via PhonePe - ${transactionId}`,
        metadata: {
          phonepe_transaction_id: transactionId,
          phonepe_merchant_id: PHONEPE_MERCHANT_ID,
          payment_gateway: 'phonepe'
        }
      })

    if (insertError) {
      console.error('Database error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to record transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentUrl: response.data.instrumentResponse.redirectInfo.url,
        transactionId: transactionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
