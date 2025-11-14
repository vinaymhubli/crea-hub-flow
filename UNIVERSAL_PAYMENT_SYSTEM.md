# Universal Payment System

A comprehensive wallet and payment system that supports multiple payment methods, wallet-to-wallet transactions, and bank withdrawals.

## 🚀 Features

### 💳 Universal Payment Methods
- **UPI Payments** - Pay using UPI ID or QR code
- **Credit/Debit Cards** - Secure card payments
- **Net Banking** - Direct bank transfers
- **Digital Wallets** - Paytm, PhonePe, etc.

### 💰 Wallet System
- **Credit-based wallet** - 1:1 credit system (₹100 payment = ₹100 credits)
- **Real-time balance** - Instant balance updates
- **Transaction history** - Complete payment and withdrawal history
- **Multiple payment methods** - Choose your preferred payment option

### 🏦 Bank Account Management
- **Add multiple bank accounts** - Support for multiple accounts
- **Primary account setting** - Set default account for withdrawals
- **Account verification** - Secure account validation
- **Withdrawal system** - Transfer money to bank accounts

### 🔄 Withdrawal System
- **Bank transfers** - Direct transfers to bank accounts
- **Processing time** - 2-4 business days
- **Transaction tracking** - Real-time withdrawal status
- **Minimum withdrawal** - ₹100 minimum amount

## 📁 File Structure

```
src/
├── components/
│   ├── UniversalPaymentModal.tsx      # Payment method selection modal
│   ├── UniversalPaymentButton.tsx     # Reusable payment button
│   ├── WithdrawalModal.tsx            # Withdrawal interface
│   ├── BankAccountManager.tsx         # Bank account management
│   ├── WalletDashboard.tsx            # Complete wallet dashboard
│   └── SessionPaymentExample.tsx      # Example usage
├── hooks/
│   └── useWallet.tsx                  # Wallet management hook
└── pages/
    └── CustomerWallet.tsx             # Updated wallet page

supabase/
├── functions/
│   ├── universal-payment/             # Universal payment processing
│   ├── process-withdrawal/            # Withdrawal processing
│   └── process-payment/               # Designer payments
└── migrations/
    └── 20250129000000_create_bank_accounts.sql
```

## 🛠️ Setup Instructions

### 1. Database Setup
Run the migration to create bank accounts table:
```sql
-- Already included in: supabase/migrations/20250129000000_create_bank_accounts.sql
```

### 2. Deploy Supabase Functions
Deploy the following functions to your Supabase project:
- `universal-payment`
- `process-withdrawal`
- `process-payment`

### 3. Environment Variables
Set up environment variables in Supabase Edge Functions:
```bash
# For production, set these in Supabase dashboard
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_CLIENT_ID=your_client_id
PHONEPE_CLIENT_SECRET=your_client_secret
```

## 💻 Usage Examples

### Basic Payment Button
```tsx
import { UniversalPaymentButton } from '@/components/UniversalPaymentButton';

<UniversalPaymentButton
  amount={1500}
  designerId="designer_123"
  sessionId="session_456"
  description="Design session payment"
  onSuccess={(amount, method) => {
    console.log(`Payment of $${amount} successful via ${method}`);
  }}
  onError={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

### Wallet Dashboard
```tsx
import { WalletDashboard } from '@/components/WalletDashboard';

<WalletDashboard />
```

### Bank Account Management
```tsx
import { BankAccountManager } from '@/components/BankAccountManager';

<BankAccountManager
  open={showManager}
  onOpenChange={setShowManager}
  onAccountAdded={(account) => {
    console.log('Bank account added:', account);
  }}
/>
```

### Using the Wallet Hook
```tsx
import { useWallet } from '@/hooks/useWallet';

