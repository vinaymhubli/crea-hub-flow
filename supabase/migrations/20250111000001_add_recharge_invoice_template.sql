-- Add recharge invoice template and update functions
-- This migration ensures we have a proper template for wallet recharge invoices

-- First, add invoice_type column to invoice_templates if it doesn't exist
ALTER TABLE public.invoice_templates 
ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'session_payment';

-- Insert a specific template for wallet recharges if it doesn't exist
INSERT INTO public.invoice_templates (
    template_name,
    company_name,
    company_address,
    company_phone,
    company_email,
    invoice_prefix,
    invoice_postfix,
    hsn_code,
    gst_number,
    terms_conditions,
    invoice_type,
    background_color,
    is_active
) 
SELECT 
    'Customer Recharge Receipt',
    'meetmydesigners',
    'Your Company Address',
    '+91 1234567890',
    'admin@meetmydesigners.com',
    'MMD',
    'RCPT',
    '998314',
    '22AAAAA0000A1Z5',
    'Thank you for recharging your wallet. Funds will be available immediately.',
    'recharge',
    '#ffffff',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.invoice_templates WHERE invoice_type = 'recharge'
);

-- Update the generate_wallet_recharge_invoice function to use recharge template
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
    -- Get template settings - prefer recharge template
    IF p_template_id IS NULL THEN
        SELECT id INTO v_template_id 
        FROM public.invoice_templates 
        WHERE invoice_type = 'recharge' AND is_active = true 
        LIMIT 1;
        
        -- Fallback to any active template if no recharge template found
        IF v_template_id IS NULL THEN
            SELECT id INTO v_template_id 
            FROM public.invoice_templates 
            WHERE is_active = true 
            LIMIT 1;
        END IF;
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
        invoice_type, subtotal, tax_amount, total_amount, template_id,
        status, metadata
    ) VALUES (
        v_invoice_number, 'WALLET_RECHARGE', p_customer_id, p_customer_id,
        'recharge', p_amount, 0, p_amount, v_template_id,
        'paid', jsonb_build_object(
            'recharge_type', 'wallet_credit',
            'payment_method', 'razorpay',
            'generated_at', NOW()
        )
    ) RETURNING id INTO v_invoice_id;
    
    -- Add invoice item
    INSERT INTO public.invoice_items (
        invoice_id, item_name, description, quantity, unit_price, total_price, tax_rate
    ) VALUES (
        v_invoice_id, 'Wallet Recharge', 
        'Add funds to wallet balance', 1, p_amount, p_amount, 0
    );
    
    RETURN QUERY SELECT v_invoice_id, v_invoice_number;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.generate_wallet_recharge_invoice TO authenticated;
