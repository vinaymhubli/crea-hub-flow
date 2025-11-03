import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

// Razorpay configuration
const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')

interface RazorpayWebhookEvent {
  entity: string
  account_id: string
  event: string
  contains: string[]
  payload: {
    payment?: {
      entity: {
        id: string
        order_id: string
        amount: number
        currency: string
        status: string
        method: string
        created_at: number
      }
    }
    payout?: {
      entity: {
        id: string
        account_number: string
        fund_account_id: string
        amount: number
        currency: string
        status: string
        created_at: number
      }
    }
  }
  created_at: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature || !RAZORPAY_WEBHOOK_SECRET) {
      console.error('Missing webhook signature or secret')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify webhook signature
    const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const event: RazorpayWebhookEvent = JSON.parse(body)
    console.log('Razorpay webhook received:', event.event)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Handle payment events
    if (event.event === 'payment.captured' && event.payload.payment) {
      const payment = event.payload.payment.entity
      
      // Find transaction by order ID
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('metadata->razorpay_order_id', payment.order_id)
        .eq('status', 'pending')
        .single()

      if (transaction && !transactionError) {
        // Update transaction to completed
        await supabase
          .from('wallet_transactions')
          .update({
            status: 'completed',
            description: `Wallet recharge via Razorpay - Payment ${payment.id}`,
            metadata: {
              ...transaction.metadata,
              razorpay_payment_id: payment.id,
              payment_method: payment.method,
              payment_status: payment.status,
              webhook_processed_at: new Date().toISOString()
            }
          })
          .eq('id', transaction.id)

        console.log('Payment transaction updated:', transaction.id)
      }
    }

    // Handle payout events
    if (event.event === 'payout.processed' && event.payload.payout) {
      const payout = event.payload.payout.entity
      
      // Find withdrawal transaction by payout ID
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('metadata->razorpay_payout_id', payout.id)
        .single()

      if (transaction && !transactionError) {
        // Update transaction to completed
        await supabase
          .from('wallet_transactions')
          .update({
            status: 'completed',
            description: `Withdrawal completed - Payout ${payout.id}`,
            metadata: {
              ...transaction.metadata,
              payout_status: payout.status,
              webhook_processed_at: new Date().toISOString()
            }
          })
          .eq('id', transaction.id)

        console.log('Withdrawal transaction updated:', transaction.id)
      }
    }

    // Handle failed payments/payouts
    if ((event.event === 'payment.failed' || event.event === 'payout.failed') && 
        (event.payload.payment || event.payload.payout)) {
      
      let transactionId = null
      let metadata = {}

      if (event.payload.payment) {
        const payment = event.payload.payment.entity
        transactionId = payment.order_id
        metadata = { razorpay_payment_id: payment.id, payment_status: payment.status }
      } else if (event.payload.payout) {
        const payout = event.payload.payout.entity
        transactionId = payout.id
        metadata = { razorpay_payout_id: payout.id, payout_status: payout.status }
      }

      if (transactionId) {
        // Find and update failed transaction
        const { data: transaction } = await supabase
          .from('wallet_transactions')
          .select('*')
          .or(`metadata->razorpay_order_id.eq.${transactionId},metadata->razorpay_payout_id.eq.${transactionId}`)
          .eq('status', 'pending')
          .single()

        if (transaction) {
          await supabase
            .from('wallet_transactions')
            .update({
              status: 'failed',
              description: `Transaction failed - ${event.event}`,
              metadata: {
                ...transaction.metadata,
                ...metadata,
                webhook_processed_at: new Date().toISOString()
              }
            })
            .eq('id', transaction.id)

          console.log('Failed transaction updated:', transaction.id)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})















