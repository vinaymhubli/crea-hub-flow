import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount } = await req.json()
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

    console.log('Mock Payment Processing:', {
      amount: amount,
      userId: user.id
    });

    // Generate unique transaction ID
    const transactionId = `MOCK_TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Store pending transaction in database
    const { error: insertError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        transaction_type: 'deposit',
        status: 'pending',
        description: `Mock wallet top-up - ${transactionId}`,
        metadata: {
          mock_transaction_id: transactionId,
          payment_gateway: 'mock',
          created_at: new Date().toISOString()
        }
      })

    if (insertError) {
      console.error('Database error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to record transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Simulate payment success after 2 seconds
    setTimeout(async () => {
      try {
        // Update transaction to completed
        const { error: updateError } = await supabase
          .from('wallet_transactions')
          .update({ 
            status: 'completed',
            metadata: {
              mock_transaction_id: transactionId,
              payment_gateway: 'mock',
              completed_at: new Date().toISOString()
            }
          })
          .eq('metadata->>mock_transaction_id', transactionId)

        if (updateError) {
          console.error('Failed to update transaction:', updateError)
        } else {
          console.log('Mock payment completed successfully:', transactionId)
        }
      } catch (error) {
        console.error('Error completing mock payment:', error)
      }
    }, 2000);

    // Return mock payment URL
    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentUrl: `${req.headers.get('origin')}/customer-dashboard/wallet?mock_payment_success=true&amount=${amount}&txn_id=${transactionId}`,
        transactionId: transactionId,
        message: "Mock payment initiated. You will be redirected to success page."
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








