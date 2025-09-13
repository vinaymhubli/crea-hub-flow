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
    const { sessionId, amount, customerId, designerId, sessionType, duration } = await req.json()
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

    if (!sessionId || !amount || !customerId || !designerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing session payment:', {
      sessionId,
      amount,
      customerId,
      designerId,
      sessionType,
      duration
    });

    // Check if session payment already processed
    const { data: existingPayment, error: checkError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('metadata->>session_id', sessionId)
      .eq('transaction_type', 'payment')
      .eq('status', 'completed')
      .single()

    if (existingPayment) {
      return new Response(
        JSON.stringify({ 
          error: 'Session payment already processed',
          transactionId: existingPayment.id
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check customer wallet balance
    const { data: customerBalance, error: balanceError } = await supabase.rpc('get_wallet_balance', { user_uuid: customerId })
    if (balanceError) {
      console.error('Balance check error:', balanceError)
      return new Response(
        JSON.stringify({ error: 'Failed to check customer balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (customerBalance < amount) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient customer balance',
          currentBalance: customerBalance,
          requiredAmount: amount,
          shortfall: amount - customerBalance
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique transaction IDs
    const customerTransactionId = `SESSION_PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const designerTransactionId = `SESSION_EARN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Start transaction
    const { data: customerTransaction, error: customerError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: customerId,
        amount: amount,
        transaction_type: 'payment',
        status: 'completed',
        description: `Session payment - ${sessionType || 'Design Session'}`,
        metadata: {
          transaction_id: customerTransactionId,
          session_id: sessionId,
          designer_id: designerId,
          session_type: sessionType,
          duration: duration,
          payment_type: 'session_completion',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (customerError) {
      console.error('Customer transaction error:', customerError)
      return new Response(
        JSON.stringify({ error: 'Failed to process customer payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add earnings to designer wallet
    const { data: designerTransaction, error: designerError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: designerId,
        amount: amount,
        transaction_type: 'deposit',
        status: 'completed',
        description: `Session earnings - ${sessionType || 'Design Session'}`,
        metadata: {
          transaction_id: designerTransactionId,
          session_id: sessionId,
          customer_id: customerId,
          session_type: sessionType,
          duration: duration,
          earnings_type: 'session_completion',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (designerError) {
      console.error('Designer transaction error:', designerError)
      // Rollback customer transaction
      await supabase
        .from('wallet_transactions')
        .delete()
        .eq('id', customerTransaction.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to process designer earnings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update session status if session table exists
    try {
      await supabase
        .from('sessions')
        .update({ 
          status: 'completed',
          payment_processed: true,
          payment_processed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    } catch (error) {
      console.log('Session table update failed (table may not exist):', error)
    }

    // Create notifications
    try {
      // Customer notification
      await supabase
        .from('notifications')
        .insert({
          user_id: customerId,
          type: 'session_payment',
          title: 'Session Payment Processed',
          message: `$${amount} has been deducted from your wallet for the completed session.`,
          data: {
            amount: amount,
            session_id: sessionId,
            transaction_id: customerTransactionId
          }
        })

      // Designer notification
      await supabase
        .from('notifications')
        .insert({
          user_id: designerId,
          type: 'session_earnings',
          title: 'Session Earnings Added',
          message: `$${amount} has been added to your wallet for the completed session.`,
          data: {
            amount: amount,
            session_id: sessionId,
            transaction_id: designerTransactionId
          }
        })
    } catch (error) {
      console.log('Notification creation failed:', error)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        customerTransaction: {
          id: customerTransaction.id,
          amount: amount,
          type: 'payment'
        },
        designerTransaction: {
          id: designerTransaction.id,
          amount: amount,
          type: 'earnings'
        },
        sessionId: sessionId,
        message: 'Session payment processed successfully'
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
