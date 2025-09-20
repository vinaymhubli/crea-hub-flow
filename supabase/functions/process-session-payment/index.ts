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

    // NEW TAX SYSTEM: Calculate GST, TDS, and Admin Commission
    console.log('Calculating taxes and fees for session amount:', amount)
    
    // Get customer's state for GST calculation
    const { data: customerProfile, error: customerError } = await supabase
      .from('profiles')
      .select('state, state_code')
      .eq('user_id', customerId)
      .single()

    // Get active commission settings
    const { data: commissionSettings, error: commissionError } = await supabase
      .from('commission_settings')
      .select('*')
      .eq('is_active', true)
      .lte('min_transaction_amount', amount)
      .or(`max_transaction_amount.is.null,max_transaction_amount.gte.${amount}`)
      .order('created_at', { ascending: false })
      .limit(1)
    
    // Get TDS settings
    const { data: tdsSettings, error: tdsError } = await supabase
      .from('tds_settings')
      .select('tds_rate')
      .eq('is_active', true)
      .single()

    if (commissionError || tdsError) {
      console.error('Settings error:', { commissionError, tdsError })
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate Admin Commission
    let commissionAmount = 0
    let commissionSetting = null
    
    if (commissionSettings && commissionSettings.length > 0) {
      commissionSetting = commissionSettings[0]
      console.log('Using commission setting:', commissionSetting)
      
      if (commissionSetting.commission_type === 'percentage') {
        commissionAmount = (amount * commissionSetting.commission_value) / 100
      } else if (commissionSetting.commission_type === 'fixed') {
        commissionAmount = commissionSetting.commission_value
      }
      
      // Ensure commission doesn't exceed the transaction amount
      commissionAmount = Math.min(commissionAmount, amount)
    }

    // Calculate TDS
    const tdsRate = tdsSettings?.tds_rate || 10.00
    const tdsAmount = (amount * tdsRate) / 100

    // Calculate GST (CGST + SGST) based on customer's state
    let gstRates = { cgst_rate: 0, sgst_rate: 0, igst_rate: 0 }
    let gstAmounts = { cgst_amount: 0, sgst_amount: 0, igst_amount: 0, total_gst: 0 }
    
    if (customerProfile && customerProfile.state_code) {
      // Get tax rates for customer's state
      const { data: taxSettings, error: taxError } = await supabase
        .from('invoice_settings')
        .select('cgst_rate, sgst_rate, igst_rate')
        .eq('state_code', customerProfile.state_code)
        .eq('is_active', true)
        .single()

      if (taxSettings && !taxError) {
        gstRates = {
          cgst_rate: taxSettings.cgst_rate || 0,
          sgst_rate: taxSettings.sgst_rate || 0,
          igst_rate: taxSettings.igst_rate || 0
        }

        gstAmounts = {
          cgst_amount: (amount * gstRates.cgst_rate) / 100,
          sgst_amount: (amount * gstRates.sgst_rate) / 100,
          igst_amount: (amount * gstRates.igst_rate) / 100,
          total_gst: ((amount * gstRates.cgst_rate) / 100) + ((amount * gstRates.sgst_rate) / 100) + ((amount * gstRates.igst_rate) / 100)
        }
      }
    }

    // Calculate total amount customer needs to pay
    const totalCustomerAmount = amount + gstAmounts.total_gst
    const designerAmount = amount - commissionAmount - tdsAmount
    
    console.log('Session payment calculation:', {
      sessionAmount: amount,
      gstRates,
      gstAmounts,
      tdsRate,
      tdsAmount,
      commissionAmount,
      totalCustomerAmount,
      designerAmount
    })

    // Generate unique transaction IDs
    const customerTransactionId = `SESSION_PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const designerTransactionId = `SESSION_EARN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const commissionTransactionId = `COMMISSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Customer pays total amount (session amount + GST)
    const { data: customerTransaction, error: customerError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: customerId,
        amount: totalCustomerAmount, // Customer pays session amount + GST
        transaction_type: 'payment',
        status: 'completed',
        description: `Session payment - ${sessionType || 'Design Session'} (including GST)`,
        metadata: {
          transaction_id: customerTransactionId,
          session_id: sessionId,
          designer_id: designerId,
          session_type: sessionType,
          duration: duration,
          payment_type: 'session_completion',
          tax_calculation: {
            session_amount: amount,
            gst_rates: gstRates,
            gst_amounts: gstAmounts,
            total_customer_amount: totalCustomerAmount
          },
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

    // Add earnings to designer wallet (amount minus commission and TDS)
    const { data: designerTransaction, error: designerError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: designerId,
        amount: designerAmount,
        transaction_type: 'deposit',
        status: 'completed',
        description: `Session earnings - ${sessionType || 'Design Session'} (after commission & TDS)`,
        metadata: {
          transaction_id: designerTransactionId,
          session_id: sessionId,
          customer_id: customerId,
          session_type: sessionType,
          duration: duration,
          earnings_type: 'session_completion',
          original_amount: amount,
          commission_amount: commissionAmount,
          tds_amount: tdsAmount,
          tds_rate: tdsRate,
          final_amount: designerAmount,
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

    // Record admin commission earnings if commission was charged
    if (commissionAmount > 0 && commissionSetting) {
      try {
        console.log('Recording admin commission earnings:', commissionAmount)
        
        const { error: commissionError } = await supabase
          .from('admin_earnings')
          .insert({
            transaction_id: commissionTransactionId,
            commission_amount: commissionAmount,
            commission_type: commissionSetting.commission_type,
            commission_value: commissionSetting.commission_value,
            original_amount: amount,
            session_id: sessionId,
            customer_id: customerId,
            designer_id: designerId
          })

        if (commissionError) {
          console.error('Failed to record commission earnings:', commissionError)
          // Don't fail the payment if commission recording fails
        } else {
          console.log('Admin commission recorded successfully')
        }
      } catch (error) {
        console.error('Commission recording error:', error)
        // Don't fail the payment if commission recording fails
      }
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
          message: `₹${amount} has been deducted from your wallet for the completed session.`,
          data: {
            amount: amount,
            session_id: sessionId,
            transaction_id: customerTransactionId
          }
        })

      // Designer notification (show amount after commission)
      await supabase
        .from('notifications')
        .insert({
          user_id: designerId,
          type: 'session_earnings',
          title: 'Session Earnings Added',
          message: commissionAmount > 0 
            ? `₹${designerAmount} has been added to your wallet for the completed session (₹${commissionAmount} admin commission deducted).`
            : `₹${designerAmount} has been added to your wallet for the completed session.`,
          data: {
            amount: designerAmount,
            original_amount: amount,
            commission_amount: commissionAmount,
            session_id: sessionId,
            transaction_id: designerTransactionId
          }
        })
    } catch (error) {
      console.log('Notification creation failed:', error)
    }

    // Generate invoices for session payment (wallet-to-wallet with admin commission)
    try {
      console.log('Generating invoices for session payment:', sessionId)
      const { data: invoiceData, error: invoiceError } = await supabase.rpc('generate_session_invoices', {
        p_session_id: sessionId,
        p_customer_id: customerId,
        p_designer_id: designerId,
        p_amount: amount,
        p_booking_id: null
      })

      if (invoiceError) {
        console.error('Invoice generation failed:', invoiceError)
        // Don't fail the payment if invoice generation fails
      } else {
        console.log('Session payment invoices generated successfully:', invoiceData)
      }
    } catch (error) {
      console.error('Invoice generation error:', error)
      // Don't fail the payment if invoice generation fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        customerTransaction: {
          id: customerTransaction.id,
          amount: totalCustomerAmount, // Customer paid session amount + GST
          type: 'payment'
        },
        designerTransaction: {
          id: designerTransaction.id,
          amount: designerAmount, // Designer gets amount minus commission and TDS
          type: 'earnings'
        },
        taxBreakdown: {
          sessionAmount: amount,
          gstAmount: gstAmounts.total_gst,
          cgstAmount: gstAmounts.cgst_amount,
          sgstAmount: gstAmounts.sgst_amount,
          tdsAmount: tdsAmount,
          tdsRate: tdsRate,
          totalCustomerAmount: totalCustomerAmount
        },
        commission: {
          amount: commissionAmount,
          type: commissionSetting?.commission_type || 'none',
          value: commissionSetting?.commission_value || 0
        },
        sessionId: sessionId,
        message: `Session payment processed successfully. Customer paid ₹${totalCustomerAmount} (₹${amount} + ₹${gstAmounts.total_gst} GST). Designer received ₹${designerAmount} after ₹${commissionAmount} commission and ₹${tdsAmount} TDS deduction.`
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


