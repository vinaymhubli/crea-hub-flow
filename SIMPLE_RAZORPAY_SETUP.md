# 🚀 Simple Razorpay Setup (No Webhooks Required)

## ✅ **What You Get**
- **Add Money**: Razorpay payment popup with theme matching
- **Withdraw Money**: Manual processing after bank verification
- **No Webhooks**: Simplified setup, manual verification
- **Bank Verification**: OTP/Manual verification by admin

## 🔑 **Quick Setup (5 Minutes)**

### 1. Get Razorpay Keys
```bash
# Sign up at https://razorpay.com
# Go to Dashboard > Settings > API Keys
# Copy these:
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
```

### 2. Add to Supabase
```bash
# In Supabase Dashboard > Project Settings > Edge Functions
# Add environment variables:
RAZORPAY_KEY_ID = rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET = xxxxxxxxxxxxxxxxxx
```

### 3. Deploy Functions
```bash
supabase functions deploy razorpay-wallet-recharge
supabase functions deploy razorpay-verify-payment
```

## 🎨 **Theme Matching Features**

### Automatic Theme Detection
```tsx
// Automatically detects dark/light mode
const isDark = document.documentElement.classList.contains('dark')
const themeColor = isDark ? '#1f2937' : '#3b82f6'

// Razorpay popup matches your website theme
theme: {
  color: themeColor,
  backdrop_color: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)'
}
```

### Custom Styling
- **Gradient buttons** matching your design
- **Responsive design** for all devices
- **Loading states** with smooth animations
- **Success/Error messages** with proper feedback

## 💰 **How It Works**

### Add Money Flow:
1. User clicks "Add Money" → Opens themed dialog
2. Selects amount → Razorpay popup opens (matches theme)
3. Payment successful → Frontend verifies → Wallet updated
4. **No webhook needed** - instant verification

### Withdraw Money Flow:
1. User adds bank account → Manual/OTP verification
2. Requests withdrawal → Creates pending transaction
3. Admin processes manually → Updates transaction status
4. **No Razorpay payouts** - simple bank transfer

## 🏦 **Bank Account Verification Options**

### Option 1: Manual Verification (Simplest)
```sql
-- Admin marks account as verified
UPDATE bank_accounts 
SET is_verified = true 
WHERE id = 'account_id';
```

### Option 2: OTP Verification
- Send OTP to user's phone/email
- User enters OTP → Account verified
- Use existing `verify-bank-account` function

### Option 3: Penny Drop (Future)
- Send ₹1 to account
- User confirms amount received
- Account automatically verified

## 📱 **Components Usage**

### Simple Recharge Component
```tsx
import { SimpleRazorpayRecharge } from '@/components/SimpleRazorpayRecharge'

<SimpleRazorpayRecharge
  onSuccess={(amount) => {
    console.log(`Added ₹${amount}`)
    refreshWallet()
  }}
  onError={(error) => {
    console.error('Payment failed:', error)
  }}
/>
```

### Simple Withdrawal Component
```tsx
import { SimpleRazorpayWithdrawal } from '@/components/SimpleRazorpayWithdrawal'

<SimpleRazorpayWithdrawal
  currentBalance={walletBalance}
  onSuccess={(amount) => {
    console.log(`Withdrew ₹${amount}`)
    refreshWallet()
  }}
  onError={(error) => {
    console.error('Withdrawal failed:', error)
  }}
/>
```

## 🎯 **Key Benefits**

### ✅ **Pros of Simple Setup:**
- **No webhooks** - easier setup
- **Manual control** - admin approves withdrawals
- **Theme matching** - looks native to your site
- **Instant recharge** - no delays
- **Secure** - Razorpay handles payment security

### ⚠️ **Limitations:**
- **Manual withdrawals** - admin must process
- **No auto-updates** - if payment succeeds but user closes browser, need manual check
- **Scalability** - manual processing doesn't scale well

## 🔧 **Testing**

### Test Mode Setup:
```bash
# Use test keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx

# Test cards:
# Visa: 4111 1111 1111 1111
# Mastercard: 5555 5555 5555 4444
# UPI: success@razorpay (success), failure@razorpay (failure)
```

### Test Flow:
1. Add ₹100 using test card
2. Check wallet balance updated
3. Try withdrawal with verified bank account
4. Check transaction created with "pending" status

## 🚀 **Going Live**

### Production Setup:
```bash
# Replace with live keys
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx

# Enable live mode in Razorpay dashboard
# Complete KYC verification
# Test with small amounts first
```

## 📈 **Future Enhancements**

### When You're Ready:
1. **Add Webhooks** - for 100% reliability
2. **Razorpay Payouts** - for automatic withdrawals  
3. **Bulk Processing** - for multiple withdrawals
4. **Analytics** - payment success rates, etc.

## 🆘 **Troubleshooting**

### Common Issues:
1. **Payment popup not opening** → Check Razorpay script loaded
2. **Theme not matching** → Check CSS classes and theme detection
3. **Verification failing** → Check API keys and signature
4. **Bank account not verified** → Use manual verification first

### Quick Fixes:
```tsx
// Force reload Razorpay script
delete window.Razorpay
// Component will reload script automatically

// Manual theme override
theme: { color: '#your-brand-color' }
```

This setup gives you a **production-ready payment system** without the complexity of webhooks and automatic payouts!























