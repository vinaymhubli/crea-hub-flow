import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  Plus,
  Edit,
  Save,
  Upload,
  RefreshCw,
  Trash2,
  Palette,
  Type,
  Layout
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  invoice_number: string;
  session_id: string;
  customer_id: string;
  designer_id: string;
  invoice_type: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  customer_name: string;
  designer_name: string;
}

interface InvoiceTemplate {
  id: string;
  template_name: string;
  company_name: string;
  company_logo_url: string;
  company_address: any;
  company_phone: string;
  company_email: string;
  company_website: string;
  gst_number: string;
  pan_number: string;
  invoice_prefix: string;
  invoice_postfix: string;
  hsn_code: string;
  terms_conditions: string;
  invoice_type: string;
  background_color: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminInvoiceManagement() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showTemplatePreviewDialog, setShowTemplatePreviewDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const { toast } = useToast();

  const [templateForm, setTemplateForm] = useState({
    template_name: '',
    company_name: '',
    company_logo_url: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    gst_number: '',
    pan_number: '',
    invoice_prefix: '',
    invoice_postfix: '',
    hsn_code: '',
    terms_conditions: '',
    invoice_type: 'session_payment',
    background_color: '#ffffff',
    is_active: true
  });

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchTemplates();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Fetch invoices first
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      if (!invoicesData || invoicesData.length === 0) {
        setInvoices([]);
        return;
      }

      // Get unique customer and designer IDs
      const customerIds = [...new Set(invoicesData.map(inv => inv.customer_id).filter(Boolean))];
      const designerIds = [...new Set(invoicesData.map(inv => inv.designer_id).filter(Boolean))];

      // Fetch customer profiles
      const { data: customersData } = await supabase
        .from('profiles')
        .select('user_id, full_name, first_name, last_name, email')
        .in('user_id', customerIds);

      // Fetch designer profiles
      const { data: designersData } = await supabase
        .from('profiles')
        .select('user_id, full_name, first_name, last_name, email')
        .in('user_id', designerIds);

      // Create lookup maps
      const customersMap = new Map(customersData?.map(c => [c.user_id, c]) || []);
      const designersMap = new Map(designersData?.map(d => [d.user_id, d]) || []);

