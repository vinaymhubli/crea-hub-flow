import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  MessageCircle, 
  CreditCard,
  Bell,
  Settings,
  Search,
  Users,
  Wallet,
  ChevronRight,
  Star,
  LogOut,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  X,
  Copy,
  CheckCircle,
  ArrowUpFromLine
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CustomerSidebar } from '@/components/CustomerSidebar';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UniversalPaymentModal } from '@/components/UniversalPaymentModal';
import { WithdrawalModal } from '@/components/WithdrawalModal';
import { BankAccountManager } from '@/components/BankAccountManager';

// Real data will be fetched from database

// CustomerSidebar is now imported from shared component

function AddFundsButton() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <>
      <Button 
        className="bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white hover:shadow-lg transition-all duration-300"
        onClick={() => setShowPaymentModal(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Credits
      </Button>
      <UniversalPaymentModal 
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onSuccess={() => {
          // Refresh wallet data after successful payment
          window.location.reload();
        }}
      />
    </>
  );
}

export default function CustomerWallet() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showBankManager, setShowBankManager] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  // Handle payment success callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true' || urlParams.get('mock_payment_success') === 'true') {
      // Refresh wallet data after successful payment
      fetchWalletData();
      // Show success message
      const amount = urlParams.get('amount') || '';
      alert(`Payment successful! ₹${amount} has been added to your wallet.`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      // Fetch wallet balance
      const { data: balanceData, error: balanceError } = await supabase.rpc('get_wallet_balance', { user_uuid: user.id });
      if (balanceError) throw balanceError;
      setWalletBalance(balanceData || 0);

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
    if (activeTab === "deposits") return transaction.type === "deposit";
    if (activeTab === "payments") return transaction.type === "payment";
    if (activeTab === "refunds") return transaction.type === "refund";
    return true;
  });

  const userDisplayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email || 'Customer';

  const userInitials = profile?.first_name && profile?.last_name 
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user?.email ? user.email.substring(0, 2).toUpperCase()
    : 'CU';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-teal-50/30 to-blue-50/20">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-br from-green-400 via-teal-500 to-blue-500 text-white px-6 py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white" />
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
                  <p className="text-green-100">Manage your wallet balance and transactions</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-green-100" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                          <span className="text-white font-semibold text-sm">{userInitials}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{userInitials}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{userDisplayName}</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link 
                          to="/customer-dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/customer-dashboard/wallet" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <Wallet className="w-4 h-4 mr-3" />
                          Wallet
                        </Link>
                        <Link 
                          to="/customer-dashboard/profile" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Floating decorative elements */}
            <div className="absolute top-4 right-20 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-6 right-32 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-12 right-40 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-500"></div>
          </header>

          <div className="p-6 space-y-8">
            {/* Balance and Payment Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Balance */}
              <Card className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border border-teal-200/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <span>Your Balance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-4xl font-bold text-foreground mb-2">₹{walletBalance.toFixed(2)}</p>
                      <p className="text-muted-foreground">Available for design sessions</p>
                    </div>
                    <div className="flex space-x-3">
                      <AddFundsButton />
                      <Button 
                        variant="outline" 
                        className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300/50"
                        onClick={() => setShowWithdrawalModal(true)}
                      >
                        <ArrowUpFromLine className="w-4 h-4 mr-2" />
                        Withdraw
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border border-teal-200/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <span>Payment Methods</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-teal-200/30 rounded-lg bg-gradient-to-r from-teal-50/50 to-blue-50/50">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-teal-600" />
                        <div>
                          <p className="font-medium text-foreground">•••• 5678</p>
                          <p className="text-sm text-muted-foreground">Expires 12/25</p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-green-100 to-teal-100 text-teal-700 border-teal-200">
                        Default
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300/50"
                      onClick={() => setShowBankManager(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Manage Bank Accounts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border border-teal-200/30 shadow-xl">
              <CardHeader>
                <div>
                  <CardTitle className="text-2xl text-foreground">Transaction History</CardTitle>
                  <CardDescription>View your recent transactions and payments</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-teal-50 to-blue-50">
                    <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white">All</TabsTrigger>
                    <TabsTrigger value="deposits" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white">Deposits</TabsTrigger>
                    <TabsTrigger value="payments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white">Payments</TabsTrigger>
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
                        <div key={transaction.id} className="flex items-center justify-between p-4 border border-teal-200/30 rounded-lg hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-blue-50/50 transition-all duration-300">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 ${transaction.color} rounded-full flex items-center justify-center shadow-lg`}>
                              <transaction.icon className={`w-5 h-5 ${transaction.iconColor}`} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{transaction.title}</p>
                              <div className="flex items-center text-sm text-muted-foreground space-x-2">
                                <Calendar className="w-3 h-3" />
                                <span>{transaction.date}</span>
                                {transaction.designer && (
                                  <>
                                    <span>•</span>
                                    <User className="w-3 h-3" />
                                    <span>{transaction.designer}</span>
                                  </>
                                )}
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
                                <CheckCircle className="w-3 h-3 mr-1" />
                                <span>{transaction.status}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                          </div>
                        )) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No transactions found.</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-center mt-8">
                      <Button variant="outline" className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300/50">
                        View All Transactions
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {/* Withdrawal Modal */}
      <WithdrawalModal 
        open={showWithdrawalModal}
        onOpenChange={setShowWithdrawalModal}
        onSuccess={() => {
          // Refresh wallet data after successful withdrawal
          fetchWalletData();
        }}
      />
      
      {/* Bank Account Manager Modal */}
      <BankAccountManager 
        open={showBankManager}
        onOpenChange={setShowBankManager}
        onAccountAdded={() => {
          // Refresh data after account added
          fetchWalletData();
        }}
      />
    </SidebarProvider>
  );
}