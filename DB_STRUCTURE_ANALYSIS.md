# Database Structure & RLS Policies Analysis

## Overview
Analyzed the Supabase database structure for the CreaHub Flow project based on migration files.

---

## Core Tables

### 1. **profiles** (User Authentication & Profile)
**Purpose**: Store user information for both customers and designers

**Schema**:
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('customer', 'designer')) DEFAULT 'customer',
  user_type TEXT CHECK (user_type IN ('client', 'designer')),
  avatar_url TEXT,
  bio TEXT,
  is_admin BOOLEAN DEFAULT false,
  blocked BOOLEAN DEFAULT false,
  blocked_at TIMESTAMP,
  blocked_reason TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)
```

**RLS Policies**:
- ✅ `Profiles are viewable by authenticated users` - SELECT by authenticated
- ✅ `Users can update their own profile` - UPDATE where auth.uid() = id
- ✅ `Users can insert their own profile` - INSERT where auth.uid() = id
- ✅ `admin_can_select_all_on_profiles` - Admins can view all profiles

---

### 2. **designers** (Designer-Specific Information)
**Purpose**: Store designer profile, rates, portfolio, and verification status

**Schema**:
```sql
CREATE TABLE public.designers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  specialty TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) DEFAULT 0.00,
  bio TEXT,
  skills TEXT[],
  location TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  reviews_count INTEGER DEFAULT 0,
  completion_rate INTEGER DEFAULT 100,
  response_time TEXT DEFAULT '1 hour',
  is_online BOOLEAN DEFAULT false,
  portfolio_images TEXT[],
  verification_status TEXT DEFAULT 'pending', -- 'draft', 'pending', 'approved', 'rejected'
  kyc_status TEXT,
  kyc_aadhaar_front_url TEXT,
  kyc_aadhaar_back_url TEXT,
  kyc_pan_front_url TEXT,
  kyc_pan_back_url TEXT,
  experience_years INTEGER DEFAULT 0,
  display_hourly_rate BOOLEAN DEFAULT true,
  available_for_urgent BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)
```

**RLS Policies**:
- ✅ `Designers are viewable by everyone` - SELECT (true)
- ✅ `Designers can update their own profile` - UPDATE where auth.uid() = user_id
- ✅ `Designers can insert their own profile` - INSERT where auth.uid() = user_id
- ✅ `Admins can update any designer` - UPDATE by admins
- ✅ `admin_can_select_all_on_designers` - Admins can view all designers

**Note**: `verification_status` was changed from default 'approved' to 'pending' (then to 'draft' in our latest changes)

---

### 3. **bookings** (Session Bookings)
**Purpose**: Track customer bookings with designers

**Schema**:
```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  designer_id UUID REFERENCES public.designers(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  scheduled_date TIMESTAMP NOT NULL,
  duration_hours INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  requirements TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)
```

**RLS Policies**:
- ✅ `Customers can view their own bookings` - SELECT where customer_id = auth.uid()
- ✅ `Designers can view their bookings` - SELECT where designer matches auth.uid()
- ✅ `Customers can create bookings` - INSERT where customer_id = auth.uid()
- ✅ `Customers can update their bookings` - UPDATE where customer_id = auth.uid()
- ✅ `Designers can update their bookings` - UPDATE where designer matches auth.uid()
- ✅ `Admins can view all bookings` - Admins can SELECT all
- ✅ `Admins can update any booking` - Admins can UPDATE all

---

### 4. **services** (Designer Services/Packages)
**Purpose**: Store service offerings created by designers

**Schema**:
```sql
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.designers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  price DECIMAL(10,2) NOT NULL,
  delivery_time_days INTEGER NOT NULL,
  revisions INTEGER DEFAULT 0,
  cover_image_url TEXT,
  gallery_urls TEXT[],
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 0.00,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)
```

**RLS Policies**:
- Services viewable by everyone (for public listing)
- Designers can manage their own services
- Frontend filters ensure only approved designer services are shown

---

### 5. **featured_designers** (Homepage Featured Designers)
**Purpose**: Manage which designers appear as featured on the homepage

**Schema**:
```sql
CREATE TABLE public.featured_designers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  position INTEGER CHECK (position >= 1 AND position <= 10) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  featured_since TIMESTAMP DEFAULT now(),
  featured_until TIMESTAMP,
  admin_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)
