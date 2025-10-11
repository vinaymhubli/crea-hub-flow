import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Razorpay configuration
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

interface RazorpayFundAccountResponse {
  id: string
  entity: string
  contact_id: string
  account_type: string
  bank_account: {
    name: string
    ifsc: string
    account_number: string
  }
  batch_id?: string
  active: boolean
  created_at: number
}

interface RazorpayPayoutResponse {
  id: string
  entity: string
  fund_account_id: string
  amount: number
  currency: string
  notes: any
  fees: number
  tax: number
  status: string
  purpose: string
  utr: string
  mode: string
  reference_id: string
  narration: string
  batch_id?: string
  failure_reason?: string
  created_at: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bank_account_id, action } = await req.json()
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

    // Get bank account details
    const { data: bankAccount, error: bankAccountError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', bank_account_id)
      .eq('user_id', user.id)
      .single()

    if (bankAccountError || !bankAccount) {
      return new Response(
        JSON.stringify({ error: 'Bank account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'initiate_penny_drop') {
      return await initiatePennyDrop(supabase, bankAccount, user)
    } else if (action === 'verify_penny_drop') {
      const { amount_received } = await req.json()
      return await verifyPennyDrop(supabase, bankAccount, amount_received)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Penny drop error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function initiatePennyDrop(supabase: any, bankAccount: any, user: any) {
  try {
    console.log('Initiating penny drop for bank account:', bankAccount.id)

    // Step 1: Create contact in Razorpay
    const contactData = {
      name: bankAccount.account_holder_name,
      email: user.email,
      contact: user.user_metadata?.phone || '9999999999',
      type: 'customer',
      reference_id: `USER_${user.id}`,
      notes: {
        user_id: user.id,
        bank_account_id: bankAccount.id
      }
    }

    const contactResponse = await fetch('https://api.razorpay.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData)
    })

    if (!contactResponse.ok) {
      const errorData = await contactResponse.json()
      console.error('Failed to create contact:', errorData)
      throw new Error('Failed to create contact in Razorpay')
    }

    const contact = await contactResponse.json()
    console.log('Contact created:', contact.id)

    // Step 2: Create fund account
    const fundAccountData = {
      contact_id: contact.id,
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
      throw new Error('Failed to create fund account in Razorpay')
    }

    const fundAccount: RazorpayFundAccountResponse = await fundAccountResponse.json()
    console.log('Fund account created:', fundAccount.id)

    // Step 3: Generate random penny drop amount (₹1.00 to ₹9.99)
    const pennyAmount = Math.floor(Math.random() * 899) + 100 // 100 to 999 paise (₹1.00 to ₹9.99)
    
    // Step 4: Create payout for penny drop
    const payoutData = {
      account_number: '2323230041361845', // Your Razorpay account number
      fund_account_id: fundAccount.id,
      amount: pennyAmount,
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: `PENNY_DROP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      narration: `Account verification for ${bankAccount.account_holder_name}`,
      notes: {
        verification_type: 'penny_drop',
        user_id: user.id,
        bank_account_id: bankAccount.id,
        expected_amount: pennyAmount
      }
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
      throw new Error('Failed to initiate penny drop payout')
    }

    const payout: RazorpayPayoutResponse = await payoutResponse.json()
    console.log('Penny drop payout created:', payout.id)

    // Step 5: Store verification record
    const { error: insertError } = await supabase
      .from('bank_account_verifications')
      .insert({
        bank_account_id: bankAccount.id,
        method: 'penny_drop',
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        metadata: {
          razorpay_contact_id: contact.id,
          razorpay_fund_account_id: fundAccount.id,
          razorpay_payout_id: payout.id,
          expected_amount: pennyAmount,
          amount_in_rupees: (pennyAmount / 100).toFixed(2)
        }
      })

    if (insertError) {
      console.error('Failed to store verification record:', insertError)
      throw new Error('Failed to store verification record')
    }

    // Update bank account with Razorpay IDs
    await supabase
      .from('bank_accounts')
      .update({
        metadata: {
          ...bankAccount.metadata,
          razorpay_contact_id: contact.id,
          razorpay_fund_account_id: fundAccount.id,
          penny_drop_initiated: true
        }
      })
      .eq('id', bankAccount.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Penny drop initiated successfully',
        data: {
          payout_id: payout.id,
          expected_amount_display: `₹${(pennyAmount / 100).toFixed(2)}`,
          status: payout.status,
          estimated_time: '2-4 hours'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Penny drop initiation error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to initiate penny drop' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function verifyPennyDrop(supabase: any, bankAccount: any, amountReceived: string) {
  try {
    console.log('Verifying penny drop for bank account:', bankAccount.id)

    // Get verification record
    const { data: verification, error: verificationError } = await supabase
      .from('bank_account_verifications')
      .select('*')
      .eq('bank_account_id', bankAccount.id)
      .eq('method', 'penny_drop')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verificationError || !verification) {
      return new Response(
        JSON.stringify({ error: 'No pending penny drop verification found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if expired
    if (new Date() > new Date(verification.expires_at)) {
      await supabase
        .from('bank_account_verifications')
        .update({ status: 'expired' })
        .eq('id', verification.id)

      return new Response(
        JSON.stringify({ error: 'Verification expired. Please initiate a new penny drop.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const expectedAmount = verification.metadata.expected_amount
    const receivedAmountPaise = Math.round(parseFloat(amountReceived) * 100)

    console.log('Amount verification:', {
      expected: expectedAmount,
      received: receivedAmountPaise,
      match: expectedAmount === receivedAmountPaise
    })

    if (expectedAmount === receivedAmountPaise) {
      // Verification successful
      await supabase
        .from('bank_account_verifications')
        .update({
          status: 'completed',
          verified_at: new Date().toISOString(),
          attempts: (verification.attempts || 0) + 1
        })
        .eq('id', verification.id)

      // Mark bank account as verified
      await supabase
        .from('bank_accounts')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_method: 'penny_drop'
        })
        .eq('id', bankAccount.id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Bank account verified successfully!',
          verified: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Verification failed
      const attempts = (verification.attempts || 0) + 1
      const maxAttempts = 3

      if (attempts >= maxAttempts) {
        await supabase
          .from('bank_account_verifications')
          .update({
            status: 'failed',
            attempts: attempts
          })
          .eq('id', verification.id)

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Maximum verification attempts exceeded. Please contact support.',
            attempts_remaining: 0
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        await supabase
          .from('bank_account_verifications')
          .update({ attempts: attempts })
          .eq('id', verification.id)

        return new Response(
          JSON.stringify({
            success: false,
            error: `Incorrect amount. Expected ₹${(expectedAmount / 100).toFixed(2)}, received ₹${amountReceived}`,
            attempts_remaining: maxAttempts - attempts
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

  } catch (error) {
    console.error('Penny drop verification error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to verify penny drop' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
