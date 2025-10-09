import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, User, DollarSign, Eye, Search } from 'lucide-react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { DesignerSidebar } from "@/components/DesignerSidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface Invoice {
  id: string;
  invoice_number: string;
  session_id: string;
  booking_id: string | null;
  customer_id: string;
  designer_id: string;
  invoice_type: 'customer' | 'designer';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  tax_details: any;
  metadata: any;
  session_duration?: number;
  place_of_supply?: string;
}

interface InvoiceTemplate {
  id: string;
  template_name: string;
  company_name: string;
  company_logo_url: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_website: string | null;
  invoice_prefix: string | null;
  invoice_postfix: string | null;
  hsn_code: string | null;
  gst_number: string | null;
  pan_number: string | null;
  bank_details: any | null;
  terms_conditions: string | null;
  footer_text: string | null;
}

export default function SessionInvoices() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDesigner, setIsDesigner] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchInvoices();
    }
  }, [user?.id]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      // Determine user type from profile (more reliable than designers lookup)
      const userIsDesigner = (profile?.user_type === 'designer');
      const userIsCustomer = (profile?.user_type === 'customer' || profile?.user_type === 'client');
      setIsDesigner(userIsDesigner);

      // Fetch invoices based on user type and filter by invoice_type
      let query = supabase
        .from('invoices')
        .select('*');

      if (userIsDesigner) {
        // Designer: show only designer invoices (earnings)
        query = query
          .eq('designer_id', user?.id)
          .eq('invoice_type', 'designer');
      } else if (userIsCustomer) {
        // Customer: show only customer invoices (payments)
        query = query
          .eq('customer_id', user?.id)
          .eq('invoice_type', 'customer');
      } else {
        // Fallback: show invoices where user is either side
        query = query.or(`customer_id.eq.${user?.id},designer_id.eq.${user?.id}`);
      }

      const { data: invoicesData, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        toast({
          title: "Error",
          description: "Failed to fetch invoices. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setInvoices((invoicesData || []) as Invoice[]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      const template = await getTemplateForInvoice(invoice);
      const invoiceContent = generateInvoiceHTML(invoice, template);
      
      // Open a print window for Save as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(invoiceContent.replace('</body>', '<script>window.onload=()=>window.print()</script></body>'));
        printWindow.document.close();
      }

      toast({
        title: "Success",
        description: "Invoice downloaded successfully!",
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Error",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTemplateForInvoice = async (invoice: Invoice): Promise<InvoiceTemplate | null> => {
    // Prefer invoice.template_id, otherwise fallback to active template
    try {
      if ((invoice as any).template_id) {
        const { data } = await supabase
          .from('invoice_templates')
          .select('*')
          .eq('id', (invoice as any).template_id)
          .single();
        if (data) return data as InvoiceTemplate;
      }

      const { data: active } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return (active || null) as InvoiceTemplate | null;
    } catch (_e) {
      return null;
    }
  };

  const viewInvoice = async (invoice: Invoice) => {
    try {
      const template = await getTemplateForInvoice(invoice);
      const invoiceContent = generateInvoiceHTML(invoice, template);
      const w = window.open('', '_blank');
      if (w) {
        w.document.open();
        w.document.write(invoiceContent);
        w.document.close();
      }
    } catch (error) {
      console.error('Error opening invoice:', error);
      toast({ title: 'Error', description: 'Failed to open invoice.', variant: 'destructive' });
    }
  };

  const generateInvoiceHTML = (invoice: Invoice, template: InvoiceTemplate | null) => {
    const taxDetails = invoice.tax_details || {};
    const metadata = invoice.metadata || {};
    const companyName = template?.company_name || 'CreativeHub';
    const companyLogo = template?.company_logo_url || '';
    const companyAddress = template?.company_address || '—';
    const companyPhone = template?.company_phone || '';
    const companyEmail = template?.company_email || '';
    const companyWebsite = template?.company_website || '';
    const footerText = template?.footer_text || 'This is a computer-generated invoice and does not require a signature.';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .company-info { flex: 1; }
        .company-name { font-size: 28px; font-weight: bold; color: #333; margin-bottom: 5px; }
        .company-details { color: #666; line-height: 1.5; }
        .invoice-info { text-align: right; }
        .invoice-number { font-size: 24px; font-weight: bold; color: #333; }
        .invoice-date { color: #666; margin-top: 5px; }
        .billing-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .billing-info { flex: 1; }
        .billing-title { font-weight: bold; color: #333; margin-bottom: 10px; }
        .billing-details { color: #666; line-height: 1.6; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .items-table th { background: #f8f9fa; font-weight: bold; color: #333; }
        .totals-section { margin-left: auto; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .total-row.final { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 12px; margin-top: 12px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-paid { background: #d4edda; color: #155724; }
        .status-generated { background: #fff3cd; color: #856404; }
        .status-sent { background: #cce5ff; color: #004085; }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-height:48px;margin-bottom:8px;"/>` : ''}
                <div class="company-name">${companyName}</div>
                <div class="company-details">
                    ${companyAddress || ''}<br>
                    ${companyEmail ? `Email: ${companyEmail}<br>` : ''}
                    ${companyPhone ? `Phone: ${companyPhone}<br>` : ''}
                    ${companyWebsite ? `${companyWebsite}` : ''}
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-number">Invoice #${invoice.invoice_number}</div>
                <div class="invoice-date">${new Date(invoice.created_at).toLocaleDateString('en-IN')}</div>
                <div style="margin-top: 10px;">
                    <span class="status-badge status-${invoice.status}">${invoice.status}</span>
                </div>
            </div>
        </div>

        <div class="billing-section">
            <div class="billing-info">
                <div class="billing-title">Bill To:</div>
                <div class="billing-details">
                    ${invoice.invoice_type === 'customer' ? 'Customer' : 'Designer'}<br>
                    Session ID: ${invoice.session_id}<br>
                    ${invoice.booking_id ? `Booking ID: ${invoice.booking_id}` : 'Live Session'}
                </div>
            </div>
            <div class="billing-info">
                <div class="billing-title">Session Details:</div>
                <div class="billing-details">
                    Duration: ${invoice.session_duration || 'N/A'} minutes<br>
                    Date: ${new Date(invoice.created_at).toLocaleDateString('en-IN')}<br>
                    ${invoice.place_of_supply ? `Place of Supply: ${invoice.place_of_supply}` : ''}
                </div>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Duration</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Design Session - ${invoice.invoice_type === 'customer' ? 'Customer Payment' : 'Designer Earnings'}</td>
                    <td>${invoice.session_duration || 'N/A'} minutes</td>
                    <td>₹${(invoice.subtotal / (invoice.session_duration || 60)).toFixed(2)}/min</td>
                    <td>₹${invoice.subtotal.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>

        <div class="totals-section">
            <div class="total-row">
                <span>Session Amount:</span>
                <span>₹${invoice.subtotal.toFixed(2)}</span>
            </div>
            ${invoice.invoice_type === 'designer' ? `
            <div class="total-row" style="color: #dc2626;">
                <span>Platform Commission (${metadata.commission_rate || 10}%):</span>
                <span>-₹${(metadata.commission_amount || 0).toFixed(2)}</span>
            </div>
            <div class="total-row" style="color: #dc2626;">
                <span>TDS Deduction (${metadata.tds_rate || 10}%):</span>
                <span>-₹${(metadata.tds_amount || 0).toFixed(2)}</span>
            </div>
            ` : ''}
            ${invoice.tax_amount > 0 ? `
            <div class="total-row">
                <span>GST (${taxDetails.cgst_rate || 9}% CGST + ${taxDetails.sgst_rate || 9}% SGST):</span>
                <span>₹${invoice.tax_amount.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row final">
                <span>${invoice.invoice_type === 'customer' ? 'Total Paid:' : 'Net Earnings:'}</span>
                <span>₹${invoice.total_amount.toFixed(2)}</span>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for your business!</p>
            <p>${footerText}</p>
            ${invoice.payment_method ? `<p>Payment Method: ${invoice.payment_method}</p>` : ''}
            ${invoice.paid_at ? `<p>Paid on: ${new Date(invoice.paid_at).toLocaleDateString('en-IN')}</p>` : ''}
        </div>
    </div>
</body>
</html>`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
      case 'generated':
        return <Badge className="bg-yellow-100 text-yellow-800">Generated</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.session_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
          {isDesigner ? <DesignerSidebar /> : <CustomerSidebar />}
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading invoices...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        {isDesigner ? <DesignerSidebar /> : <CustomerSidebar />}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Session Invoices</h1>
              <p className="text-xl text-gray-600">View and download your session invoices</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                      <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{Math.round(invoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {invoices.filter(inv => inv.status === 'paid').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by invoice number or session ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="generated">Generated</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Invoices List */}
            <div className="space-y-4">
              {filteredInvoices.length === 0 ? (
                <Card className="bg-white shadow-lg">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No invoices found matching your criteria.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredInvoices.map((invoice) => (
                  <Card key={invoice.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-100 rounded-full">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Invoice #{invoice.invoice_number}</h3>
                            <p className="text-sm text-gray-600">Session ID: {invoice.session_id}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(invoice.created_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">₹{Math.round(invoice.total_amount)}</p>
                            <p className="text-sm text-gray-600">{invoice.invoice_type} invoice</p>
                          </div>
                          {getStatusBadge(invoice.status)}
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewInvoice(invoice)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadInvoice(invoice)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Subtotal</p>
                            <p className="font-medium">₹{Math.round(invoice.subtotal)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Tax</p>
                            <p className="font-medium">₹{Math.round(invoice.tax_amount || 0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Duration</p>
                            <p className="font-medium">{invoice.session_duration || 'N/A'} min</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Payment Method</p>
                            <p className="font-medium">{invoice.payment_method || 'Wallet'}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