function MyComponent() {
  const { 
    balance, 
    addCredits, 
    withdraw, 
    payDesigner,
    hasSufficientBalance 
  } = useWallet();

  const handlePayment = async () => {
    const result = await addCredits(1000, 'upi', { upiId: 'user@upi' });
    if (result.success) {
      console.log('Credits added successfully!');
    }
  };

  return (
    <div>
      <p>Balance: ${balance.toFixed(2)}</p>
      <button onClick={handlePayment}>Add ₹1000 Credits</button>
    </div>
  );
}
```

## 🔧 API Endpoints

### Universal Payment
```
POST /functions/v1/universal-payment
```
**Body:**
```json
{
  "amount": 1000,
  "paymentMethod": "upi",
  "userDetails": {
    "upiId": "user@upi"
  }
}
```

### Process Withdrawal
```
POST /functions/v1/process-withdrawal
```
**Body:**
```json
{
  "amount": 500,
  "bankAccountId": "bank_account_id",
  "description": "Withdrawal request"
}
```

### Process Payment (Designer)
```
POST /functions/v1/process-payment
```
**Body:**
```json
{
  "designerId": "designer_123",
  "amount": 1500,
  "sessionId": "session_456"
}
```

## 🎨 UI Components

### UniversalPaymentModal
- Payment method selection
- Amount input with quick amounts
- Payment method details
- Secure payment processing

### WithdrawalModal
- Bank account selection
- Amount input
- Withdrawal confirmation
- Processing status

### BankAccountManager
- Add/edit bank accounts
- Set primary account
- Account verification status
- Delete accounts

### WalletDashboard
- Balance overview
- Transaction history
- Quick actions
- Statistics

## 🔒 Security Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Secure API keys** - Environment variable management
- **Transaction validation** - Amount and balance checks
- **Bank account verification** - Secure account management
- **Audit trail** - Complete transaction history

## 📊 Database Schema

### wallet_transactions
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- amount (DECIMAL)
- transaction_type (ENUM: deposit, payment, refund, withdrawal)
- status (ENUM: pending, completed, failed)
- description (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

### bank_accounts
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- bank_name (VARCHAR)
- account_holder_name (VARCHAR)
- account_number (VARCHAR)
- ifsc_code (VARCHAR)
- account_type (ENUM: savings, current, salary)
- is_verified (BOOLEAN)
- is_primary (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🚀 Getting Started

1. **Install dependencies** (if not already installed)
2. **Run database migrations**
3. **Deploy Supabase functions**
4. **Set environment variables**
5. **Import and use components**

## 🔄 Payment Flow

1. **User clicks "Add Credits"**
2. **Selects payment method** (UPI, Card, Net Banking, Wallet)
3. **Enters payment details**
4. **Payment processed** via universal payment function
5. **Credits added to wallet**
6. **Transaction recorded** in database

## 💸 Withdrawal Flow

1. **User clicks "Withdraw"**
2. **Selects bank account** (or adds new one)
3. **Enters withdrawal amount**
4. **Withdrawal processed** via withdrawal function
5. **Money transferred** to bank account
6. **Transaction updated** with status

## 🎯 Key Benefits

- **Multiple payment options** - Users can choose their preferred method
- **Secure transactions** - All payments are processed securely
- **Real-time updates** - Instant balance and transaction updates
- **Easy integration** - Simple components for any page
- **Comprehensive tracking** - Complete transaction history
- **Bank integration** - Direct bank account management
- **Responsive design** - Works on all devices

## 🐛 Troubleshooting

### Common Issues

1. **Payment fails** - Check API keys and merchant configuration
2. **Withdrawal pending** - Normal processing time is 2-4 business days
3. **Balance not updating** - Refresh the page or call `refresh()` function
4. **Bank account not verified** - Contact support for manual verification

### Debug Mode
Enable debug logging in Supabase functions to troubleshoot issues.

## 📞 Support

For technical support or questions about the payment system, please contact the development team.

---

**Note:** This system is designed to be production-ready with proper security measures and error handling. Always test thoroughly before deploying to production.


desginerWebapp






































