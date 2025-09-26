# Correct Fee Structure for Platform

## Current Issues:
- GST (18%) is being charged on all transactions
- Platform fee (10%) is being charged on all transactions
- This creates double taxation

## Correct Fee Structure:

### 1. Wallet Recharge (Customer → Platform)
- **GST (18%)**: Charged on recharge amount
- **Example**: Customer recharges ₹1000
  - GST: ₹180 (goes to government)
  - Net credit to wallet: ₹1000
  - Total charged to customer: ₹1180

### 2. Session Payment (Customer → Designer)
- **Platform Commission (10%)**: Deducted from designer earnings
- **Example**: Session costs ₹1000
  - Designer gets: ₹900
  - Platform commission: ₹100 (goes to admin wallet)
  - Customer pays: ₹1000 (from wallet)

### 3. Withdrawal (Designer → Bank)
- **Platform Commission (10%)**: Already deducted during session payment
- **Example**: Designer withdraws ₹900
  - No additional charges
  - Designer gets: ₹900

### 4. Refund (Designer → Customer)
- **No additional charges**
- **Example**: Refund ₹1000
  - Designer loses: ₹1000
  - Customer gets: ₹1000
  - Platform commission already collected: ₹100

## Implementation Changes Needed:

1. **Remove GST from session payments**
2. **Only charge GST on wallet recharges**
3. **Only charge platform commission on session payments**
4. **Update platform settings to reflect this logic**

## Platform Settings Should Be:
- `gst_rate`: 18% (only for wallet recharges)
- `platform_fee_rate`: 10% (only for session payments)
- `penalty_fee_amount`: ₹50 (for complaints)
- `minimum_withdrawal_amount`: ₹100
- `maximum_withdrawal_amount`: ₹50000
- `auto_approve_threshold`: ₹1000


designerWebAPpnew