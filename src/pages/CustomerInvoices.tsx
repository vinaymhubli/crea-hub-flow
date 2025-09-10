import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CustomerSidebar } from '@/components/CustomerSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Receipt, 
  Download, 
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  session_id: string;
  booking_id: string;
  designer_name: string;
  customer_name: string;
  duration_minutes: number;
  rate_per_minute: number;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  invoice_date: string;
  status: 'generated' | 'sent' | 'paid';
  created_at: string;
}

export default function CustomerInvoices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadInvoices();
    }
  }, [user]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      
      // Get invoices using RLS policies (will automatically filter by user)
      const { data, error } = await supabase
        .from('session_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'generated': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'sent': return 'Sent';
      case 'generated': return 'Generated';
      default: return 'Unknown';
    }
  };

  const downloadInvoice = (invoice: Invoice) => {
    // Generate a simple invoice PDF or text file
    const invoiceContent = `
DESIGN SESSION INVOICE

Invoice ID: ${invoice.id}
Session ID: ${invoice.session_id}
Date: ${format(new Date(invoice.invoice_date), 'PPP')}

Designer: ${invoice.designer_name}
Customer: ${invoice.customer_name}

Session Details:
Duration: ${invoice.duration_minutes} minutes
Rate: ${formatCurrency(invoice.rate_per_minute)}/minute

Calculation:
Subtotal: ${formatCurrency(invoice.subtotal)}
GST (18%): ${formatCurrency(invoice.gst_amount)}
Total: ${formatCurrency(invoice.total_amount)}

Status: ${getStatusText(invoice.status)}
Generated: ${format(new Date(invoice.created_at), 'PPpp')}
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.id.slice(-8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Invoice downloaded",
      description: "Invoice has been downloaded to your device",
    });
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50">
          <CustomerSidebar />
          <main className="flex-1 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading invoices...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <CustomerSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center space-x-3 mb-6">
                <SidebarTrigger className="md:hidden" />
                <Receipt className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
                  <p className="text-sm text-gray-600">View and download your session invoices</p>
                </div>
              </div>

              {invoices.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Receipt className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      You don't have any invoices yet. Invoices will appear here after your design sessions.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {invoices.map((invoice) => (
                    <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Invoice #{invoice.id.slice(-8)}
                              </h3>
                              <Badge className={getStatusColor(invoice.status)}>
                                {getStatusText(invoice.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Session with <span className="font-medium">{invoice.designer_name}</span>
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{format(new Date(invoice.invoice_date), 'PPP')}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{invoice.duration_minutes} minutes</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(invoice.total_amount)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(invoice.rate_per_minute)}/minute
                            </p>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                            <p className="font-medium">{formatCurrency(invoice.subtotal)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">GST (18%)</p>
                            <p className="font-medium">{formatCurrency(invoice.gst_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Session ID</p>
                            <p className="font-mono text-sm">{invoice.session_id.slice(0, 12)}...</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Generated</p>
                            <p className="text-sm">{format(new Date(invoice.created_at), 'PP')}</p>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadInvoice(invoice)}
                            className="flex items-center space-x-1"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
