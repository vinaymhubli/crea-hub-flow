# Razorpay Integration Setup Guide

## 🚀 Overview
This guide will help you set up Razorpay payment integration for wallet recharges and withdrawals in your CreaHub application.

## 📋 Prerequisites
1. Razorpay account (Sign up at https://razorpay.com)
2. Supabase project with Edge Functions enabled
3. Bank account for receiving payments (for withdrawals)

## 🔑 Environment Variables

### Required Razorpay Credentials
Add these environment variables to your Supabase Edge Functions:

```bash
# Razorpay API Keys (Get from Razorpay Dashboard > Settings > API Keys)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx          # Test Key ID
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx       # Test Key Secret

# For Production (replace test keys with live keys)
# RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx        # Live Key ID  
# RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx     # Live Key Secret

# Webhook Secret (Generate from Razorpay Dashboard > Settings > Webhooks)
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxx
```

### Setting Environment Variables in Supabase

1. **Via Supabase CLI:**
```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
supabase secrets set RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
supabase secrets set RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxx
```

2. **Via Supabase Dashboard:**
   - Go to Project Settings > Edge Functions
   - Add each environment variable in the "Environment Variables" section

## 🏦 Razorpay Account Setup

### 1. Create Razorpay Account
- Sign up at https://razorpay.com
- Complete KYC verification
- Activate your account

### 2. Get API Keys
- Go to Dashboard > Settings > API Keys
- Generate Test/Live API keys
- Copy Key ID and Key Secret

### 3. Configure Webhooks
- Go to Dashboard > Settings > Webhooks
- Create new webhook with URL: `https://your-project.supabase.co/functions/v1/razorpay-webhook`
- Select events:
  - `payment.captured`
  - `payment.failed`
  - `payout.processed`
  - `payout.failed`
- Generate webhook secret

### 4. Enable Payouts (For Withdrawals)
- Go to Dashboard > Settings > Configuration
- Enable "Payouts" feature
- Add your bank account details
- Complete verification process

## 📦 Deployment

### 1. Deploy Edge Functions
```bash
# Deploy all Razorpay functions
supabase functions deploy razorpay-wallet-recharge
supabase functions deploy razorpay-verify-payment  
supabase functions deploy razorpay-withdrawal
supabase functions deploy razorpay-webhook
```

### 2. Test the Integration
```bash
# Test wallet recharge
curl -X POST 'https://your-project.supabase.co/functions/v1/razorpay-wallet-recharge' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"amount": 100, "currency": "INR"}'

# Test withdrawal (requires verified bank account)
curl -X POST 'https://your-project.supabase.co/functions/v1/razorpay-withdrawal' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"amount": 100, "bank_account_id": "BANK_ACCOUNT_UUID"}'
```

## 🔧 Frontend Integration

### 1. Add Razorpay Script
The components automatically load the Razorpay checkout script when needed.

### 2. Use Components
```tsx
import { RazorpayWalletRecharge } from '@/components/RazorpayWalletRecharge'
import { RazorpayWithdrawal } from '@/components/RazorpayWithdrawal'

// Wallet Recharge
<RazorpayWalletRecharge
  onSuccess={(amount) => console.log(`Recharged ₹${amount}`)}
  onError={(error) => console.error('Recharge failed:', error)}
/>

// Wallet Withdrawal  
<RazorpayWithdrawal
  currentBalance={walletBalance}
  onSuccess={(amount) => console.log(`Withdrew ₹${amount}`)}
  onError={(error) => console.error('Withdrawal failed:', error)}
/>
```

## 🔒 Security Best Practices

### 1. API Key Security
- Never expose API keys in frontend code
- Use environment variables for all credentials
- Rotate keys regularly

### 2. Webhook Security
- Always verify webhook signatures
- Use HTTPS endpoints only
- Implement idempotency for webhook processing

### 3. Amount Validation
- Validate amounts on both frontend and backend
- Set minimum/maximum limits
- Check wallet balance before withdrawals

## 🧪 Testing

### Test Mode
- Use Razorpay test keys for development
- Test cards: 4111111111111111 (Visa), 5555555555554444 (Mastercard)
- Test UPI: success@razorpay, failure@razorpay

### Production Mode
- Switch to live keys for production
- Test with small amounts initially
- Monitor transactions in Razorpay dashboard

## 📊 Monitoring

### Transaction Tracking
- Monitor transactions in Razorpay Dashboard
- Check Supabase logs for function execution
- Set up alerts for failed payments

### Error Handling
- All functions include comprehensive error handling
- Webhook events are processed idempotently
- Failed transactions are marked appropriately

## 🆘 Troubleshooting

### Common Issues

1. **Payment Failed**
   - Check API keys are correct
   - Verify webhook URL is accessible
   - Check Razorpay account status

2. **Withdrawal Failed**
   - Ensure bank account is verified
   - Check payout limits in Razorpay
   - Verify sufficient balance in Razorpay account

3. **Webhook Not Working**
   - Verify webhook URL and secret
   - Check function logs in Supabase
   - Ensure webhook events are selected

### Support
- Razorpay Support: https://razorpay.com/support/
- Supabase Support: https://supabase.com/support
- Check function logs in Supabase Dashboard

## 📈 Next Steps

1. **Analytics Integration**
   - Track payment success rates
   - Monitor withdrawal patterns
   - Generate financial reports

2. **Enhanced Features**
   - Recurring payments
   - Bulk payouts
   - International payments

3. **Compliance**
   - PCI DSS compliance
   - Tax reporting
   - Audit trails




