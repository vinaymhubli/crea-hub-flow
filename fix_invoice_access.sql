-- Fix admin access to invoices
-- Disable RLS on invoices table so admin can see all invoices

-- Temporarily disable RLS on invoices table
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on invoice_templates table
ALTER TABLE public.invoice_templates DISABLE ROW LEVEL SECURITY;

-- Test query to make sure it works
SELECT COUNT(*) as total_invoices FROM public.invoices;
SELECT COUNT(*) as total_templates FROM public.invoice_templates;
