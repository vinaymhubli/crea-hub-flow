-- Invoice System Migration
-- This migration creates a comprehensive invoice system for session payments

-- Create invoice_templates table for admin customization
CREATE TABLE IF NOT EXISTS public.invoice_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_logo_url TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_email TEXT,
    company_website TEXT,
    invoice_prefix TEXT DEFAULT 'INV',
    invoice_postfix TEXT DEFAULT '',
    yearly_reset BOOLEAN DEFAULT true,
    hsn_code TEXT,
    gst_number TEXT,
    pan_number TEXT,
    bank_details JSONB,
    terms_conditions TEXT,
    footer_text TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create invoices table for generated invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    session_id TEXT NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    designer_id UUID NOT NULL REFERENCES auth.users(id),
    invoice_type TEXT NOT NULL CHECK (invoice_type IN ('customer', 'designer')),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'paid', 'cancelled')),
    payment_method TEXT,
    payment_reference TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    template_id UUID REFERENCES public.invoice_templates(id),
    tax_details JSONB, -- Store IGST, CGST, SGST details
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_items table for line items
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    hsn_code TEXT,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_settings table for tax configuration by state
CREATE TABLE IF NOT EXISTS public.invoice_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state_code TEXT NOT NULL,
    state_name TEXT NOT NULL,
    cgst_rate DECIMAL(5,2) DEFAULT 0,
    sgst_rate DECIMAL(5,2) DEFAULT 0,
    igst_rate DECIMAL(5,2) DEFAULT 18,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default invoice template
INSERT INTO public.invoice_templates (
    template_name,
    company_name,
    company_address,
    company_phone,
    company_email,
    invoice_prefix,
    hsn_code,
    gst_number,
    terms_conditions
) VALUES (
    'Default Template',
    'CreaHub',
    'Your Company Address',
    '+91 1234567890',
    'admin@creahub.com',
    'INV',
    '998314',
    '22AAAAA0000A1Z5',
    'Payment due within 30 days of invoice date.'
);

