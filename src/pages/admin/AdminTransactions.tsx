import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Receipt, 
  Search, 
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Wallet,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  status: string;
  description: string;
  booking_id: string | null;
  metadata: any;
  created_at: string;
  user_name: string;
  user_role: string;
}

interface PlatformEarnings {
  total_platform_fees: number;
  total_gst_collected: number;
  total_penalty_fees: number;
  total_earnings: number;
  transaction_count: number;
}

export default function AdminTransactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [platformEarnings, setPlatformEarnings] = useState<PlatformEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchPlatformEarnings();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select(`
          *,
          user:profiles!wallet_transactions_user_id_fkey(first_name, last_name, full_name, role)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      console.log('Raw transaction data:', data);
      console.log('Sample transaction user data:', data?.[0]?.user);

      const formattedTransactions = data?.map(transaction => ({
        ...transaction,
        user_name: transaction.user?.full_name || 
                  `${transaction.user?.first_name || ''} ${transaction.user?.last_name || ''}`.trim() || 
                  'Unknown User',
        user_role: transaction.user?.role || 'unknown'
      })) || [];

      console.log('Formatted transactions:', formattedTransactions);

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformEarnings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_platform_earnings_summary');
      if (error) throw error;
      setPlatformEarnings(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching platform earnings:', error);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'deposit': 'Deposit',
      'withdrawal': 'Withdrawal',
      'payment': 'Payment',
      'refund': 'Refund',
      'platform_fee': 'Platform Fee',
      'gst_collection': 'GST Collection',
      'penalty_fee': 'Penalty Fee'
    };
    return labels[type] || type;
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'refund':
        return <Receipt className="w-4 h-4 text-orange-600" />;
      case 'platform_fee':
        return <DollarSign className="w-4 h-4 text-purple-600" />;
      case 'gst_collection':
        return <Receipt className="w-4 h-4 text-indigo-600" />;
      case 'penalty_fee':
        return <Activity className="w-4 h-4 text-red-600" />;
      default:
        return <Wallet className="w-4 h-4 text-gray-600" />;
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

  const getRoleBadge = (role: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'customer': 'default',
      'designer': 'secondary',
      'admin': 'destructive'
    };
    return variants[role] || 'outline';
  };

  const formatAmount = (amount: number, type: string) => {
    const isNegative = type === 'withdrawal' || type === 'payment';
    const sign = isNegative ? '-' : '+';
    return `${sign}₹${Math.abs(amount).toFixed(2)}`;
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'User', 'Role', 'Type', 'Amount', 'Status', 'Description'].join(','),
      ...filteredTransactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.user_name,
        t.user_role,
        getTransactionTypeLabel(t.transaction_type),
        formatAmount(t.amount, t.transaction_type),
        t.status,
        `"${t.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    
    let matchesDate = true;
    if (dateRange !== 'all') {
      const now = new Date();
      const transactionDate = new Date(transaction.created_at);
      
      switch (dateRange) {
        case 'today':
          matchesDate = transactionDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction Management</h1>
          <p className="text-gray-600">View and manage all platform transactions and earnings</p>
        </div>
        <Button onClick={exportTransactions} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Platform Earnings Summary */}
      {platformEarnings && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Platform Fees</p>
                  <p className="text-2xl font-bold">₹{platformEarnings.total_platform_fees.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">GST Collected</p>
                  <p className="text-2xl font-bold">₹{platformEarnings.total_gst_collected.toFixed(2)}</p>
                </div>
                <Receipt className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Penalty Fees</p>
                  <p className="text-2xl font-bold">₹{platformEarnings.total_penalty_fees.toFixed(2)}</p>
                </div>
                <Activity className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{platformEarnings.total_earnings.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
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
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
                <SelectItem value="platform_fee">Platform Fees</SelectItem>
                <SelectItem value="gst_collection">GST Collection</SelectItem>
                <SelectItem value="penalty_fee">Penalty Fees</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Transactions ({filteredTransactions.length})
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
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
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
                          <User className="w-4 h-4 text-gray-400" />
                          {transaction.user_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadge(transaction.user_role)}>
                          {transaction.user_role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionTypeIcon(transaction.transaction_type)}
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          transaction.transaction_type === 'withdrawal' || transaction.transaction_type === 'payment'
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
                          <p className="truncate">{transaction.description}</p>
                          {transaction.booking_id && (
                            <p className="text-xs text-gray-500">Booking: {transaction.booking_id}</p>
                          )}
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
    </div>
  );
}
