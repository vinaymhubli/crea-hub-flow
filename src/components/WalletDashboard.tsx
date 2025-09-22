import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { UniversalPaymentModal } from './UniversalPaymentModal';
import { WithdrawalModal } from './WithdrawalModal';
import { BankAccountManager } from './BankAccountManager';
import { format } from 'date-fns';

export function WalletDashboard() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showBankManager, setShowBankManager] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  
  const { 
    balance, 
    transactions, 
    bankAccounts, 
    loading, 
    refresh,
    getTransactionHistory,
    getPrimaryBankAccount
  } = useWallet();

  const primaryBankAccount = getPrimaryBankAccount();
  const deposits = getTransactionHistory('deposit');
  const withdrawals = getTransactionHistory('withdrawal');
  const payments = getTransactionHistory('payment');

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'refund':
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      default:
        return <Wallet className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'withdrawal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'payment':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'refund':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
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

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'deposit' || type === 'refund' ? '+' : '-';
    return `${sign}₹${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-green-600" />
                Wallet Balance
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="h-6 w-6 p-0"
              >
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-3xl font-bold text-green-800">
                {showBalance ? `₹${balance.toFixed(2)}` : '••••••'}
              </p>
              <p className="text-sm text-green-700">Available for design sessions</p>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Credits
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => setShowWithdrawalModal(true)}
                >
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  Withdraw
                </Button>
              </div>
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
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">Added:</span>
                <span className="font-semibold text-purple-800">
                  ₹{deposits.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">Withdrawn:</span>
                <span className="font-semibold text-purple-800">
                  ₹{withdrawals.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">Spent:</span>
                <span className="font-semibold text-purple-800">
                  ₹{payments.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Transaction History
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            View all your wallet transactions and payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions yet
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${getTransactionColor(transaction.transaction_type)}`}
                  >
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm opacity-75">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">
                        {formatAmount(transaction.amount, transaction.transaction_type)}
                      </span>
                      {getStatusIcon(transaction.status)}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="deposits" className="space-y-3">
              {deposits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No deposits yet
                </div>
              ) : (
                deposits.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${getTransactionColor(transaction.transaction_type)}`}
                  >
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm opacity-75">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">
                        {formatAmount(transaction.amount, transaction.transaction_type)}
                      </span>
                      {getStatusIcon(transaction.status)}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="withdrawals" className="space-y-3">
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No withdrawals yet
                </div>
              ) : (
                withdrawals.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${getTransactionColor(transaction.transaction_type)}`}
                  >
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm opacity-75">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">
                        {formatAmount(transaction.amount, transaction.transaction_type)}
                      </span>
                      {getStatusIcon(transaction.status)}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="payments" className="space-y-3">
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments yet
                </div>
              ) : (
                payments.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${getTransactionColor(transaction.transaction_type)}`}
                  >
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm opacity-75">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">
                        {formatAmount(transaction.amount, transaction.transaction_type)}
                      </span>
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
      <UniversalPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onSuccess={() => {
          refresh();
          setShowPaymentModal(false);
        }}
      />
      
      <WithdrawalModal
        open={showWithdrawalModal}
        onOpenChange={setShowWithdrawalModal}
        onSuccess={() => {
          refresh();
          setShowWithdrawalModal(false);
        }}
      />
      
      <BankAccountManager
        open={showBankManager}
        onOpenChange={setShowBankManager}
        onAccountAdded={() => {
          refresh();
          setShowBankManager(false);
        }}
      />
    </div>
  );
}
