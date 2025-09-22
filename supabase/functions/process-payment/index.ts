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
    const { amount, designerId, bookingId, description } = await req.json()
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

    if (!designerId) {
      return new Response(
        JSON.stringify({ error: 'Designer ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check customer wallet balance
    const { data: balanceData, error: balanceError } = await supabase.rpc('get_wallet_balance', { user_uuid: user.id })
    if (balanceError) {
      console.error('Balance check error:', balanceError)
      return new Response(
        JSON.stringify({ error: 'Failed to check wallet balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customerBalance = balanceData || 0

    if (customerBalance < amount) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient balance',
          currentBalance: customerBalance,
          requiredAmount: amount,
          shortfall: amount - customerBalance
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get designer profile
    const { data: designerData, error: designerError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .eq('user_id', designerId)
      .single()

    if (designerError || !designerData) {
      return new Response(
        JSON.stringify({ error: 'Designer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Start transaction
    const { data: customerTransaction, error: customerError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        transaction_type: 'payment',
        status: 'completed',
        description: description || `Payment to ${designerData.first_name} ${designerData.last_name}`,
        booking_id: bookingId || null,
        metadata: {
          designer_id: designerId,
          payment_type: 'designer_payment'
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

    // Add money to designer wallet
    const { data: designerTransaction, error: designerTransactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: designerId,
        amount: amount,
        transaction_type: 'deposit',
        status: 'completed',
        description: `Payment from customer for ${description || 'design services'}`,
        booking_id: bookingId || null,
        metadata: {
          customer_id: user.id,
          payment_type: 'designer_earning'
        }
      })
      .select()
      .single()

    if (designerTransactionError) {
      console.error('Designer transaction error:', designerTransactionError)
      // Rollback customer transaction
      await supabase
        .from('wallet_transactions')
        .delete()
        .eq('id', customerTransaction.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to process designer payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notification for designer
    await supabase
      .from('notifications')
      .insert({
        user_id: designerId,
        type: 'payment_received',
        title: 'Payment Received',
        message: `You received $${amount} from a customer for ${description || 'design services'}`,
        data: {
          amount: amount,
          customer_id: user.id,
          booking_id: bookingId
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerTransaction: customerTransaction,
        designerTransaction: designerTransaction,
        newBalance: customerBalance - amount
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



