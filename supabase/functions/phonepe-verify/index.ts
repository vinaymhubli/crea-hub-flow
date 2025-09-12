import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PhonePe API configuration
const PHONEPE_BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox'
const PHONEPE_CLIENT_ID = 'TEST-M23SH3F1QDQ88_25081'
const PHONEPE_CLIENT_SECRET = 'YWEzMjcyYTMtNzI4Yy00YjMwLWE1YmMtYjYzNmIxMjFjMmMx'
const PHONEPE_MERCHANT_ID = 'TEST-M23SH3F1QDQ88_25081'
const PHONEPE_SALT_KEY = 'YWEzMjcyYTMtNzI4Yy00YjMwLWE1YmMtYjYzNmIxMjFjMmMx'

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
    console.log('PhonePe Verification Test');
    
    // Test payload
    const testPayload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: 'TEST_TXN_' + Date.now(),
      merchantUserId: 'test_user',
      amount: 100, // 1 rupee in paise
      redirectUrl: 'https://example.com/success',
      redirectMode: 'POST',
      callbackUrl: 'https://example.com/callback',
      mobileNumber: '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const payloadString = JSON.stringify(testPayload);
    const salt = PHONEPE_SALT_KEY;
    const xVerify = await generateXVerify(payloadString, salt);

    console.log('Test payload:', testPayload);
    console.log('X-VERIFY:', xVerify);

    // Test API call
    const requestBody = {
      request: btoa(payloadString)
    };

    const phonepeResponse = await fetch(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'accept': 'application/json',
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await phonepeResponse.text();
    console.log('PhonePe Response Status:', phonepeResponse.status);
    console.log('PhonePe Response:', responseText);

    return new Response(
      JSON.stringify({
        success: phonepeResponse.ok,
        status: phonepeResponse.status,
        statusText: phonepeResponse.statusText,
        response: responseText,
        config: {
          merchantId: PHONEPE_MERCHANT_ID,
          baseUrl: PHONEPE_BASE_URL,
          hasSaltKey: !!PHONEPE_SALT_KEY
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
