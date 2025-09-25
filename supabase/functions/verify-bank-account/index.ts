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
    const { action, bankAccountId, otp, verificationMethod } = await req.json()
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

    if (!bankAccountId) {
      return new Response(
        JSON.stringify({ error: 'Bank account ID required' }),
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

    if (action === 'send_otp') {
      return await sendOTP(supabase, bankAccount, verificationMethod)
    } else if (action === 'verify_otp') {
      return await verifyOTP(supabase, bankAccount, otp)
    } else if (action === 'auto_verify') {
      return await autoVerify(supabase, bankAccount)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Send OTP for verification
async function sendOTP(supabase: any, bankAccount: any, method: string) {
  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabase
      .from('bank_account_verifications')
      .upsert({
        bank_account_id: bankAccount.id,
        otp: otp,
        method: method,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        status: 'pending'
      })

    if (otpError) {
      console.error('Error storing OTP:', otpError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send OTP based on method
    let sent = false
    let message = ''

    if (method === 'sms') {
      // In production, integrate with SMS service like Twilio, AWS SNS, etc.
      sent = await sendSMS(bankAccount.phone || '', otp)
      message = 'OTP sent to your registered mobile number'
    } else if (method === 'email') {
      // In production, integrate with email service
      sent = await sendEmail(bankAccount.email || '', otp)
      message = 'OTP sent to your registered email address'
    } else if (method === 'bank_api') {
      // In production, integrate with bank APIs for micro-deposits
      sent = await sendMicroDeposit(bankAccount)
      message = 'Micro-deposit sent to your account for verification'
    }

    if (!sent) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send OTP',
          message: 'Please try again or contact support'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: message,
        method: method,
        expiresIn: 600 // 10 minutes in seconds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending OTP:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send OTP' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Verify OTP
async function verifyOTP(supabase: any, bankAccount: any, otp: string) {
  try {
    // Get stored OTP
    const { data: verification, error: verificationError } = await supabase
      .from('bank_account_verifications')
      .select('*')
      .eq('bank_account_id', bankAccount.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verificationError || !verification) {
      return new Response(
        JSON.stringify({ error: 'No pending verification found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if OTP is expired
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'OTP has expired. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check attempts
    if (verification.attempts >= 3) {
      return new Response(
        JSON.stringify({ error: 'Too many failed attempts. Please request a new OTP.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify OTP
    if (verification.otp !== otp) {
      // Increment attempts
      await supabase
        .from('bank_account_verifications')
        .update({ attempts: verification.attempts + 1 })
        .eq('id', verification.id)

      return new Response(
        JSON.stringify({ 
          error: 'Invalid OTP',
          attemptsLeft: 3 - (verification.attempts + 1)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OTP is correct - verify the bank account
    const { error: updateError } = await supabase
      .from('bank_accounts')
      .update({ 
        is_verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', bankAccount.id)

    if (updateError) {
      console.error('Error updating bank account:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark verification as completed
    await supabase
      .from('bank_account_verifications')
      .update({ 
        status: 'completed',
        verified_at: new Date().toISOString()
      })
      .eq('id', verification.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Bank account verified successfully!',
        verified: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error verifying OTP:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to verify OTP' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Auto verification using bank APIs
async function autoVerify(supabase: any, bankAccount: any) {
  try {
    // In production, integrate with bank APIs like:
    // - Razorpay Bank Account Verification
    // - PayU Bank Verification
    // - Direct bank APIs
    
    const verificationResult = await verifyWithBankAPI(bankAccount)
    
    if (verificationResult.success) {
      // Update bank account as verified
      const { error: updateError } = await supabase
        .from('bank_accounts')
        .update({ 
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_method: 'auto'
        })
        .eq('id', bankAccount.id)

      if (updateError) {
        console.error('Error updating bank account:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to verify account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Bank account verified automatically!',
          verified: true,
          method: 'auto'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Automatic verification failed. Please use OTP verification.',
          error: verificationResult.error
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error in auto verification:', error)
    return new Response(
      JSON.stringify({ error: 'Automatic verification failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Mock SMS sending (replace with real SMS service)
async function sendSMS(phone: string, otp: string): Promise<boolean> {
  console.log(`SMS OTP ${otp} sent to ${phone}`)
  // In production, integrate with:
  // - Twilio
  // - AWS SNS
  // - TextLocal
  // - MSG91
  return true // Mock success
}

// Mock email sending (replace with real email service)
async function sendEmail(email: string, otp: string): Promise<boolean> {
  console.log(`Email OTP ${otp} sent to ${email}`)
  // In production, integrate with:
  // - SendGrid
  // - AWS SES
  // - Mailgun
  // - Nodemailer
  return true // Mock success
}

// Mock micro-deposit (replace with real bank API)
async function sendMicroDeposit(bankAccount: any): Promise<boolean> {
  console.log(`Micro-deposit sent to ${bankAccount.bank_name} account ${bankAccount.account_number}`)
  // In production, integrate with:
  // - Razorpay Bank Account Verification
  // - PayU Bank Verification
  // - Direct bank APIs
  return true // Mock success
}

// Mock bank API verification (replace with real bank API)
async function verifyWithBankAPI(bankAccount: any): Promise<{success: boolean, error?: string}> {
  console.log(`Verifying ${bankAccount.bank_name} account ${bankAccount.account_number} with bank API`)
  
  // Mock verification logic
  // In production, this would call actual bank APIs
  const isValid = bankAccount.ifsc_code && bankAccount.account_number.length >= 10
  
  return {
    success: isValid,
    error: isValid ? undefined : 'Invalid account details'
  }
}








