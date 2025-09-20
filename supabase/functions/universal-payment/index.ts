import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Payment method configurations
const PAYMENT_METHODS = {
  upi: {
    name: 'UPI',
    icon: '📱',
    description: 'Pay using UPI ID or QR code',
    enabled: true
  },
  card: {
    name: 'Credit/Debit Card',
    icon: '💳',
    description: 'Pay using your card',
    enabled: true
  },
  netbanking: {
    name: 'Net Banking',
    icon: '🏦',
    description: 'Pay using net banking',
    enabled: true
  },
  wallet: {
    name: 'Digital Wallet',
    icon: '💰',
    description: 'Pay using digital wallets',
    enabled: true
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, paymentMethod, userDetails } = await req.json()
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

    if (!paymentMethod || !PAYMENT_METHODS[paymentMethod]) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid payment method',
          availableMethods: Object.keys(PAYMENT_METHODS)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Universal Payment Processing:', {
      amount: amount,
      paymentMethod: paymentMethod,
      userId: user.id
    });

    // Generate unique transaction ID
    const transactionId = `UNI_TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Store pending transaction in database
    const { error: insertError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        transaction_type: 'deposit',
        status: 'pending',
        description: `Wallet top-up via ${PAYMENT_METHODS[paymentMethod].name} - ${transactionId}`,
        metadata: {
          transaction_id: transactionId,
          payment_method: paymentMethod,
          payment_gateway: 'universal',
          user_details: userDetails || {},
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

    // Wallet recharge - NO TAXES APPLIED
    // User pays the exact amount they want to recharge
    const finalAmount = amount
    console.log('Wallet recharge - no taxes applied, amount:', finalAmount)

    // Simulate payment processing based on method
    const paymentResult = await processPaymentByMethod(paymentMethod, amount, transactionId, userDetails)

    if (paymentResult.success) {
      // Update transaction to completed (no tax information for wallet recharge)
      const { error: updateError } = await supabase
        .from('wallet_transactions')
        .update({ 
          status: 'completed',
          amount: finalAmount,
          metadata: {
            transaction_id: transactionId,
            payment_method: paymentMethod,
            payment_gateway: 'universal',
            user_details: userDetails || {},
            payment_result: paymentResult,
            transaction_type: 'wallet_recharge',
            completed_at: new Date().toISOString()
          }
        })
        .eq('metadata->>transaction_id', transactionId)

      if (updateError) {
        console.error('Failed to update transaction:', updateError)
      } else {
        // Generate simple invoice for wallet recharge (NO TAX)
        try {
          console.log('Generating simple invoice for wallet recharge:', transactionId)
          const { data: invoiceData, error: invoiceError } = await supabase.rpc('generate_wallet_recharge_invoice', {
            p_user_id: user.id,
            p_transaction_id: transactionId,
            p_amount: amount,
            p_description: `Wallet Recharge - ${paymentMethod.toUpperCase()}`
          })

          if (invoiceError) {
            console.error('Invoice generation failed:', invoiceError)
            // Don't fail the payment if invoice generation fails
          } else {
            console.log('Recharge invoice generated successfully:', invoiceData)
          }
        } catch (error) {
          console.error('Invoice generation error:', error)
          // Don't fail the payment if invoice generation fails
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: paymentResult.success,
        transactionId: transactionId,
        paymentMethod: paymentMethod,
        amount: amount,
        redirectUrl: paymentResult.redirectUrl,
        message: paymentResult.message,
        paymentDetails: paymentResult.paymentDetails
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

// Process payment based on method
async function processPaymentByMethod(method: string, amount: number, transactionId: string, userDetails: any) {
  switch (method) {
    case 'upi':
      return await processUPIPayment(amount, transactionId, userDetails)
    case 'card':
      return await processCardPayment(amount, transactionId, userDetails)
    case 'netbanking':
      return await processNetBankingPayment(amount, transactionId, userDetails)
    case 'wallet':
      return await processWalletPayment(amount, transactionId, userDetails)
    default:
      return {
        success: false,
        message: 'Payment method not supported'
      }
  }
}

// UPI Payment Processing
async function processUPIPayment(amount: number, transactionId: string, userDetails: any) {
  // Simulate UPI payment processing
  console.log('Processing UPI Payment:', { amount, transactionId, userDetails })
  
  return {
    success: true,
    message: 'UPI payment processed successfully',
    redirectUrl: `/customer-dashboard/wallet?payment_success=true&amount=${amount}&txn_id=${transactionId}&method=upi`,
    paymentDetails: {
      upiId: userDetails?.upiId || 'test@upi',
      transactionRef: `UPI_${transactionId}`,
      status: 'completed'
    }
  }
}

// Card Payment Processing
async function processCardPayment(amount: number, transactionId: string, userDetails: any) {
  // Simulate card payment processing
  console.log('Processing Card Payment:', { amount, transactionId, userDetails })
  
  return {
    success: true,
    message: 'Card payment processed successfully',
    redirectUrl: `/customer-dashboard/wallet?payment_success=true&amount=${amount}&txn_id=${transactionId}&method=card`,
    paymentDetails: {
      cardLast4: userDetails?.cardLast4 || '1234',
      cardType: userDetails?.cardType || 'Visa',
      transactionRef: `CARD_${transactionId}`,
      status: 'completed'
    }
  }
}

// Net Banking Payment Processing
async function processNetBankingPayment(amount: number, transactionId: string, userDetails: any) {
  // Simulate net banking payment processing
  console.log('Processing Net Banking Payment:', { amount, transactionId, userDetails })
  
  return {
    success: true,
    message: 'Net banking payment processed successfully',
    redirectUrl: `/customer-dashboard/wallet?payment_success=true&amount=${amount}&txn_id=${transactionId}&method=netbanking`,
    paymentDetails: {
      bankName: userDetails?.bankName || 'Test Bank',
      transactionRef: `NET_${transactionId}`,
      status: 'completed'
    }
  }
}

// Digital Wallet Payment Processing
async function processWalletPayment(amount: number, transactionId: string, userDetails: any) {
  // Simulate digital wallet payment processing
  console.log('Processing Digital Wallet Payment:', { amount, transactionId, userDetails })
  
  return {
    success: true,
    message: 'Digital wallet payment processed successfully',
    redirectUrl: `/customer-dashboard/wallet?payment_success=true&amount=${amount}&txn_id=${transactionId}&method=wallet`,
    paymentDetails: {
      walletType: userDetails?.walletType || 'Paytm',
      transactionRef: `WALLET_${transactionId}`,
      status: 'completed'
    }
  }
}
