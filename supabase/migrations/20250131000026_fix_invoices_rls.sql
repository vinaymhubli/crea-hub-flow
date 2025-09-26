-- Fix RLS policies for invoices table to allow proper invoice generation

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "System can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;

-- Enable RLS if not already enabled
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own invoices (as customer or designer)
CREATE POLICY "Users can view their own invoices" ON public.invoices
    FOR SELECT
    USING (
        auth.uid() = customer_id OR 
        auth.uid() = designer_id OR 
        public.is_current_user_admin()
    );

-- Policy for system to create invoices (using security definer functions)
CREATE POLICY "System can create invoices" ON public.invoices
    FOR INSERT
    WITH CHECK (true); -- Allow all inserts since we use security definer functions

-- Policy for users to update their own invoice status (marking as paid, etc.)
CREATE POLICY "Users can update their invoice status" ON public.invoices
    FOR UPDATE
    USING (
        auth.uid() = customer_id OR 
        auth.uid() = designer_id OR 
        public.is_current_user_admin()
    )
    WITH CHECK (
        auth.uid() = customer_id OR 
        auth.uid() = designer_id OR 
        public.is_current_user_admin()
    );

-- Policy for admins to manage all invoices
CREATE POLICY "Admins can manage all invoices" ON public.invoices
    FOR ALL
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invoice_items TO authenticated;
GRANT SELECT ON public.invoice_templates TO authenticated;

-- Fix the generate_session_invoices function to resolve the ambiguous column reference
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
    v_booking_duration INTEGER;
    v_booking_place_of_supply TEXT;
    v_invoice_prefix TEXT := 'INV';
    v_invoice_postfix TEXT := '';
    v_yearly_reset BOOLEAN := true;
    v_current_year TEXT;
    v_last_number INTEGER := 0;
    v_new_number INTEGER;
BEGIN
    -- Get template settings
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
            hsn_code,
            invoice_prefix,
            invoice_postfix,
            yearly_reset
        INTO 
            v_company_name, 
            v_gst_number, 
            v_hsn_code,
            v_invoice_prefix,
            v_invoice_postfix,
            v_yearly_reset
        FROM public.invoice_templates
        WHERE id = v_template_id;
    END IF;
    
    -- Use provided session duration or get from booking
    v_booking_duration := COALESCE(p_session_duration, 60);
    v_booking_place_of_supply := COALESCE(p_place_of_supply, 'Inter-state');
    
    -- Get booking details if available
    IF p_booking_id IS NOT NULL THEN
        SELECT 
            duration_minutes,
            'Intra-state' -- Default based on same state assumption
        INTO 
            v_booking_duration,
            v_booking_place_of_supply
        FROM public.bookings
        WHERE id = p_booking_id;
    END IF;
    
    -- Calculate amounts
    v_subtotal := p_amount;
    v_tax_amount := v_subtotal * (v_tax_rate / 100);
    v_total_customer_amount := v_subtotal + v_tax_amount;
    
    -- Generate customer invoice number
    IF v_yearly_reset THEN
        v_current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    ELSE
        v_current_year := '';
    END IF;
    
    -- Get last invoice number for customer invoices
    SELECT COALESCE(MAX(
        CASE 
            WHEN v_yearly_reset THEN 
                CAST(SUBSTRING(invoice_number FROM LENGTH(v_invoice_prefix || v_current_year || '-') + 1 FOR 4) AS INTEGER)
            ELSE 
                CAST(SUBSTRING(invoice_number FROM LENGTH(v_invoice_prefix || '-') + 1 FOR 4) AS INTEGER)
        END
    ), 0)
    INTO v_last_number
    FROM public.invoices
    WHERE invoice_number LIKE v_invoice_prefix || '%'
    AND invoice_type = 'customer';
    
    v_new_number := v_last_number + 1;
    
    -- Format customer invoice number
    IF v_yearly_reset THEN
        v_customer_invoice_number := v_invoice_prefix || v_current_year || '-' || LPAD(v_new_number::TEXT, 4, '0') || v_invoice_postfix;
    ELSE
        v_customer_invoice_number := v_invoice_prefix || '-' || LPAD(v_new_number::TEXT, 4, '0') || v_invoice_postfix;
    END IF;
    
    -- Create customer invoice
    INSERT INTO public.invoices (
        invoice_number, session_id, booking_id, customer_id, designer_id,
        invoice_type, subtotal, tax_amount, total_amount, template_id,
        session_duration, place_of_supply, hsn_code,
        tax_details, metadata, status
    ) VALUES (
        v_customer_invoice_number, p_session_id, p_booking_id, p_customer_id, p_designer_id,
        'customer', v_subtotal, v_tax_amount, v_total_customer_amount, v_template_id,
        v_booking_duration, v_booking_place_of_supply, v_hsn_code,
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
            'duration_minutes', v_booking_duration,
            'generated_at', NOW()
        ),
        'generated'
    ) RETURNING id INTO v_customer_invoice_id;
    
    -- Generate designer invoice number
    v_new_number := v_new_number + 1;
    
    IF v_yearly_reset THEN
        v_designer_invoice_number := v_invoice_prefix || v_current_year || '-' || LPAD(v_new_number::TEXT, 4, '0') || v_invoice_postfix;
    ELSE
        v_designer_invoice_number := v_invoice_prefix || '-' || LPAD(v_new_number::TEXT, 4, '0') || v_invoice_postfix;
    END IF;
    
    -- Create designer invoice (for their earnings, no tax)
    INSERT INTO public.invoices (
        invoice_number, session_id, booking_id, customer_id, designer_id,
        invoice_type, subtotal, tax_amount, total_amount, template_id,
        session_duration, place_of_supply, hsn_code,
        tax_details, metadata, status
    ) VALUES (
        v_designer_invoice_number, p_session_id, p_booking_id, p_customer_id, p_designer_id,
        'designer', v_subtotal, 0, v_subtotal, v_template_id,
        v_booking_duration, v_booking_place_of_supply, v_hsn_code,
        jsonb_build_object(
            'note', 'Designer earnings invoice - taxes handled separately'
        ),
        jsonb_build_object(
            'session_id', p_session_id,
            'service_type', 'Design Session Earnings',
            'duration_minutes', v_booking_duration,
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
