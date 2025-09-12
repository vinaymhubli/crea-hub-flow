import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  CheckCircle,
  XCircle,
  Building2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { WithdrawalModal } from './WithdrawalModal';
import { BankAccountManager } from './BankAccountManager';
import { format } from 'date-fns';

interface EarningsTransaction {
  id: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  transaction_type: string;
  metadata?: any;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  is_verified: boolean;
  is_primary: boolean;
}

export function DesignerEarningsDashboard() {
  const [earnings, setEarnings] = useState(0);
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showBankManager, setShowBankManager] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchEarningsData();
      fetchBankAccounts();
    }
  }, [user]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      
      // Get total earnings
      const { data: earningsData, error: earningsError } = await (supabase as any).rpc('get_total_earnings', { user_uuid: user?.id });
      if (earningsError) throw earningsError;
      setEarnings(Number(earningsData) || 0);

      // Get earnings transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('transaction_type', 'deposit')
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const getTransactionIcon = (transaction: EarningsTransaction) => {
    if (transaction.metadata?.earnings_type === 'session_completion') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <Wallet className="w-4 h-4 text-blue-600" />;
  };

  const getTransactionColor = (transaction: EarningsTransaction) => {
    if (transaction.metadata?.earnings_type === 'session_completion') {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const primaryBankAccount = bankAccounts.find(acc => acc.is_primary);

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Earnings Card */}
        <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-3xl font-bold text-green-800">₹{earnings.toFixed(2)}</p>
              <p className="text-sm text-green-700">Available for withdrawal</p>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowWithdrawalModal(true)}
                disabled={earnings <= 0}
              >
                <ArrowUpRight className="w-4 h-4 mr-1" />
                Withdraw Earnings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-600" />
              Bank Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {primaryBankAccount ? (
                <>
                  <div>
                    <p className="font-semibold text-blue-800">{primaryBankAccount.bank_name}</p>
                    <p className="text-sm text-blue-700">
                      ****{primaryBankAccount.account_number.slice(-4)}
                    </p>
                    <p className="text-xs text-blue-600">{primaryBankAccount.ifsc_code}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {primaryBankAccount.is_verified ? 'Verified' : 'Pending Verification'}
                  </Badge>
                </>
              ) : (
                <>
                  <p className="text-blue-700">No bank account added</p>
                  <p className="text-sm text-blue-600">Add a bank account for withdrawals</p>
                </>
              )}
              <Button 
                size="sm" 
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => setShowBankManager(true)}
              >
                <Building2 className="w-4 h-4 mr-1" />
                Manage Accounts
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Wallet className="w-5 h-5 mr-2 text-purple-600" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">Sessions:</span>
                <span className="font-semibold text-purple-800">
                  {transactions.filter(t => t.metadata?.earnings_type === 'session_completion').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">Earnings:</span>
                <span className="font-semibold text-purple-800">
                  ₹{transactions
                    .filter(t => t.metadata?.earnings_type === 'session_completion')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">Withdrawals:</span>
                <span className="font-semibold text-purple-800">
                  ₹{transactions
                    .filter(t => t.transaction_type === 'withdrawal')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Earnings History
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchEarningsData}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            View all your earnings from completed design sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Earnings</TabsTrigger>
              <TabsTrigger value="sessions">Session Earnings</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No earnings yet
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${getTransactionColor(transaction)}`}
                  >
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm opacity-75">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">
                        {transaction.transaction_type === 'withdrawal' ? '-' : '+'}₹{transaction.amount.toFixed(2)}
                      </span>
                      {getStatusIcon(transaction.status)}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="sessions" className="space-y-3">
              {transactions.filter(t => t.metadata?.earnings_type === 'session_completion').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No session earnings yet
                </div>
              ) : (
                transactions
                  .filter(t => t.metadata?.earnings_type === 'session_completion')
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${getTransactionColor(transaction)}`}
                    >
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm opacity-75">
                            {format(new Date(transaction.created_at), 'MMM dd, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">+₹{transaction.amount.toFixed(2)}</span>
                        {getStatusIcon(transaction.status)}
                      </div>
                    </div>
                  ))
              )}
            </TabsContent>
            
            <TabsContent value="withdrawals" className="space-y-3">
              {transactions.filter(t => t.transaction_type === 'withdrawal').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No withdrawals yet
                </div>
              ) : (
                transactions
                  .filter(t => t.transaction_type === 'withdrawal')
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between p-4 rounded-lg border text-blue-600 bg-blue-50 border-blue-200`}
                    >
                      <div className="flex items-center space-x-3">
                        <ArrowUpRight className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm opacity-75">
                            {format(new Date(transaction.created_at), 'MMM dd, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">-₹{transaction.amount.toFixed(2)}</span>
                        {getStatusIcon(transaction.status)}
                      </div>
                    </div>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}
      <WithdrawalModal
        open={showWithdrawalModal}
        onOpenChange={setShowWithdrawalModal}
        onSuccess={() => {
          fetchEarningsData();
          setShowWithdrawalModal(false);
        }}
        userType="designer"
      />
      
      <BankAccountManager
        open={showBankManager}
        onOpenChange={setShowBankManager}
        onAccountAdded={() => {
          fetchBankAccounts();
          setShowBankManager(false);
        }}
      />
    </div>
  );
}
