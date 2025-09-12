import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PhonePe API configuration
const PHONEPE_BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox'
const PHONEPE_CLIENT_ID = 'TEST-M23SH3F1QDQ88_25081'
const PHONEPE_CLIENT_SECRET = 'YWEzMjcyYTMtNzI4Yy00YjMwLWE1YmMtYjYzNmIxMjFjMmMx'
const PHONEPE_MERCHANT_ID = 'TEST-M23SH3F1QDQ88_25081'

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
    const { transactionId } = await req.json()
    
    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: 'Transaction ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify payment with PhonePe
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionId
    }

    const payloadString = JSON.stringify(payload)
    const salt = Math.random().toString(36).substring(2, 15)
    const xVerify = await generateXVerify(payloadString, salt)

    const phonepeResponse = await fetch(`${PHONEPE_BASE_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'accept': 'application/json'
      }
    })

    if (!phonepeResponse.ok) {
      const error = await phonepeResponse.text()
      console.error('PhonePe verification error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to verify payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await phonepeResponse.json()
    const paymentData = JSON.parse(atob(response.data))

    if (paymentData.code === 'PAYMENT_SUCCESS') {
      // Update transaction status to completed
      const { error: updateError } = await supabase
        .from('wallet_transactions')
        .update({ 
          status: 'completed',
          metadata: {
            phonepe_response: paymentData,
            verified_at: new Date().toISOString()
          }
        })
        .eq('metadata->>phonepe_transaction_id', transactionId)

      if (updateError) {
        console.error('Database update error:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update transaction' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          amount: paymentData.amount / 100, // Convert from paise to rupees
          transactionId: transactionId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Update transaction status to failed
      const { error: updateError } = await supabase
        .from('wallet_transactions')
        .update({ 
          status: 'failed',
          metadata: {
            phonepe_response: paymentData,
            failed_at: new Date().toISOString()
          }
        })
        .eq('metadata->>phonepe_transaction_id', transactionId)

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: paymentData.message || 'Payment failed',
          transactionId: transactionId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
