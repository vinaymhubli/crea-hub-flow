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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DollarSign, 
  Search, 
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  CreditCard,
  Wallet,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeftRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RefundTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  status: string;
  description: string;
  metadata: any;
  created_at: string;
  user_name: string;
  user_role: string;
  designer_name?: string;
  customer_name?: string;
  admin_name?: string;
  reason?: string;
  reference_type?: string;
  reference_id?: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  available_balance?: number;
}

export default function AdminRefunds() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [refundTransactions, setRefundTransactions] = useState<RefundTransaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundForm, setRefundForm] = useState({
    designer_id: '',
    customer_id: '',
    amount: '',
    reason: '',
    reference_type: 'complaint',
    reference_id: ''
  });

  useEffect(() => {
    if (user) {
      fetchRefundTransactions();
      fetchUsers();
    }
  }, [user]);

  const fetchRefundTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select(`
          *,
          user:profiles!wallet_transactions_user_id_fkey(first_name, last_name, role)
        `)
        .eq('metadata->>transaction_type', 'admin_refund')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedTransactions = data?.map(transaction => ({
        ...transaction,
        user_name: `${transaction.user?.first_name || ''} ${transaction.user?.last_name || ''}`.trim() || 'Unknown User',
        user_role: transaction.user?.role || 'unknown',
        designer_name: transaction.metadata?.designer_id ? 'Loading...' : undefined,
        customer_name: transaction.metadata?.customer_id ? 'Loading...' : undefined,
        admin_name: transaction.metadata?.admin_id ? 'Loading...' : undefined,
        reason: transaction.metadata?.reason,
        reference_type: transaction.metadata?.reference_type,
        reference_id: transaction.metadata?.reference_id
      })) || [];

      // Fetch additional user details for designer, customer, and admin
      for (const transaction of formattedTransactions) {
        if (transaction.metadata?.designer_id) {
          const { data: designerData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', transaction.metadata.designer_id)
            .single();
          if (designerData) {
            transaction.designer_name = `${designerData.first_name} ${designerData.last_name}`;
          }
        }

        if (transaction.metadata?.customer_id) {
          const { data: customerData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', transaction.metadata.customer_id)
            .single();
          if (customerData) {
            transaction.customer_name = `${customerData.first_name} ${customerData.last_name}`;
          }
        }

        if (transaction.metadata?.admin_id) {
          const { data: adminData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', transaction.metadata.admin_id)
            .single();
          if (adminData) {
            transaction.admin_name = `${adminData.first_name} ${adminData.last_name}`;
          }
        }
      }

      setRefundTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching refund transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch refund transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, full_name, role')
        .in('role', ['designer', 'customer'])
        .order('first_name');

      if (error) throw error;

      // Get available balances for designers
      const usersWithBalances = await Promise.all(
        (data || []).map(async (user) => {
          if (user.role === 'designer') {
            const { data: balanceData } = await supabase.rpc('get_available_earnings', {
              user_uuid: user.id || user.user_id
            });
            return {
              ...user,
              id: user.id || user.user_id,
              available_balance: balanceData || 0
            };
          }
          return {
            ...user,
            id: user.id || user.user_id,
            available_balance: 0
          };
        })
      );

      setUsers(usersWithBalances);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleProcessRefund = async () => {
    if (!refundForm.designer_id || !refundForm.customer_id || !refundForm.amount || !refundForm.reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingRefund(true);

      const { data, error } = await supabase.rpc('process_admin_refund', {
        p_admin_id: user?.id,
        p_designer_id: refundForm.designer_id,
        p_customer_id: refundForm.customer_id,
        p_amount: parseFloat(refundForm.amount),
        p_reason: refundForm.reason,
        p_reference_type: refundForm.reference_type,
        p_reference_id: refundForm.reference_id || null
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: "Refund Processed",
          description: result.message,
        });

        // Send notifications to designer and customer
        await supabase.rpc('send_notification', {
          p_user_id: refundForm.designer_id,
          p_type: 'payment_received',
          p_title: 'Refund Processed',
          p_message: `A refund of ₹${refundForm.amount} has been processed from your account. Reason: ${refundForm.reason}`,
          p_action_url: `/designer-dashboard/earnings`,
          p_metadata: { refund_id: result.refund_id, amount: refundForm.amount, reason: refundForm.reason }
        });

        await supabase.rpc('send_notification', {
          p_user_id: refundForm.customer_id,
          p_type: 'payment_received',
          p_title: 'Refund Received',
          p_message: `You have received a refund of ₹${refundForm.amount}. Reason: ${refundForm.reason}`,
          p_action_url: `/customer/wallet`,
          p_metadata: { refund_id: result.refund_id, amount: refundForm.amount, reason: refundForm.reason }
        });

        setShowRefundDialog(false);
        setRefundForm({
          designer_id: '',
          customer_id: '',
          amount: '',
          reason: '',
          reference_type: 'complaint',
          reference_id: ''
        });
        fetchRefundTransactions();
        fetchUsers();
      } else {
        toast({
          title: "Refund Failed",
          description: result?.message || 'Unknown error occurred',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'pending': 'secondary',
      'completed': 'default',
      'failed': 'destructive',
      'cancelled': 'outline'
    };
    return variants[status] || 'default';
  };

  const formatAmount = (amount: number, type: string) => {
    const isNegative = type === 'withdrawal';
    const sign = isNegative ? '-' : '+';
    return `${sign}₹${Math.abs(amount).toFixed(2)}`;
  };

  const filteredTransactions = refundTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.designer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || transaction.transaction_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const designers = users.filter(u => u.role === 'designer');
  const customers = users.filter(u => u.role === 'customer');

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Refund Management</h1>
          <p className="text-gray-600">Process refunds by transferring money from designer wallets to customers</p>
        </div>
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogTrigger asChild>
            <Button>
              <DollarSign className="w-4 h-4 mr-2" />
              Process Refund
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Process Refund</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="designer">Designer *</Label>
                  <Select 
                    value={refundForm.designer_id} 
                    onValueChange={(value) => setRefundForm(prev => ({ ...prev, designer_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select designer" />
                    </SelectTrigger>
                    <SelectContent>
                      {designers.map((designer) => (
                        <SelectItem key={designer.id} value={designer.id}>
                          {designer.first_name} {designer.last_name} 
                          {designer.available_balance !== undefined && (
                            <span className="text-sm text-gray-500 ml-2">
                              (₹{designer.available_balance.toFixed(2)})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select 
                    value={refundForm.customer_id} 
                    onValueChange={(value) => setRefundForm(prev => ({ ...prev, customer_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.first_name} {customer.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="reference_type">Reference Type</Label>
                  <Select 
                    value={refundForm.reference_type} 
                    onValueChange={(value) => setRefundForm(prev => ({ ...prev, reference_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="session">Session</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="reference_id">Reference ID (Optional)</Label>
                <Input
                  id="reference_id"
                  placeholder="Complaint ID, Booking ID, etc."
                  value={refundForm.reference_id}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, reference_id: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this refund is being processed..."
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleProcessRefund} disabled={processingRefund}>
                  {processingRefund ? 'Processing...' : 'Process Refund'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search refund transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits (Customer)</SelectItem>
                <SelectItem value="withdrawal">Withdrawals (Designer)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Refund Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Refund Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Designer</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionTypeIcon(transaction.transaction_type)}
                          {transaction.transaction_type === 'deposit' ? 'Customer Refund' : 'Designer Deduction'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {transaction.user_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.designer_name || '-'}
                      </TableCell>
                      <TableCell>
                        {transaction.customer_name || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          transaction.transaction_type === 'withdrawal' 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {formatAmount(transaction.amount, transaction.transaction_type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate">{transaction.reason}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.admin_name || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