```

**RLS Policies**:
- ✅ `Admins can manage featured designers` - Admins have full control
- ✅ `Anyone can view active featured designers` - Public can SELECT where is_active = true

**RPC Function**:
- `get_featured_designers()` - Returns featured designers with profile info
- **Updated to filter only approved designers**

---

### 6. **wallets** (User Wallet System)
**Purpose**: Track user wallet balance and transactions

**Schema**:
```sql
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)
```

**RLS Policies**:
- Users can view their own wallet
- Designers can view their wallet
- Admins can view all wallets

---

### 7. **wallet_transactions** (Wallet Transaction History)
**Purpose**: Track all wallet deposits, withdrawals, and transfers

**Schema**:
```sql
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMP DEFAULT now()
)
```

---

### 8. **bank_accounts** (Designer Bank Accounts)
**Purpose**: Store designer bank account details for withdrawals

**Schema**:
```sql
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  verification_method TEXT CHECK (verification_method IN ('auto', 'otp', 'manual')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)
```

**RLS Policies**:
- Users can view their own bank accounts
- Users can insert their own bank accounts
- Users can update their own bank accounts
- Admins can view all bank accounts

---

### 9. **live_sessions** (Real-time Design Sessions)
**Purpose**: Track active live design collaboration sessions

**Schema**:
```sql
CREATE TABLE public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  customer_id UUID REFERENCES public.profiles(id),
  designer_id UUID REFERENCES public.designers(id),
  status TEXT CHECK (status IN ('scheduled', 'active', 'paused', 'completed', 'cancelled')),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  session_url TEXT,
  recording_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)
```

---

### 10. **session_messages** (Chat During Sessions)
**Purpose**: Store chat messages during live sessions

**Schema**:
```sql
CREATE TABLE public.session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP DEFAULT now()
)
```

---

### 11. **notifications** (User Notifications)
**Purpose**: Store system notifications for users

**Schema**:
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
)
```

**RLS Policies**:
- Users can view their own notifications
- Users can update their own notifications (mark as read)
- System can insert notifications

---

### 12. **platform_settings** (Admin Settings)
**Purpose**: Store platform-wide configuration (singleton table)

**Schema**:
```sql
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_mode BOOLEAN DEFAULT false,
  new_registrations BOOLEAN DEFAULT true,
  commission_rate NUMERIC(5,2) DEFAULT 15,
  featured_designers_limit INTEGER DEFAULT 6,
  min_designer_rate DECIMAL(10,2) DEFAULT 5.00,
  gst_rate DECIMAL(5,2) DEFAULT 18.00,
  singleton BOOLEAN DEFAULT true UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)
```

**RLS Policies**:
- ✅ `Admins can view platform settings` - Only admins can SELECT
- ✅ `Admins can manage platform settings` - Only admins can modify

---

### 13. **invoices** (Session Invoices)
**Purpose**: Generate and store invoices for completed sessions

**Schema**:
```sql
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  session_id UUID REFERENCES public.live_sessions(id),
  customer_id UUID REFERENCES public.profiles(id),
  designer_id UUID REFERENCES public.designers(id),
  subtotal DECIMAL(10,2) NOT NULL,
  gst_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  designer_earnings DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
)
```

**RLS Policies**:
- Customers can view their own invoices
- Designers can view their invoices
- Admins can view all invoices

---

### 14. **designer_availability_settings** (Designer Availability)
**Purpose**: Store designer availability preferences

**RLS Policies**:
- Designers can view and manage their own settings
- Public can view active designers' availability
- Admins can manage all availability settings

---

### 15. **designer_weekly_schedule** (Weekly Schedule)
**Purpose**: Store designer's weekly working hours

**RLS Policies**:
- Designers can view and manage their own schedule
- Public can view schedules for booking
- Admins can manage all schedules