-- Insert default tax settings for major states
INSERT INTO public.invoice_settings (state_code, state_name, cgst_rate, sgst_rate, igst_rate) VALUES
('MH', 'Maharashtra', 9, 9, 0),
('DL', 'Delhi', 9, 9, 0),
('KA', 'Karnataka', 9, 9, 0),
('TN', 'Tamil Nadu', 9, 9, 0),
('GJ', 'Gujarat', 9, 9, 0),
('UP', 'Uttar Pradesh', 9, 9, 0),
('WB', 'West Bengal', 9, 9, 0),
('RJ', 'Rajasthan', 9, 9, 0),
('AP', 'Andhra Pradesh', 9, 9, 0),
('TS', 'Telangana', 9, 9, 0);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_designer_id ON public.invoices(designer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_session_id ON public.invoices(session_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_settings_state_code ON public.invoice_settings(state_code);

-- Enable RLS
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_templates
CREATE POLICY "Admins can manage invoice templates" ON public.invoice_templates
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active templates" ON public.invoice_templates
FOR SELECT USING (is_active = true);

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = designer_id);

CREATE POLICY "Admins can view all invoices" ON public.invoices
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "System can create invoices" ON public.invoices
FOR INSERT WITH CHECK (true); -- System creates via functions

-- RLS Policies for invoice_items
CREATE POLICY "Users can view invoice items for their invoices" ON public.invoice_items
FOR SELECT USING (
    auth.uid() IN (
        SELECT customer_id FROM public.invoices WHERE id = invoice_items.invoice_id
    ) OR
    auth.uid() IN (
        SELECT designer_id FROM public.invoices WHERE id = invoice_items.invoice_id
    ) OR
    public.is_admin(auth.uid())
);

-- RLS Policies for invoice_settings
CREATE POLICY "Admins can manage invoice settings" ON public.invoice_settings
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view invoice settings" ON public.invoice_settings
FOR SELECT USING (is_active = true);

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(
    p_template_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_prefix TEXT := 'INV';
    template_postfix TEXT := '';
    yearly_reset BOOLEAN := true;
    current_year TEXT;
    last_number INTEGER := 0;
    new_number INTEGER;
    invoice_number TEXT;
BEGIN
    -- Get template settings
    IF p_template_id IS NOT NULL THEN
        SELECT invoice_prefix, invoice_postfix, yearly_reset
        INTO template_prefix, template_postfix, yearly_reset
        FROM public.invoice_templates
        WHERE id = p_template_id AND is_active = true;
    END IF;
    
    -- Get current year if yearly reset is enabled
    IF yearly_reset THEN
        current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    ELSE
        current_year := '';
    END IF;
    
    -- Get last invoice number
    SELECT COALESCE(MAX(
        CASE 
            WHEN yearly_reset THEN 
                CAST(SUBSTRING(invoice_number FROM LENGTH(template_prefix || current_year || '-') + 1) AS INTEGER)
            ELSE 
                CAST(SUBSTRING(invoice_number FROM LENGTH(template_prefix || '-') + 1) AS INTEGER)
        END
    ), 0)
    INTO last_number
    FROM public.invoices
    WHERE invoice_number LIKE template_prefix || '%';
    
    -- Generate new number
    new_number := last_number + 1;
    
    -- Format invoice number
    IF yearly_reset THEN
        invoice_number := template_prefix || current_year || '-' || LPAD(new_number::TEXT, 4, '0') || template_postfix;
    ELSE
        invoice_number := template_prefix || '-' || LPAD(new_number::TEXT, 4, '0') || template_postfix;
    END IF;
    
    RETURN invoice_number;
END;
$$;

-- Create function to generate invoices after session payment
CREATE OR REPLACE FUNCTION public.generate_session_invoices(
    p_session_id TEXT,
    p_customer_id UUID,
    p_designer_id UUID,
    p_amount DECIMAL(10,2),
    p_booking_id UUID DEFAULT NULL,
    p_template_id UUID DEFAULT NULL
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
    
    -- Calculate tax (18% GST)
    v_tax_amount := p_amount * (v_tax_rate / 100);
    v_subtotal := p_amount;
    
    -- Generate customer invoice
    v_customer_invoice_number := public.generate_invoice_number(v_template_id);
    
    INSERT INTO public.invoices (
        invoice_number, session_id, booking_id, customer_id, designer_id,
        invoice_type, subtotal, tax_amount, total_amount, template_id,
        tax_details, metadata
    ) VALUES (
        v_customer_invoice_number, p_session_id, p_booking_id, p_customer_id, p_designer_id,
        'customer', v_subtotal, v_tax_amount, v_subtotal + v_tax_amount, v_template_id,
        jsonb_build_object(
            'cgst_rate', 0,
            'sgst_rate', 0,
            'igst_rate', v_tax_rate,
            'cgst_amount', 0,
            'sgst_amount', 0,
            'igst_amount', v_tax_amount
        ),
        jsonb_build_object(
            'session_id', p_session_id,
            'service_type', 'Design Session',
            'generated_at', NOW()
        )
    ) RETURNING id INTO v_customer_invoice_id;
    
    -- Add invoice item for customer
    INSERT INTO public.invoice_items (
        invoice_id, item_name, description, quantity, unit_price, total_price, hsn_code, tax_rate
    ) VALUES (
        v_customer_invoice_id, 'Design Session', 'Professional design services', 1, v_subtotal, v_subtotal, v_hsn_code, v_tax_rate
    );
    
    -- Generate designer invoice
    v_designer_invoice_number := public.generate_invoice_number(v_template_id);
    
    INSERT INTO public.invoices (
        invoice_number, session_id, booking_id, customer_id, designer_id,
        invoice_type, subtotal, tax_amount, total_amount, template_id,
        tax_details, metadata
    ) VALUES (
        v_designer_invoice_number, p_session_id, p_booking_id, p_customer_id, p_designer_id,
        'designer', v_subtotal, 0, v_subtotal, v_template_id, -- Designer doesn't pay tax on earnings
        jsonb_build_object(
            'cgst_rate', 0,
            'sgst_rate', 0,
            'igst_rate', 0,
            'cgst_amount', 0,
            'sgst_amount', 0,
            'igst_amount', 0
        ),
        jsonb_build_object(
            'session_id', p_session_id,
            'service_type', 'Design Session Earnings',
            'generated_at', NOW()
        )
    ) RETURNING id INTO v_designer_invoice_id;
    
    -- Add invoice item for designer
    INSERT INTO public.invoice_items (
        invoice_id, item_name, description, quantity, unit_price, total_price, hsn_code, tax_rate
    ) VALUES (
        v_designer_invoice_id, 'Design Session Earnings', 'Payment for design services provided', 1, v_subtotal, v_subtotal, v_hsn_code, 0
    );
    
    -- Return invoice details
    RETURN QUERY SELECT v_customer_invoice_id, v_designer_invoice_id, v_customer_invoice_number, v_designer_invoice_number;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_invoice_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_session_invoices(TEXT, UUID, UUID, DECIMAL, UUID, UUID) TO authenticated;
