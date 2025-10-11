import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Razorpay configuration
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

interface RazorpayOrderResponse {
  id: string
  amount: number
  currency: string
  status: string
  receipt: string
  created_at: number
}

interface RazorpayPaymentResponse {
  id: string
  order_id: string
  amount: number
  currency: string
  status: string
  method: string
  description: string
  created_at: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency = 'INR', action, payment_id, order_id } = await req.json()
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

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Razorpay configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle different actions
    if (action === 'create_order') {
      return await createRazorpayOrder(supabase, user, amount, currency)
    } else if (action === 'verify_payment') {
      return await verifyAndCompletePayment(supabase, user, payment_id, order_id)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "create_order" or "verify_payment"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


  } catch (error) {
    console.error('Razorpay wallet recharge error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createRazorpayOrder(supabase: any, user: any, amount: number, currency: string) {
  try {
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating Razorpay order for wallet recharge:', {
      amount,
      currency,
      userId: user.id
    })

    // Generate unique receipt ID
    const receiptId = `WALLET_RECHARGE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create Razorpay order
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: receiptId,
      notes: {
        user_id: user.id,
        type: 'wallet_recharge',
        description: `Wallet recharge of ₹${amount}`
      }
    }

    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json()
      console.error('Razorpay order creation failed:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment order', details: errorData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const order: RazorpayOrderResponse = await orderResponse.json()

    // Don't create transaction record yet - only create after successful payment verification
    console.log('Order created successfully, waiting for payment completion:', order.id)

    // Return order details for frontend
    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          key: RAZORPAY_KEY_ID,
          name: 'meetmydesigners',
          description: `Wallet recharge of ₹${amount}`,
          prefill: {
            name: user.user_metadata?.full_name || '',
            email: user.email || '',
            contact: user.user_metadata?.phone || ''
          },
          theme: {
            color: '#059669' // green-600 to match meetmydesigners website theme
          }
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Order creation error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create order', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function verifyAndCompletePayment(supabase: any, user: any, paymentId: string, orderId: string) {
  try {
    if (!paymentId || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID and Order ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Verifying payment:', { paymentId, orderId, userId: user.id })

    // Verify payment with Razorpay
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET)}`,
        'Content-Type': 'application/json',
      }
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json()
      console.error('Payment verification failed:', errorData)
      return new Response(
        JSON.stringify({ error: 'Payment verification failed', details: errorData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payment: RazorpayPaymentResponse = await paymentResponse.json()

    // Check if payment is captured and matches the order
    if (payment.status !== 'captured' || payment.order_id !== orderId) {
      return new Response(
        JSON.stringify({ 
          error: 'Payment not successful or order mismatch',
          payment_status: payment.status,
          order_match: payment.order_id === orderId
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create new transaction record only after successful payment verification
    const { data: newTransaction, error: insertError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: payment.amount / 100, // Convert from paise to rupees
        transaction_type: 'deposit',
        status: 'completed',
        description: `Wallet recharge completed - Payment ${paymentId}`,
        metadata: {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          payment_method: payment.method,
          payment_status: payment.status,
          payment_gateway: 'razorpay',
          currency: payment.currency,
          completed_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create transaction:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to record transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate invoice for the wallet recharge - SAME WAY as session payments
    try {
      const { data: invoiceData, error: invoiceError } = await supabase.rpc('generate_session_invoices', {
        p_session_id: 'WALLET_RECHARGE_' + Date.now(),
        p_booking_id: null,
        p_customer_id: user.id,
        p_designer_id: user.id,
        p_amount: payment.amount / 100, // Convert from paise to rupees
        p_template_id: null
      })

      if (invoiceError) {
        console.error('Failed to generate invoice:', invoiceError)
        // Don't fail the transaction if invoice generation fails, just log it
      } else {
        console.log('Invoice generated successfully:', invoiceData)
        
        // Update transaction with invoice reference
        if (invoiceData && invoiceData.length > 0) {
          await supabase
            .from('wallet_transactions')
            .update({
              metadata: {
                ...newTransaction.metadata,
                invoice_id: invoiceData[0]?.customer_invoice_id,
                invoice_number: invoiceData[0]?.customer_invoice_number
              }
            })
            .eq('id', newTransaction.id)
        }
      }
    } catch (invoiceError) {
      console.error('Invoice generation error:', invoiceError)
      // Continue without failing the transaction
    }

    console.log('Payment verified and wallet credited:', {
      transactionId: newTransaction.id,
      amount: newTransaction.amount,
      paymentId: paymentId
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and wallet credited successfully',
        transaction: {
          id: newTransaction.id,
          amount: newTransaction.amount,
          status: 'completed',
          payment_id: paymentId
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Payment verification error:', error)
    return new Response(
      JSON.stringify({ error: 'Payment verification failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}