---

## Key RLS Policy Patterns

### 1. **Admin Functions**
```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = $1 AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### 2. **Common Policy Patterns**
- **Own data access**: `auth.uid() = user_id` or `auth.uid() = id`
- **Public read**: `USING (true)` for SELECT policies
- **Admin override**: `is_admin(auth.uid())` or `is_current_user_admin()`
- **Role-based**: Check `role` or `user_type` in profiles

---

## Critical Findings & Recommendations

### ✅ GOOD: Well-Implemented
1. **Admin access** properly gated with `is_admin` function
2. **Row Level Security** enabled on all tables
3. **Foreign key constraints** properly set up with CASCADE deletes
4. **Wallet system** has proper transaction logging

### ⚠️ POTENTIAL ISSUES FOUND:

#### 1. **Designers Table - Public Visibility**
**Current Policy**:
```sql
CREATE POLICY "Designers are viewable by everyone" 
ON public.designers FOR SELECT USING (true);
```

**Issue**: This allows ANYONE (even unauthenticated) to view ALL designers, including those with `verification_status = 'draft'` or `'pending'`

**Recommendation**: Update policy to filter by verification status:
```sql
-- Drop old policy
DROP POLICY "Designers are viewable by everyone" ON public.designers;

-- Create new filtered policy
CREATE POLICY "Public can view approved designers"
ON public.designers
FOR SELECT
USING (
  verification_status = 'approved' 
  OR auth.uid() = user_id  -- Designers can see their own draft
  OR public.is_current_user_admin()  -- Admins can see all
);
```

#### 2. **Services Table - No Verification Filter**
**Issue**: Services might be visible even if designer is not approved

**Recommendation**: Add policy or application-level filter:
```sql
CREATE POLICY "Public can view services from approved designers"
ON public.services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.designers d
    WHERE d.id = services.designer_id
    AND d.verification_status = 'approved'
  )
  OR auth.uid() IN (
    SELECT user_id FROM public.designers WHERE id = services.designer_id
  )
  OR public.is_current_user_admin()
);
```

#### 3. **Featured Designers RPC**
**Status**: ✅ FIXED in latest migration `20251107_filter_approved_designers.sql`
- Now filters `WHERE d.verification_status = 'approved'`

---

## Security Best Practices Applied

1. ✅ **RLS Enabled** on all sensitive tables
2. ✅ **SECURITY DEFINER** functions for admin checks
3. ✅ **Foreign Key Constraints** with proper CASCADE
4. ✅ **Check Constraints** for status fields
5. ✅ **Unique Constraints** where appropriate
6. ⚠️ **Verification Status** needs RLS policy updates (see above)

---

## Database Migration Status

**Total Migrations**: 106 files
**Last Migration**: `20251107_filter_approved_designers.sql`

### Recent Critical Changes:
1. Added `verification_status` column to designers (default 'pending')
2. Changed to 'draft' status for new signups (in application code)
3. Updated `get_featured_designers()` RPC to filter approved only
4. Added admin RLS policies for designer verification

---

## Recommended Actions

### HIGH PRIORITY:
1. ✅ **Update `designers` table RLS policy** to filter by verification_status
2. ✅ **Update `services` table RLS policy** to check designer approval
3. ✅ **Audit all queries** in frontend to ensure verification_status filtering

### MEDIUM PRIORITY:
4. Add indexes on `verification_status` for performance
5. Add logging/audit trail for admin actions on verification
6. Consider adding rejected_reason field to designers table

### LOW PRIORITY:
7. Add database views for common joins (designers + profiles)
8. Add database functions for common queries
9. Consider archiving old completed sessions

---

## Database Connection Details (Provided)
- **Project Ref**: tndeiiosfbtyzmcwllbx
- **Database**: Already connected via migrations
- **Service Role**: Available (for admin operations)
- **Anon Key**: Available (for public/authenticated operations)

---

*Analysis Date: November 7, 2024*
*Database: Supabase PostgreSQL*
*Project: CreaHub Flow*

