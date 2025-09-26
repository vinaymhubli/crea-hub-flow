-- FINAL SQL FIX FOR PAYMENT SYSTEM
-- Run this in Supabase Dashboard SQL Editor

-- 1. Create TDS settings (admin access required)
INSERT INTO public.tds_settings (tds_rate, is_active) 
VALUES (10.00, true)
ON CONFLICT DO NOTHING;

-- 2. Drop and recreate invoice RLS policies to allow system operations
DROP POLICY IF EXISTS "System can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their invoice status" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;

-- Create comprehensive RLS policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
    FOR SELECT
    USING (
        auth.uid() = customer_id OR 
        auth.uid() = designer_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "System and admins can create invoices" ON public.invoices
    FOR INSERT
    WITH CHECK (
        true -- Allow all inserts (system functions use security definer)
    );

CREATE POLICY "Users can update invoice status" ON public.invoices
    FOR UPDATE
    USING (
        auth.uid() = customer_id OR 
        auth.uid() = designer_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
    )
    WITH CHECK (
        auth.uid() = customer_id OR 
        auth.uid() = designer_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
    );

-- 3. Fix the invoice generation function (remove yearly_reset ambiguity)
DROP FUNCTION IF EXISTS public.generate_session_invoices(TEXT, UUID, UUID, DECIMAL, UUID, UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.generate_session_invoices(
    p_session_id TEXT,
    p_customer_id UUID,
    p_designer_id UUID,
    p_amount DECIMAL(10,2),
    p_booking_id UUID DEFAULT NULL,
    p_template_id UUID DEFAULT NULL,
    p_session_duration INTEGER DEFAULT 60,
    p_place_of_supply TEXT DEFAULT 'Inter-state'
)
RETURNS TABLE (
    customer_invoice_id UUID,
    designer_invoice_id UUID,
    customer_invoice_number TEXT,
    designer_invoice_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_invoice_id UUID;
    v_designer_invoice_id UUID;
    v_customer_invoice_number TEXT;
    v_designer_invoice_number TEXT;
    v_template_id UUID;
    v_company_name TEXT := 'CreaHub Flow';
    v_gst_number TEXT := '';
    v_hsn_code TEXT := '998314';
    v_tax_rate DECIMAL(5,2) := 18;
    v_tax_amount DECIMAL(10,2);
    v_subtotal DECIMAL(10,2);
    v_total_customer_amount DECIMAL(10,2);
    v_invoice_counter INTEGER := 0;
BEGIN
    -- Get or set template
    IF p_template_id IS NULL THEN
        SELECT id INTO v_template_id 
        FROM public.invoice_templates 
        WHERE is_active = true 
        ORDER BY created_at DESC 
        LIMIT 1;
    ELSE
        v_template_id := p_template_id;
    END IF;
    
    -- Get template details if template exists
    IF v_template_id IS NOT NULL THEN
        SELECT 
            company_name, 
            gst_number, 
            hsn_code
        INTO 
            v_company_name, 
            v_gst_number, 
            v_hsn_code
        FROM public.invoice_templates
        WHERE id = v_template_id;
    END IF;
    
    -- Calculate amounts
    v_subtotal := p_amount;
    v_tax_amount := v_subtotal * (v_tax_rate / 100);
    v_total_customer_amount := v_subtotal + v_tax_amount;
    
    -- Generate simple invoice numbers
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)$') AS INTEGER)), 0) + 1
    INTO v_invoice_counter
    FROM public.invoices
    WHERE invoice_number LIKE 'INV-%';
    
    -- Generate customer invoice number
    v_customer_invoice_number := 'INV-' || LPAD(v_invoice_counter::TEXT, 6, '0');
    
    -- Create customer invoice
    INSERT INTO public.invoices (
        invoice_number, session_id, booking_id, customer_id, designer_id,
        invoice_type, subtotal, tax_amount, total_amount, template_id,
        session_duration, place_of_supply, hsn_code,
        tax_details, metadata, status
    ) VALUES (
        v_customer_invoice_number, p_session_id, p_booking_id, p_customer_id, p_designer_id,
        'customer', v_subtotal, v_tax_amount, v_total_customer_amount, v_template_id,
        p_session_duration, p_place_of_supply, v_hsn_code,
        jsonb_build_object(
            'cgst_rate', 0,
            'sgst_rate', 0,
            'igst_rate', v_tax_rate,
            'cgst_amount', 0,
            'sgst_amount', 0,
            'igst_amount', v_tax_amount,
            'total_tax_amount', v_tax_amount
        ),
        jsonb_build_object(
            'session_id', p_session_id,
            'service_type', 'Design Session',
            'duration_minutes', p_session_duration,
            'generated_at', NOW()
        ),
        'generated'
    ) RETURNING id INTO v_customer_invoice_id;
    
    -- Generate designer invoice number
    v_invoice_counter := v_invoice_counter + 1;
    v_designer_invoice_number := 'INV-' || LPAD(v_invoice_counter::TEXT, 6, '0');
    
    -- Create designer invoice (for their earnings, no tax)
    INSERT INTO public.invoices (
        invoice_number, session_id, booking_id, customer_id, designer_id,
        invoice_type, subtotal, tax_amount, total_amount, template_id,
        session_duration, place_of_supply, hsn_code,
        tax_details, metadata, status
    ) VALUES (
        v_designer_invoice_number, p_session_id, p_booking_id, p_customer_id, p_designer_id,
        'designer', v_subtotal, 0, v_subtotal, v_template_id,
        p_session_duration, p_place_of_supply, v_hsn_code,
        jsonb_build_object(
            'note', 'Designer earnings invoice - taxes handled separately'
        ),
        jsonb_build_object(
            'session_id', p_session_id,
            'service_type', 'Design Session Earnings',
            'duration_minutes', p_session_duration,
            'generated_at', NOW()
        ),
        'generated'
    ) RETURNING id INTO v_designer_invoice_id;
    
    -- Return the invoice details
    RETURN QUERY SELECT 
        v_customer_invoice_id,
        v_designer_invoice_id,
        v_customer_invoice_number,
        v_designer_invoice_number;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_session_invoices(TEXT, UUID, UUID, DECIMAL, UUID, UUID, INTEGER, TEXT) TO authenticated;

-- 4. Create RLS policy for TDS settings
DROP POLICY IF EXISTS "Admins can manage TDS settings" ON public.tds_settings;
CREATE POLICY "Admins can manage TDS settings" ON public.tds_settings
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Enable RLS on TDS settings if not already enabled
ALTER TABLE public.tds_settings ENABLE ROW LEVEL SECURITY;
