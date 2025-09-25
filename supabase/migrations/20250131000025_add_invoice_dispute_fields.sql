-- Add fields for better dispute resolution and admin understanding
-- These fields will help in case of disputes and provide more details to admins

-- Add new columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS session_duration INTEGER, -- Duration in minutes
ADD COLUMN IF NOT EXISTS hsn_code TEXT, -- HSN code for GST
ADD COLUMN IF NOT EXISTS place_of_supply TEXT; -- Place of supply for GST

-- Add comments for clarity
COMMENT ON COLUMN public.invoices.session_duration IS 'Session duration in minutes for dispute resolution';
COMMENT ON COLUMN public.invoices.hsn_code IS 'HSN code for GST compliance';
COMMENT ON COLUMN public.invoices.place_of_supply IS 'Place of supply for GST calculation';

-- Update the generate_session_invoices function to include these fields
CREATE OR REPLACE FUNCTION public.generate_session_invoices(
    p_session_id TEXT,
    p_customer_id UUID,
    p_designer_id UUID,
    p_amount DECIMAL(10,2),
    p_booking_id UUID DEFAULT NULL,
    p_template_id UUID DEFAULT NULL,
    p_session_duration INTEGER DEFAULT NULL,
    p_place_of_supply TEXT DEFAULT NULL
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
    v_company_name TEXT;
    v_gst_number TEXT;
    v_hsn_code TEXT;
    v_tax_rate DECIMAL(5,2) := 18;
    v_tax_amount DECIMAL(10,2);
    v_subtotal DECIMAL(10,2);
    v_booking_duration INTEGER;
    v_booking_place_of_supply TEXT;
BEGIN
    -- Get template settings
    IF p_template_id IS NULL THEN
        SELECT id INTO v_template_id FROM public.invoice_templates WHERE is_active = true LIMIT 1;
    ELSE
        v_template_id := p_template_id;
    END IF;
    
    -- Get template details
    SELECT company_name, gst_number, hsn_code
    INTO v_company_name, v_gst_number, v_hsn_code
    FROM public.invoice_templates
    WHERE id = v_template_id;
    
    -- Get booking details for duration and place of supply
    IF p_booking_id IS NOT NULL THEN
        SELECT duration_hours * 60, 
               CASE 
                   WHEN customer_state = designer_state THEN customer_state
                   ELSE 'Inter-state'
               END
        INTO v_booking_duration, v_booking_place_of_supply
        FROM public.bookings b
        JOIN public.profiles cp ON b.customer_id = cp.user_id
        JOIN public.profiles dp ON b.designer_id = dp.user_id
        WHERE b.id = p_booking_id;
    END IF;
    
    -- Use provided values or fallback to booking values
    v_booking_duration := COALESCE(p_session_duration, v_booking_duration, 60); -- Default 60 minutes
    v_booking_place_of_supply := COALESCE(p_place_of_supply, v_booking_place_of_supply, 'Inter-state');
    
    -- Calculate tax (18% GST)
    v_tax_amount := p_amount * (v_tax_rate / 100);
    v_subtotal := p_amount;
    
    -- Generate customer invoice
    v_customer_invoice_number := public.generate_invoice_number(v_template_id);
    
    INSERT INTO public.invoices (
        invoice_number, session_id, booking_id, customer_id, designer_id,
        invoice_type, subtotal, tax_amount, total_amount, template_id,
        session_duration, hsn_code, place_of_supply
    ) VALUES (
        v_customer_invoice_number, p_session_id, p_booking_id, p_customer_id, p_designer_id,
        'customer', v_subtotal, v_tax_amount, v_subtotal + v_tax_amount, v_template_id,
        v_booking_duration, v_hsn_code, v_booking_place_of_supply
    ) RETURNING id INTO v_customer_invoice_id;
    
    -- Add invoice item for customer
    INSERT INTO public.invoice_items (
        invoice_id, item_name, description, quantity, unit_price, total_price, hsn_code, tax_rate
    ) VALUES (
        v_customer_invoice_id, 'Design Session Fee', 
        'Professional design consultation session', 1, v_subtotal, v_subtotal, v_hsn_code, v_tax_rate
    );
    
    -- Generate designer invoice
    v_designer_invoice_number := public.generate_invoice_number(v_template_id);
    
    INSERT INTO public.invoices (
        invoice_number, session_id, booking_id, customer_id, designer_id,
        invoice_type, subtotal, tax_amount, total_amount, template_id,
        session_duration, hsn_code, place_of_supply
    ) VALUES (
        v_designer_invoice_number, p_session_id, p_booking_id, p_customer_id, p_designer_id,
        'designer', v_subtotal, 0, v_subtotal, v_template_id,
        v_booking_duration, v_hsn_code, v_booking_place_of_supply
    ) RETURNING id INTO v_designer_invoice_id;
    
    -- Add invoice item for designer
    INSERT INTO public.invoice_items (
        invoice_id, item_name, description, quantity, unit_price, total_price, hsn_code, tax_rate
    ) VALUES (
        v_designer_invoice_id, 'Design Session Earnings', 
        'Earnings from design consultation session', 1, v_subtotal, v_subtotal, v_hsn_code, 0
    );
    
    RETURN QUERY SELECT v_customer_invoice_id, v_designer_invoice_id, v_customer_invoice_number, v_designer_invoice_number;
END;
$$;

-- Update the generate_wallet_recharge_invoice function
CREATE OR REPLACE FUNCTION public.generate_wallet_recharge_invoice(
    p_customer_id UUID,
    p_amount DECIMAL(10,2),
    p_template_id UUID DEFAULT NULL
)
RETURNS TABLE (
    invoice_id UUID,
    invoice_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_id UUID;
    v_invoice_number TEXT;
    v_template_id UUID;
    v_company_name TEXT;
    v_gst_number TEXT;
    v_hsn_code TEXT;
BEGIN
    -- Get template settings
    IF p_template_id IS NULL THEN
        SELECT id INTO v_template_id FROM public.invoice_templates WHERE is_active = true LIMIT 1;
    ELSE
        v_template_id := p_template_id;
    END IF;
    
    -- Get template details
    SELECT company_name, gst_number, hsn_code
    INTO v_company_name, v_gst_number, v_hsn_code
    FROM public.invoice_templates
    WHERE id = v_template_id;
    
    -- Generate invoice number
    v_invoice_number := public.generate_invoice_number(v_template_id);
    
    INSERT INTO public.invoices (
        invoice_number, session_id, customer_id, designer_id,
        invoice_type, subtotal, tax_amount, total_amount, template_id
    ) VALUES (
        v_invoice_number, 'WALLET_RECHARGE', p_customer_id, p_customer_id,
        'customer', p_amount, 0, p_amount, v_template_id
    ) RETURNING id INTO v_invoice_id;
    
    -- Add invoice item
    INSERT INTO public.invoice_items (
        invoice_id, item_name, description, quantity, unit_price, total_price, tax_rate
    ) VALUES (
        v_invoice_id, 'Wallet Recharge', 
        'Add funds to wallet', 1, p_amount, p_amount, 0
    );
    
    RETURN QUERY SELECT v_invoice_id, v_invoice_number;
END;
$$;

-- Update the generate_wallet_withdrawal_invoice function
CREATE OR REPLACE FUNCTION public.generate_wallet_withdrawal_invoice(
    p_designer_id UUID,
    p_amount DECIMAL(10,2),
    p_template_id UUID DEFAULT NULL
)
RETURNS TABLE (
    invoice_id UUID,
    invoice_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_id UUID;
    v_invoice_number TEXT;
    v_template_id UUID;
    v_company_name TEXT;
    v_gst_number TEXT;
    v_hsn_code TEXT;
BEGIN
    -- Get template settings
    IF p_template_id IS NULL THEN
        SELECT id INTO v_template_id FROM public.invoice_templates WHERE is_active = true LIMIT 1;
    ELSE
        v_template_id := p_template_id;
    END IF;
    
    -- Get template details
    SELECT company_name, gst_number, hsn_code
    INTO v_company_name, v_gst_number, v_hsn_code
    FROM public.invoice_templates
    WHERE id = v_template_id;
    
    -- Generate invoice number
    v_invoice_number := public.generate_invoice_number(v_template_id);
    
    INSERT INTO public.invoices (
        invoice_number, session_id, customer_id, designer_id,
        invoice_type, subtotal, tax_amount, total_amount, template_id
    ) VALUES (
        v_invoice_number, 'WALLET_WITHDRAWAL', p_designer_id, p_designer_id,
        'designer', p_amount, 0, p_amount, v_template_id
    ) RETURNING id INTO v_invoice_id;
    
    -- Add invoice item
    INSERT INTO public.invoice_items (
        invoice_id, item_name, description, quantity, unit_price, total_price, tax_rate
    ) VALUES (
        v_invoice_id, 'Wallet Withdrawal', 
        'Withdraw funds from wallet', 1, p_amount, p_amount, 0
    );
    
    RETURN QUERY SELECT v_invoice_id, v_invoice_number;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_session_invoices(TEXT, UUID, UUID, DECIMAL, UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_wallet_recharge_invoice(UUID, DECIMAL, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_wallet_withdrawal_invoice(UUID, DECIMAL, UUID) TO authenticated;
