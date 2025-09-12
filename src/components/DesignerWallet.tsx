import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  title: string;
  date: string;
  amount: string;
  status: string;
  icon: any;
  color: string;
  iconColor: string;
}

export function DesignerWallet() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      // Fetch wallet balance
      const { data: balanceData, error: balanceError } = await supabase.rpc('get_wallet_balance', { user_uuid: user.id });
      if (balanceError) throw balanceError;
      setWalletBalance(balanceData || 0);

      // Fetch total earnings (all deposits)
      const { data: earningsData, error: earningsError } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('transaction_type', 'deposit')
        .eq('status', 'completed');
      
      if (earningsError) throw earningsError;
      const total = earningsData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      setTotalEarnings(total);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (transactionsError) throw transactionsError;
      
      const formattedTransactions = transactionsData?.map(transaction => ({
        id: transaction.id,
        type: transaction.transaction_type,
        title: transaction.description,
        date: new Date(transaction.created_at).toLocaleDateString(),
        amount: transaction.transaction_type === 'deposit' || transaction.transaction_type === 'refund' 
          ? `+₹${transaction.amount}` 
          : `-₹${transaction.amount}`,
        status: transaction.status,
        icon: transaction.transaction_type === 'deposit' ? ArrowDownLeft : 
              transaction.transaction_type === 'refund' ? RefreshCw : ArrowUpRight,
        color: transaction.transaction_type === 'deposit' ? "bg-gradient-to-r from-green-100 to-teal-100" :
               transaction.transaction_type === 'refund' ? "bg-yellow-100" : "bg-gradient-to-r from-teal-100 to-blue-100",
        iconColor: transaction.transaction_type === 'deposit' ? "text-green-600" :
                   transaction.transaction_type === 'refund' ? "text-yellow-600" : "text-blue-600"
      })) || [];
      
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === "all") return true;
    if (activeTab === "earnings") return transaction.type === "deposit";
    if (activeTab === "withdrawals") return transaction.type === "withdrawal";
    if (activeTab === "refunds") return transaction.type === "refund";
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return <Clock className="w-3 h-3 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-card via-green-50/20 to-teal-50/10 border border-green-200/30 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span>Available Balance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-4xl font-bold text-foreground mb-2">₹{walletBalance.toFixed(2)}</p>
                <p className="text-muted-foreground">Ready for withdrawal</p>
              </div>
              <Button variant="outline" className="hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-100 border-green-300/50">
                Withdraw Funds
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-blue-50/20 to-purple-50/10 border border-blue-200/30 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span>Total Earnings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-4xl font-bold text-foreground mb-2">₹{totalEarnings.toFixed(2)}</p>
                <p className="text-muted-foreground">All-time earnings</p>
              </div>
              <Badge className="bg-gradient-to-r from-green-100 to-teal-100 text-teal-700 border-teal-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                Growing
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="bg-gradient-to-br from-card via-green-50/20 to-teal-50/10 border border-green-200/30 shadow-xl">
        <CardHeader>
          <div>
            <CardTitle className="text-2xl text-foreground">Transaction History</CardTitle>
            <CardDescription>View your earnings and transaction history</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-green-50 to-teal-50">
              <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white">All</TabsTrigger>
              <TabsTrigger value="earnings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white">Earnings</TabsTrigger>
              <TabsTrigger value="withdrawals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white">Withdrawals</TabsTrigger>
              <TabsTrigger value="refunds" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white">Refunds</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.length > 0 ? filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-green-200/30 rounded-lg hover:bg-gradient-to-r hover:from-green-50/50 hover:to-teal-50/50 transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 ${transaction.color} rounded-full flex items-center justify-center shadow-lg`}>
                          <transaction.icon className={`w-5 h-5 ${transaction.iconColor}`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{transaction.title}</p>
                          <div className="flex items-center text-sm text-muted-foreground space-x-2">
                            <Calendar className="w-3 h-3" />
                            <span>{transaction.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.amount.startsWith('+') 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.amount}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            {getStatusIcon(transaction.status)}
                            <span className="ml-1 capitalize">{transaction.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No transactions found.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
