# Bank Account Verification System

A comprehensive bank account verification system that supports multiple verification methods including OTP, automatic verification, and micro-deposits.

## 🔐 **Verification Methods**

### 1. **SMS OTP Verification**
- **How it works**: Sends 6-digit OTP to user's registered mobile number
- **Timeline**: Instant delivery, 10-minute expiry
- **Security**: 3 attempts maximum, rate limiting
- **Integration**: Twilio, AWS SNS, TextLocal, MSG91

### 2. **Email OTP Verification**
- **How it works**: Sends 6-digit OTP to user's registered email
- **Timeline**: Instant delivery, 10-minute expiry
- **Security**: 3 attempts maximum, rate limiting
- **Integration**: SendGrid, AWS SES, Mailgun, Nodemailer

### 3. **Automatic Verification**
- **How it works**: Uses bank APIs to validate account details
- **Timeline**: Instant verification
- **Security**: Real-time validation with banks
- **Integration**: Razorpay, PayU, Direct bank APIs

### 4. **Micro Deposit Verification**
- **How it works**: Deposits small amount ($1-5) to user's account
- **Timeline**: 1-2 business days
- **Security**: User confirms exact amount received
- **Integration**: Banking APIs, Payment gateways

## 🏗️ **System Architecture**

### Database Schema
```sql
-- Bank Account Verifications Table
CREATE TABLE bank_account_verifications (
  id UUID PRIMARY KEY,
  bank_account_id UUID REFERENCES bank_accounts(id),
  otp VARCHAR(10),
  method VARCHAR(50), -- 'sms', 'email', 'bank_api', 'micro_deposit'
  status VARCHAR(20), -- 'pending', 'completed', 'failed', 'expired'
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced Bank Accounts Table
ALTER TABLE bank_accounts 
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verification_method VARCHAR(50);
```

### API Endpoints

#### Send OTP
```http
POST /functions/v1/verify-bank-account
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "send_otp",
  "bankAccountId": "uuid",
  "verificationMethod": "sms" // or "email"
}
```

#### Verify OTP
```http
POST /functions/v1/verify-bank-account
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "verify_otp",
  "bankAccountId": "uuid",
  "otp": "123456"
}
```

#### Auto Verification
```http
POST /functions/v1/verify-bank-account
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "auto_verify",
  "bankAccountId": "uuid"
}
```

## 🔄 **Verification Flow**

### OTP Verification Flow
1. **User adds bank account** → Status: "Pending"
2. **User clicks "Verify"** → Selects verification method
3. **System sends OTP** → SMS/Email with 6-digit code
4. **User enters OTP** → System validates code
5. **Account verified** → Status: "Verified"

### Automatic Verification Flow
1. **User adds bank account** → Status: "Pending"
2. **User clicks "Auto Verify"** → System calls bank API
3. **Bank validates details** → Real-time verification
4. **Account verified** → Status: "Verified" (instant)

## 🛡️ **Security Features**

### Rate Limiting
- **OTP requests**: 3 per hour per account
- **Verification attempts**: 3 per OTP
- **Auto verification**: 1 per day per account

### Data Protection
- **OTP encryption**: Stored with expiration
- **Account masking**: Only last 4 digits shown
- **Secure transmission**: HTTPS/TLS encryption
- **Audit trail**: Complete verification history

### Fraud Prevention
- **Account validation**: Real-time bank checks
- **Duplicate detection**: Prevents multiple accounts
- **Suspicious activity**: Automated monitoring
- **Manual review**: Flagged accounts reviewed

## 📱 **UI Components**

### BankAccountVerification
```tsx
<BankAccountVerification
  open={showVerification}
  onOpenChange={setShowVerification}
  bankAccount={selectedAccount}
  onVerified={(account) => {
    console.log('Account verified:', account);
  }}
/>
```

### Verification Methods
- **SMS OTP**: Mobile number verification
- **Email OTP**: Email address verification
- **Auto Verify**: Instant bank API verification
- **Micro Deposit**: Small amount verification

## 🔧 **Integration Guide**

### SMS Service Integration
```typescript
// Example: Twilio Integration
import twilio from 'twilio';

const client = twilio(accountSid, authToken);

async function sendSMS(phone: string, otp: string): Promise<boolean> {
  try {
    await client.messages.create({
      body: `Your verification code is: ${otp}. Valid for 10 minutes.`,
      from: '+1234567890',
      to: phone
    });
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
}
```

### Email Service Integration
```typescript
// Example: SendGrid Integration
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(email: string, otp: string): Promise<boolean> {
  try {
    await sgMail.send({
      to: email,
      from: 'noreply@yourapp.com',
      subject: 'Bank Account Verification',
      html: `
        <h2>Verify Your Bank Account</h2>
        <p>Your verification code is: <strong>₹{otp}</strong></p>
        <p>This code is valid for 10 minutes.</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}
```

### Bank API Integration
```typescript
// Example: Razorpay Bank Verification
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function verifyWithBankAPI(bankAccount: any): Promise<{success: boolean, error?: string}> {
  try {
    const response = await razorpay.fundAccount.validate({
      account_type: 'bank_account',
      bank_account: {
        name: bankAccount.account_holder_name,
        account_number: bankAccount.account_number,
        ifsc: bankAccount.ifsc_code
      }
    });
    
    return { success: response.valid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 📊 **Monitoring & Analytics**

### Key Metrics
- **Verification success rate**: % of successful verifications
- **OTP delivery rate**: % of OTPs delivered successfully
- **Verification time**: Average time to complete verification
- **Failed attempts**: Number of failed verification attempts

### Logging
```typescript
// Verification attempt logging
console.log('Verification attempt:', {
  userId: user.id,
  bankAccountId: bankAccount.id,
  method: verificationMethod,
  timestamp: new Date().toISOString(),
  success: result.success
});
```

## 🚀 **Deployment Checklist**

### Environment Variables
```bash
# SMS Service
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# Email Service
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@yourapp.com

# Bank APIs
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Database Migration
```bash
# Run the migration
supabase db push
```

### Function Deployment
```bash
# Deploy verification function
supabase functions deploy verify-bank-account
```

## 🐛 **Troubleshooting**

### Common Issues

1. **OTP not received**
   - Check phone number format
   - Verify SMS service configuration
   - Check rate limiting

2. **Auto verification fails**
   - Validate bank API credentials
   - Check account details accuracy
   - Verify bank API availability

3. **Verification timeout**
   - Check OTP expiration settings
   - Verify system time synchronization
   - Review network connectivity

### Debug Mode
```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Verification request:', {
    bankAccountId,
    method: verificationMethod,
    timestamp: new Date().toISOString()
  });
}
```

## 📞 **Support**

For technical support or questions about the verification system:
- **Documentation**: Check this guide and API docs
- **Logs**: Review Supabase function logs
- **Monitoring**: Check verification success rates
- **Contact**: Reach out to development team

---

**Note**: This verification system is designed to be production-ready with proper security measures, rate limiting, and error handling. Always test thoroughly before deploying to production.










































