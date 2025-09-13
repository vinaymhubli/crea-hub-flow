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
    const { amount, bankAccountId, description } = await req.json()
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

    if (!bankAccountId) {
      return new Response(
        JSON.stringify({ error: 'Bank account ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is a designer
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'designer') {
      return new Response(
        JSON.stringify({ error: 'Only designers can withdraw earnings' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check wallet balance (earnings)
    const { data: balanceData, error: balanceError } = await supabase.rpc('get_wallet_balance', { user_uuid: user.id })
    if (balanceError) {
      console.error('Balance check error:', balanceError)
      return new Response(
        JSON.stringify({ error: 'Failed to check wallet balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentBalance = balanceData || 0

    if (currentBalance < amount) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient earnings balance',
          currentBalance: currentBalance,
          requiredAmount: amount,
          shortfall: amount - currentBalance
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get bank account details
    const { data: bankAccount, error: bankError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', bankAccountId)
      .eq('user_id', user.id)
      .single()

    if (bankError || !bankAccount) {
      return new Response(
        JSON.stringify({ error: 'Bank account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!bankAccount.is_verified) {
      return new Response(
        JSON.stringify({ error: 'Bank account must be verified before withdrawal' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique withdrawal ID
    const withdrawalId = `DESIGNER_WDR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create withdrawal transaction
    const { data: withdrawalTransaction, error: withdrawalError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        transaction_type: 'withdrawal',
        status: 'pending',
        description: description || `Designer earnings withdrawal to ${bankAccount.bank_name} - ${bankAccount.account_number.slice(-4)}`,
        metadata: {
          withdrawal_id: withdrawalId,
          bank_account_id: bankAccountId,
          user_type: 'designer',
          bank_details: {
            bank_name: bankAccount.bank_name,
            account_number: bankAccount.account_number.slice(-4), // Only last 4 digits
            ifsc_code: bankAccount.ifsc_code,
            account_holder_name: bankAccount.account_holder_name
          },
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error('Withdrawal transaction error:', withdrawalError)
      return new Response(
        JSON.stringify({ error: 'Failed to create withdrawal request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Simulate bank transfer processing (in real implementation, this would integrate with banking APIs)
    const transferResult = await processDesignerBankTransfer(amount, bankAccount, withdrawalId)

    if (transferResult.success) {
      // Update transaction to completed
      const { error: updateError } = await supabase
        .from('wallet_transactions')
        .update({ 
          status: 'completed',
          metadata: {
            ...withdrawalTransaction.metadata,
            transfer_result: transferResult,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', withdrawalTransaction.id)

      if (updateError) {
        console.error('Failed to update withdrawal transaction:', updateError)
      }

      // Create notification for designer
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'withdrawal_completed',
          title: 'Earnings Withdrawal Completed',
          message: `$${amount} has been transferred to your ${bankAccount.bank_name} account ending in ${bankAccount.account_number.slice(-4)}`,
          data: {
            amount: amount,
            bank_name: bankAccount.bank_name,
            withdrawal_id: withdrawalId
          }
        })
    } else {
      // Update transaction to failed
      const { error: updateError } = await supabase
        .from('wallet_transactions')
        .update({ 
          status: 'failed',
          metadata: {
            ...withdrawalTransaction.metadata,
            transfer_result: transferResult,
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', withdrawalTransaction.id)

      if (updateError) {
        console.error('Failed to update withdrawal transaction:', updateError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: transferResult.success,
        withdrawalId: withdrawalId,
        amount: amount,
        bankAccount: {
          bank_name: bankAccount.bank_name,
          account_number: bankAccount.account_number.slice(-4),
          ifsc_code: bankAccount.ifsc_code
        },
        message: transferResult.message,
        estimatedTime: '1-2 business days',
        newBalance: currentBalance - amount,
        userType: 'designer'
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

// Simulate designer bank transfer processing
async function processDesignerBankTransfer(amount: number, bankAccount: any, withdrawalId: string) {
  console.log('Processing designer bank transfer:', { amount, bankAccount, withdrawalId })
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulate success (in real implementation, this would call banking APIs)
  return {
    success: true,
    message: 'Designer earnings withdrawal initiated successfully',
    transferId: `DESIGNER_TRF_${withdrawalId}`,
    status: 'processing',
    estimatedCompletion: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day for designers
  }
}
