import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('PhonePe Test Function Called');
    
    // Test crypto functionality
    const testString = 'test-payload';
    const salt = 'test-salt';
    
    const encoder = new TextEncoder();
    const data = encoder.encode(testString + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Hash generated successfully:', hashHex);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'PhonePe test function working',
        hash: hashHex,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Test Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Test failed',
        details: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})




