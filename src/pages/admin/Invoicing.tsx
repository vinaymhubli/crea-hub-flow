import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard,
  DollarSign,
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  designer_name: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  created_at: string;
  payment_method?: string;
  commission_amount: number;
  booking_id: string;
  customer_id: string;
  designer_id: string;
}

interface PaymentMethod {
  method: string;
  total_amount: number;
  count: number;
  percentage: number;
}

interface InvoiceStats {
  totalRevenue: number;
  totalCommission: number;
  pendingAmount: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

export default function Invoicing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [stats, setStats] = useState<InvoiceStats>({
    totalRevenue: 0,
    totalCommission: 0,
    pendingAmount: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings with related data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          total_amount,
          status,
          scheduled_date,
          created_at,
          customer_id,
          designer_id,
          profiles!bookings_customer_id_fkey(
            display_name,
            first_name,
            last_name,
            email
          ),
          designers!bookings_designer_id_fkey(
            specialty,
            hourly_rate
          )
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        throw bookingsError;
      }

      if (bookingsData) {
        // Transform bookings data to invoice format
        const transformedInvoices: Invoice[] = bookingsData.map((booking, index) => {
          const customerProfile = booking.profiles as any;
          const designer = booking.designers as any;
          
          // Calculate commission (15% of total amount)
          const commissionAmount = booking.total_amount * 0.15;
          
          // Generate invoice number
          const invoiceNumber = `INV-${new Date(booking.created_at).getFullYear()}-${String(index + 1).padStart(3, '0')}`;
          
          // Determine status based on booking status and date
          let status: 'pending' | 'paid' | 'overdue' | 'cancelled' = 'pending';
          if (booking.status === 'completed') status = 'paid';
          else if (booking.status === 'cancelled') status = 'cancelled';
          else if (new Date(booking.scheduled_date) < new Date()) status = 'overdue';
          
          // Determine payment method (mock for now, would come from actual payment data)
          const paymentMethods = ['Credit Card', 'PayPal', 'Bank Transfer'];
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
          
          return {
            id: booking.id,
            invoice_number: invoiceNumber,
            customer_name: customerProfile?.display_name || 
                          `${customerProfile?.first_name || ''} ${customerProfile?.last_name || ''}`.trim() || 
                          'Unknown Customer',
            designer_name: designer?.specialty || 'Designer',
            amount: booking.total_amount,
            status,
            due_date: booking.scheduled_date,
            created_at: booking.created_at,
            payment_method: paymentMethod,
            commission_amount: commissionAmount,
            booking_id: booking.id,
            customer_id: booking.customer_id,
            designer_id: booking.designer_id
          };
        });

        setInvoices(transformedInvoices);
        calculateStats(transformedInvoices);
        calculatePaymentMethods(transformedInvoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoiceData: Invoice[]) => {
    const totalRevenue = invoiceData.reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalCommission = invoiceData.reduce((sum, invoice) => sum + invoice.commission_amount, 0);
    const pendingAmount = invoiceData
      .filter(invoice => invoice.status === 'pending')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalInvoices = invoiceData.length;
    const paidInvoices = invoiceData.filter(invoice => invoice.status === 'paid').length;
    const overdueInvoices = invoiceData.filter(invoice => invoice.status === 'overdue').length;

    setStats({
      totalRevenue,
      totalCommission,
      pendingAmount,
      totalInvoices,
      paidInvoices,
      overdueInvoices
    });
  };

  const calculatePaymentMethods = (invoiceData: Invoice[]) => {
    const methodMap = new Map<string, { amount: number; count: number }>();
    
    invoiceData.forEach(invoice => {
      if (invoice.payment_method) {
        const existing = methodMap.get(invoice.payment_method) || { amount: 0, count: 0 };
        methodMap.set(invoice.payment_method, {
          amount: existing.amount + invoice.amount,
          count: existing.count + 1
        });
      }
    });

    const totalAmount = invoiceData.reduce((sum, invoice) => sum + invoice.amount, 0);
    
    const methods: PaymentMethod[] = Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      total_amount: data.amount,
      count: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
    }));

    setPaymentMethods(methods);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.designer_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const invoiceDate = new Date(invoice.created_at);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = invoiceDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = invoiceDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          matchesDate = invoiceDate >= monthAgo;
          break;
        case 'quarter':
          const quarterAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
          matchesDate = invoiceDate >= quarterAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleExport = () => {
    // Create CSV content
    const headers = ['Invoice #', 'Customer', 'Designer', 'Amount', 'Commission', 'Status', 'Due Date', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredInvoices.map(invoice => [
        invoice.invoice_number,
        invoice.customer_name,
        invoice.designer_name,
        invoice.amount.toFixed(2),
        invoice.commission_amount.toFixed(2),
        invoice.status,
        new Date(invoice.due_date).toLocaleDateString(),
        new Date(invoice.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Invoice data exported successfully!');
  };

  const handleViewInvoice = (invoice: Invoice) => {
    // In a real app, this would open a detailed invoice view
    toast.info(`Viewing invoice ${invoice.invoice_number} for ${invoice.customer_name}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading invoice data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Invoicing
          </h1>
          <p className="text-muted-foreground mt-2">Manage invoices, payments, and revenue tracking</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchInvoices}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalInvoices} invoice{stats.totalInvoices !== 1 ? 's' : ''} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.totalCommission / stats.totalRevenue) * 100).toFixed(1)}% of total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalInvoices - stats.paidInvoices} invoice{stats.totalInvoices - stats.paidInvoices !== 1 ? 's' : ''} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalInvoices > 0 ? ((stats.paidInvoices / stats.totalInvoices) * 100).toFixed(1) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalInvoices > 0 ? (stats.totalRevenue / stats.totalInvoices).toFixed(0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per invoice average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No invoices found matching your criteria</p>
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }} className="mt-2">
                Clear Filters
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Designer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>{invoice.designer_name}</TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>${invoice.commission_amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const url = window.URL.createObjectURL(
                              new Blob([`Invoice ${invoice.invoice_number}\n\nCustomer: ${invoice.customer_name}\nDesigner: ${invoice.designer_name}\nAmount: $${invoice.amount.toFixed(2)}\nCommission: $${invoice.commission_amount.toFixed(2)}\nStatus: ${invoice.status}\nDue Date: ${new Date(invoice.due_date).toLocaleDateString()}`], 
                              { type: 'text/plain' })
                            );
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${invoice.invoice_number}.txt`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Summary */}
      {paymentMethods.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Summary</CardTitle>
              <CardDescription>Breakdown of payments by method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {paymentMethods.map((method) => (
                  <div key={method.method} className="text-center p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold">{method.method}</h3>
                    <p className="text-2xl font-bold text-blue-600">${method.total_amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {method.count} payment{method.count !== 1 ? 's' : ''} ({method.percentage.toFixed(1)}%)
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
