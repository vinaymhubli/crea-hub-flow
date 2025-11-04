import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Razorpay configuration
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

interface RazorpayPayoutResponse {
  id: string
  account_number: string
  fund_account_id: string
  amount: number
  currency: string
  mode: string
  purpose: string
  status: string
  created_at: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, bank_account_id, purpose = 'payout' } = await req.json()
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

    if (!bank_account_id) {
      return new Response(
        JSON.stringify({ error: 'Bank account ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Razorpay configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing Razorpay withdrawal:', {
      amount,
      bank_account_id,
      userId: user.id
    })

    // Get user's wallet balance
    const { data: balanceData, error: balanceError } = await supabase.rpc('get_wallet_balance', { user_uuid: user.id })
    if (balanceError) throw balanceError

    const currentBalance = balanceData || 0
    if (currentBalance < amount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient wallet balance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get bank account details
    const { data: bankAccount, error: bankAccountError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', bank_account_id)
      .eq('user_id', user.id)
      .eq('is_verified', true)
      .single()

    if (bankAccountError || !bankAccount) {
      return new Response(
        JSON.stringify({ error: 'Bank account not found or not verified' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check minimum withdrawal amount
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('minimum_withdrawal_amount, maximum_withdrawal_amount')
      .single()

    const minAmount = settings?.minimum_withdrawal_amount || 100
    const maxAmount = settings?.maximum_withdrawal_amount || 50000

    if (amount < minAmount) {
      return new Response(
        JSON.stringify({ error: `Minimum withdrawal amount is ₹${minAmount}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (amount > maxAmount) {
      return new Response(
        JSON.stringify({ error: `Maximum withdrawal amount is ₹${maxAmount}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create fund account in Razorpay if not exists
    let fundAccountId = bankAccount.metadata?.razorpay_fund_account_id

    if (!fundAccountId) {
      const fundAccountData = {
        contact: {
          name: bankAccount.account_holder_name,
          email: user.email,
          contact: user.user_metadata?.phone || '',
          type: 'customer'
        },
        account_type: 'bank_account',
        bank_account: {
          name: bankAccount.account_holder_name,
          ifsc: bankAccount.ifsc_code,
          account_number: bankAccount.account_number
        }
      }

      const fundAccountResponse = await fetch('https://api.razorpay.com/v1/fund_accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fundAccountData)
      })

      if (!fundAccountResponse.ok) {
        const errorData = await fundAccountResponse.json()
        console.error('Failed to create fund account:', errorData)
        return new Response(
          JSON.stringify({ error: 'Failed to create fund account', details: errorData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const fundAccount = await fundAccountResponse.json()
      fundAccountId = fundAccount.id

      // Update bank account with fund account ID
      await supabase
        .from('bank_accounts')
        .update({
          metadata: {
            ...bankAccount.metadata,
            razorpay_fund_account_id: fundAccountId
          }
        })
        .eq('id', bank_account_id)
    }

    // Create payout
    const payoutData = {
      account_number: '2323230041361845', // Your Razorpay account number
      fund_account: {
        id: fundAccountId
      },
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      mode: 'IMPS',
      purpose: purpose,
      queue_if_low_balance: true,
      reference_id: `WITHDRAWAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      narration: `Withdrawal to ${bankAccount.account_holder_name}`
    }

    const payoutResponse = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payoutData)
    })

    if (!payoutResponse.ok) {
      const errorData = await payoutResponse.json()
      console.error('Payout creation failed:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to create payout', details: errorData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payout: RazorpayPayoutResponse = await payoutResponse.json()

    // Create withdrawal transaction
    const { error: insertError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        transaction_type: 'withdrawal',
        status: payout.status === 'processed' ? 'completed' : 'pending',
        description: `Withdrawal to ${bankAccount.bank_name} - ${bankAccount.account_number}`,
        metadata: {
          razorpay_payout_id: payout.id,
          razorpay_fund_account_id: fundAccountId,
          bank_account_id: bank_account_id,
          bank_name: bankAccount.bank_name,
          account_number: bankAccount.account_number,
          ifsc_code: bankAccount.ifsc_code,
          payout_status: payout.status,
          created_at: new Date().toISOString()
        }
      })

    if (insertError) {
      console.error('Database error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to record withdrawal transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Withdrawal processed successfully:', {
      payout_id: payout.id,
      amount: amount,
      status: payout.status
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Withdrawal request submitted successfully',
        payout: {
          id: payout.id,
          amount: amount,
          status: payout.status,
          account_number: payout.account_number,
          created_at: payout.created_at
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Withdrawal processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

