      // Format invoices with names
      const formattedInvoices = invoicesData.map(invoice => {
        const customer = customersMap.get(invoice.customer_id);
        const designer = designersMap.get(invoice.designer_id);

        return {
          ...invoice,
          customer_name: customer?.full_name || 
                        `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() ||
                        customer?.email || 'Unknown Customer',
          designer_name: designer?.full_name || 
                        `${designer?.first_name || ''} ${designer?.last_name || ''}`.trim() ||
                        designer?.email || 'Unknown Designer'
        };
      });

      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data: templatesData, error: templatesError } = await supabase
        .from('invoice_templates')
        .select(`
          id,
          template_name,
          company_name,
          company_logo_url,
          company_address,
          company_phone,
          company_email,
          company_website,
          gst_number,
          pan_number,
          invoice_prefix,
          invoice_postfix,
          hsn_code,
          terms_conditions,
          invoice_type,
          background_color,
          is_active,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive"
      });
    }
  };

  const getTemplateForInvoice = async (invoice: Invoice): Promise<any | null> => {
    // Prefer invoice.template_id, otherwise fallback to active template
    try {
      if ((invoice as any).template_id) {
        const { data } = await supabase
          .from('invoice_templates')
          .select('*')
          .eq('id', (invoice as any).template_id)
          .single();
        if (data) return data;
      }

      const { data: active } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return (active || null);
    } catch (_e) {
      return null;
    }
  };

  const generateInvoiceHTML = async (invoice: Invoice, template: any) => {
    const taxDetails = invoice.tax_details || {};
    const metadata = invoice.metadata || {};
    const companyName = template?.company_name || 'CreativeHub';
    const companyLogo = template?.company_logo_url || '';
    const companyAddress = template?.company_address || '—';
    const companyPhone = template?.company_phone || '';
    const companyEmail = template?.company_email || '';
    const companyWebsite = template?.company_website || '';
    const footerText = template?.footer_text || 'This is a computer-generated invoice and does not require a signature.';

    // Fetch customer and designer names
    let customerName = 'Customer';
    let designerName = 'Designer';

    try {
      // Get customer name
      if (invoice.customer_id) {
        const { data: customerProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', invoice.customer_id)
          .single();
        
        if (customerProfile) {
          customerName = `${customerProfile.first_name || ''} ${customerProfile.last_name || ''}`.trim() || 'Customer';
        }
      }

      // Get designer name
      if (invoice.designer_id) {
        const { data: designerProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', invoice.designer_id)
          .single();
        
        if (designerProfile) {
          designerName = `${designerProfile.first_name || ''} ${designerProfile.last_name || ''}`.trim() || 'Designer';
        }
      }
    } catch (error) {
      console.error('Error fetching names for invoice:', error);
    }
    
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
                    ${invoice.invoice_type === 'customer' ? customerName : designerName}<br>
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

  const viewInvoice = async (invoice: Invoice) => {
    try {
      const template = await getTemplateForInvoice(invoice);
      const invoiceContent = await generateInvoiceHTML(invoice, template);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(invoiceContent);
        w.document.close();
      }
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast({
        title: "Error",
        description: "Failed to view invoice",
        variant: "destructive",
      });
    }
  };

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      const template = await getTemplateForInvoice(invoice);
      const invoiceContent = await generateInvoiceHTML(invoice, template);
      
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

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('invoice_templates')
          .update(templateForm)
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Template updated successfully"
        });
      } else {
        // Check if template of this type already exists
        const { data: existingTemplate, error: checkError } = await supabase
          .from('invoice_templates')
          .select('id, template_name')
          .eq('invoice_type', templateForm.invoice_type)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingTemplate) {
          toast({
            title: "Error",
            description: `A template for "${getInvoiceTypeLabel(templateForm.invoice_type)}" already exists. Only one template per invoice type is allowed.`,
            variant: "destructive"
          });
          return;
        }

        // Create new template
        const { error } = await supabase
          .from('invoice_templates')
          .insert([templateForm]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Template created successfully"
        });
      }

      resetTemplateForm();
      setShowTemplateDialog(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const handleEditTemplate = (template: InvoiceTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      template_name: template.template_name,
      company_name: template.company_name,
      company_logo_url: template.company_logo_url || '',
      company_address: typeof template.company_address === 'string' 
        ? template.company_address 
        : JSON.stringify(template.company_address, null, 2),
      company_phone: template.company_phone || '',
      company_email: template.company_email || '',
      company_website: template.company_website || '',
      gst_number: template.gst_number || '',
      pan_number: template.pan_number || '',
      invoice_prefix: template.invoice_prefix || '',
      invoice_postfix: template.invoice_postfix || '',
      hsn_code: template.hsn_code || '',
      terms_conditions: template.terms_conditions || '',
      invoice_type: template.invoice_type,
      background_color: template.background_color || '#ffffff',
      is_active: template.is_active
    });
    setShowTemplateDialog(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('invoice_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully"
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const handlePreviewTemplate = (template: InvoiceTemplate) => {
    setPreviewTemplate(template);
    setShowTemplatePreviewDialog(true);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      template_name: '',
      company_name: '',
      company_logo_url: '',
      company_address: '',
      company_phone: '',
      company_email: '',
      company_website: '',
      gst_number: '',
      pan_number: '',
      invoice_prefix: '',
      invoice_postfix: '',
      hsn_code: '',
      terms_conditions: '',
      invoice_type: 'session_payment',
      background_color: '#ffffff',
      is_active: true
    });
    setEditingTemplate(null);
  };

  const getInvoiceTypeLabel = (type: string) => {
    switch (type) {
      case 'session_payment': return 'Session Payment';
      case 'session_earnings': return 'Session Earnings';
      case 'recharge': return 'Wallet Recharge';
      case 'withdrawal': return 'Withdrawal';
      default: return type;
    }
  };

  const getInvoiceTypeBadge = (type: string) => {
    const colors = {
      'session_payment': 'bg-blue-100 text-blue-800',
      'session_earnings': 'bg-green-100 text-green-800',
      'recharge': 'bg-purple-100 text-purple-800',
      'withdrawal': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {getInvoiceTypeLabel(type)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated': return <Badge className="bg-blue-100 text-blue-800">Generated</Badge>;
      case 'sent': return <Badge className="bg-yellow-100 text-yellow-800">Sent</Badge>;
      case 'paid': return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.designer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesType = filterType === 'all' || invoice.invoice_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading invoice management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-gray-600">Manage invoices, templates, and design settings</p>
        </div>
        <div className="flex gap-2">
          {/* <Button 
            onClick={async () => {
              try {
                const { data, error } = await supabase.rpc('generate_sample_invoices');
                if (error) throw error;
                toast({
                  title: "Success",
                  description: "Sample invoices generated successfully"
                });
                fetchInvoices();
              } catch (error) {
                console.error('Error generating sample invoices:', error);
                toast({
                  title: "Error",
                  description: "Failed to generate sample invoices",
                  variant: "destructive"
                });
              }
            }}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Sample Invoices
          </Button> */}
          <Button onClick={() => setShowPreviewDialog(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Invoices
          </Button>
        </div>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="templates">Invoice Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search invoices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="generated">Generated</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="session_payment">Session Payment</SelectItem>
                    <SelectItem value="session_earnings">Session Earnings</SelectItem>
                    <SelectItem value="recharge">Wallet Recharge</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                All Invoices ({filteredInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No invoices found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Designer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell>
                            {getInvoiceTypeBadge(invoice.invoice_type)}
                          </TableCell>
                          <TableCell>{invoice.customer_name}</TableCell>
                          <TableCell>{invoice.designer_name}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(invoice.total_amount)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(invoice.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => viewInvoice(invoice)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => downloadInvoice(invoice)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Invoice Templates
            </CardTitle>
            <Button onClick={() => setShowTemplateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {template.is_active && (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Background: {template.background_color}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Type: {template.invoice_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Prefix: {template.invoice_prefix}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {template.company_name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Update the invoice template' : 'Create a new invoice template'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleTemplateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template_name">Template Name</Label>
                <Input
                  id="template_name"
                  value={templateForm.template_name}
                  onChange={(e) => setTemplateForm({...templateForm, template_name: e.target.value})}
                  placeholder="Enter template name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={templateForm.company_name}
                  onChange={(e) => setTemplateForm({...templateForm, company_name: e.target.value})}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="invoice_type">Invoice Type</Label>
                <Select 
                  value={templateForm.invoice_type} 
                  onValueChange={(value) => setTemplateForm({...templateForm, invoice_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session_payment">Session Payment</SelectItem>
                    <SelectItem value="session_earnings">Session Earnings</SelectItem>
                    <SelectItem value="recharge">Wallet Recharge</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="background_color">Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={templateForm.background_color}
                    onChange={(e) => setTemplateForm({...templateForm, background_color: e.target.value})}
                    className="w-16 h-10"
                  />
                  <Input
                    value={templateForm.background_color}
                    onChange={(e) => setTemplateForm({...templateForm, background_color: e.target.value})}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                <Input
                  id="invoice_prefix"
                  value={templateForm.invoice_prefix}
                  onChange={(e) => setTemplateForm({...templateForm, invoice_prefix: e.target.value})}
                  placeholder="e.g., INV"
                />
              </div>

              <div>
                <Label htmlFor="invoice_postfix">Invoice Postfix</Label>
                <Input
                  id="invoice_postfix"
                  value={templateForm.invoice_postfix}
                  onChange={(e) => setTemplateForm({...templateForm, invoice_postfix: e.target.value})}
                  placeholder="e.g., 2024"
                />
              </div>

              <div>
                <Label htmlFor="company_logo_url">Company Logo</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="company_logo_url"
                    value={templateForm.company_logo_url}
                    onChange={(e) => setTemplateForm({...templateForm, company_logo_url: e.target.value})}
                    placeholder="Enter logo URL or upload file"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${Date.now()}.${fileExt}`;
                          const filePath = `invoice-logos/${fileName}`;
                          
                          const { data, error } = await supabase.storage
                            .from('public')
                            .upload(filePath, file);
                          
                          if (error) throw error;
                          
                          const { data: { publicUrl } } = supabase.storage
                            .from('public')
                            .getPublicUrl(filePath);
                          
                          setTemplateForm({...templateForm, company_logo_url: publicUrl});
                          toast({
                            title: "Success",
                            description: "Logo uploaded successfully"
                          });
                        } catch (error) {
                          console.error('Upload error:', error);
                          toast({
                            title: "Error",
                            description: "Failed to upload logo",
                            variant: "destructive"
                          });
                        }
                      }
                    }}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
                {templateForm.company_logo_url && (
                  <div className="mt-2">
                    <img 
                      src={templateForm.company_logo_url} 
                      alt="Company Logo" 
                      className="w-20 h-20 object-contain border rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="company_phone">Company Phone</Label>
                <Input
                  id="company_phone"
                  value={templateForm.company_phone}
                  onChange={(e) => setTemplateForm({...templateForm, company_phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label htmlFor="company_email">Company Email</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={templateForm.company_email}
                  onChange={(e) => setTemplateForm({...templateForm, company_email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="company_website">Company Website</Label>
                <Input
                  id="company_website"
                  value={templateForm.company_website}
                  onChange={(e) => setTemplateForm({...templateForm, company_website: e.target.value})}
                  placeholder="Enter website URL"
                />
              </div>

              <div>
                <Label htmlFor="gst_number">GST Number</Label>
                <Input
                  id="gst_number"
                  value={templateForm.gst_number}
                  onChange={(e) => setTemplateForm({...templateForm, gst_number: e.target.value})}
                  placeholder="Enter GST number"
                />
              </div>

              <div>
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input
                  id="pan_number"
                  value={templateForm.pan_number}
                  onChange={(e) => setTemplateForm({...templateForm, pan_number: e.target.value})}
                  placeholder="Enter PAN number"
                />
              </div>

              <div>
                <Label htmlFor="hsn_code">HSN Code</Label>
                <Input
                  id="hsn_code"
                  value={templateForm.hsn_code}
                  onChange={(e) => setTemplateForm({...templateForm, hsn_code: e.target.value})}
                  placeholder="Enter HSN code"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company_address">Company Address</Label>
              <Textarea
                id="company_address"
                value={templateForm.company_address}
                onChange={(e) => setTemplateForm({...templateForm, company_address: e.target.value})}
                placeholder="Enter company address (JSON format)"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="terms_conditions">Terms & Conditions</Label>
              <Textarea
                id="terms_conditions"
                value={templateForm.terms_conditions}
                onChange={(e) => setTemplateForm({...templateForm, terms_conditions: e.target.value})}
                placeholder="Enter terms and conditions"
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={templateForm.is_active}
                onChange={(e) => setTemplateForm({...templateForm, is_active: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="is_active">Active Template</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingTemplate ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showTemplatePreviewDialog} onOpenChange={setShowTemplatePreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how this template will look in invoices
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-6">
              {/* Invoice Preview */}
              <div 
                className="border-2 border-gray-200 rounded-lg p-8 bg-white"
                style={{ backgroundColor: previewTemplate.background_color }}
              >
                <div className="max-w-4xl mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
                  <div className="text-xs text-gray-500 mb-4 text-center border-b pb-2">
                    Invoice Size: A4 (210mm × 297mm) - Standard Business Invoice Format
                  </div>
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      {previewTemplate.company_logo_url && (
                        <img 
                          src={previewTemplate.company_logo_url} 
                          alt="Company Logo" 
                          className="h-16 w-auto mb-4"
                        />
                      )}
                      <h1 className="text-2xl font-bold text-gray-900">
                        {previewTemplate.company_name}
                      </h1>
                      <div className="text-sm text-gray-600 mt-2">
                        {previewTemplate.company_address && (
                          <div>
                            {typeof previewTemplate.company_address === 'string' 
                              ? previewTemplate.company_address 
                              : JSON.stringify(previewTemplate.company_address, null, 2)}
                          </div>
                        )}
                        {previewTemplate.company_phone && (
                          <div>Phone: {previewTemplate.company_phone}</div>
                        )}
                        {previewTemplate.company_email && (
                          <div>Email: {previewTemplate.company_email}</div>
                        )}
                        {previewTemplate.company_website && (
                          <div>Website: {previewTemplate.company_website}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
                      <div className="text-sm text-gray-600 mt-2">
                        <div>Invoice #: {previewTemplate.invoice_prefix}001{previewTemplate.invoice_postfix}</div>
                        <div>Date: {new Date().toLocaleDateString()}</div>
                        {previewTemplate.gst_number && (
                          <div>GST: {previewTemplate.gst_number}</div>
                        )}
                        {previewTemplate.pan_number && (
                          <div>PAN: {previewTemplate.pan_number}</div>
                        )}
                        {/* Show dispute resolution fields only for session-related invoices */}
                        {(previewTemplate.invoice_type === 'session_payment' || previewTemplate.invoice_type === 'session_earnings') && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <div className="text-xs text-gray-500">
                              <div>Customer ID: CUST-001</div>
                              <div>Session ID: SESS-001</div>
                              <div>Booking ID: BOOK-001</div>
                              <div>Session Duration: 60 minutes</div>
                              <div>HSN Code: 998314</div>
                              <div>Place of Supply: Maharashtra</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bill To Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {previewTemplate.invoice_type === 'session_earnings' ? 'Earnings For:' : 'Bill To:'}
                    </h3>
                    <div className="text-gray-700">
                      {previewTemplate.invoice_type === 'session_earnings' ? (
                        <>
                          <div className="font-semibold">Designer Name</div>
                          <div>Designer Address</div>
                          <div>City, State - PIN</div>
                          <div>Email: designer@example.com</div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold">Customer Name</div>
                          <div>Customer Address</div>
                          <div>City, State - PIN</div>
                          <div>Email: customer@example.com</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-8">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                          {(previewTemplate.invoice_type === 'session_payment' || previewTemplate.invoice_type === 'session_earnings') && (
                            <th className="border border-gray-300 px-4 py-2 text-center">HSN Code</th>
                          )}
                          <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Rate</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewTemplate.invoice_type === 'session_earnings' ? (
                          <>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">Session Earnings</td>
                              {(previewTemplate.invoice_type === 'session_payment' || previewTemplate.invoice_type === 'session_earnings') && (
                                <td className="border border-gray-300 px-4 py-2 text-center">998314</td>
                              )}
                              <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">₹1,000.00</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">₹1,000.00</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">Platform Fee (Admin Commission)</td>
                              {(previewTemplate.invoice_type === 'session_payment' || previewTemplate.invoice_type === 'session_earnings') && (
                                <td className="border border-gray-300 px-4 py-2 text-center">998314</td>
                              )}
                              <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">-₹100.00</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">-₹100.00</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">TDS Deduction</td>
                              {(previewTemplate.invoice_type === 'session_payment' || previewTemplate.invoice_type === 'session_earnings') && (
                                <td className="border border-gray-300 px-4 py-2 text-center">998314</td>
                              )}
                              <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">-₹100.00</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">-₹100.00</td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                {previewTemplate.invoice_type === 'session_payment' ? 'Design Session Fee' : 
                                 previewTemplate.invoice_type === 'recharge' ? 'Wallet Recharge' :
                                 previewTemplate.invoice_type === 'withdrawal' ? 'Withdrawal' :
                                 'Service Fee'}
                              </td>
                              {(previewTemplate.invoice_type === 'session_payment' || previewTemplate.invoice_type === 'session_earnings') && (
                                <td className="border border-gray-300 px-4 py-2 text-center">998314</td>
                              )}
                              <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">₹1,000.00</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">₹1,000.00</td>
                            </tr>
                            {previewTemplate.invoice_type === 'session_payment' && (
                              <tr>
                                <td className="border border-gray-300 px-4 py-2">GST (18%)</td>
                                {(previewTemplate.invoice_type === 'session_payment' || previewTemplate.invoice_type === 'session_earnings') && (
                                  <td className="border border-gray-300 px-4 py-2 text-center">998314</td>
                                )}
                                <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">₹180.00</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">₹180.00</td>
                              </tr>
                            )}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end mb-8">
                    <div className="w-64">
                      {previewTemplate.invoice_type === 'session_earnings' ? (
                        <>
                          <div className="flex justify-between py-2 border-b">
                            <span>Session Earnings:</span>
                            <span>₹1,000.00</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>Platform Fee:</span>
                            <span>-₹100.00</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>TDS Deduction:</span>
                            <span>-₹100.00</span>
                          </div>
                          <div className="flex justify-between py-2 font-bold text-lg">
                            <span>Net Earnings:</span>
                            <span>₹800.00</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between py-2 border-b">
                            <span>Subtotal:</span>
                            <span>₹1,000.00</span>
                          </div>
                          {previewTemplate.invoice_type === 'session_payment' && (
                            <div className="flex justify-between py-2 border-b">
                              <span>GST (18%):</span>
                              <span>₹180.00</span>
                            </div>
                          )}
                          <div className="flex justify-between py-2 font-bold text-lg">
                            <span>Total:</span>
                            <span>₹{previewTemplate.invoice_type === 'session_payment' ? '1,180.00' : '1,000.00'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  {previewTemplate.terms_conditions && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms & Conditions:</h3>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {previewTemplate.terms_conditions}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
                    <p>Thank you for your business!</p>
                    {previewTemplate.company_website && (
                      <p>Visit us at: {previewTemplate.company_website}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Invoices Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Invoices</DialogTitle>
            <DialogDescription>
              Preview how invoices will look with your current templates
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-4">Invoice Types Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Session Payment Invoice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Generated when customers pay for design sessions. Includes GST and tax calculations.
                    </p>
                    <div className="text-xs text-gray-500">
                      <div>• Design Session Fee: ₹1,000</div>
                      <div>• GST (18%): ₹180</div>
                      <div>• Total: ₹1,180</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Wallet Recharge Invoice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Generated when customers add money to their wallet. Simple invoice without taxes.
                    </p>
                    <div className="text-xs text-gray-500">
                      <div>• Wallet Recharge: ₹500</div>
                      <div>• No GST applied</div>
                      <div>• Total: ₹500</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Withdrawal Invoice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Generated when anyone (designer or customer) withdraws money from their wallet to bank account. Simple invoice without taxes.
                    </p>
                    <div className="text-xs text-gray-500">
                      <div>• Withdrawal: ₹800</div>
                      <div>• No GST applied</div>
                      <div>• Total: ₹800</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Session Earnings Invoice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Generated for designers showing their earnings after platform fee (admin commission) and TDS deductions.
                    </p>
                    <div className="text-xs text-gray-500">
                      <div>• Session Earnings: ₹1,000</div>
                      <div>• Platform Fee (Admin): -₹100</div>
                      <div>• TDS Deduction: -₹100</div>
                      <div>• Net Earnings: ₹800</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}