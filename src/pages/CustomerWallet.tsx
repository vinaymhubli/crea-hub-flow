import { useState, useEffect, useCallback } from 'react';
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
import { DashboardHeader } from '@/components/DashboardHeader';
import NotificationBell from '@/components/NotificationBell';
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
import { SimpleRazorpayRecharge } from '@/components/SimpleRazorpayRecharge';
import { SimpleRazorpayWithdrawal } from '@/components/SimpleRazorpayWithdrawal';

// Real data will be fetched from database

// CustomerSidebar is now imported from shared component

function AddFundsButton({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <SimpleRazorpayRecharge
      onSuccess={(amount) => {
        console.log(`Successfully recharged ₹${amount}`);
        onSuccess?.();
      }}
      onError={(error) => {
        console.error('Recharge failed:', error);
      }}
    />
  );
}

export default function CustomerWallet() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showBankManager, setShowBankManager] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch wallet balance
      const { data: balanceData, error: balanceError } = await supabase.rpc('get_wallet_balance', { user_uuid: user.id });
      if (balanceError) throw balanceError;
      setWalletBalance(balanceData || 0);

      // Build query based on active tab
      let countQuery = supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      let dataQuery = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters based on active tab
      if (activeTab === 'deposits') {
        countQuery = countQuery.eq('transaction_type', 'deposit');
        dataQuery = dataQuery.eq('transaction_type', 'deposit');
      } else if (activeTab === 'payments') {
        countQuery = countQuery.eq('transaction_type', 'payment');
        dataQuery = dataQuery.eq('transaction_type', 'payment');
      } else if (activeTab === 'refunds') {
        countQuery = countQuery.eq('transaction_type', 'refund');
        dataQuery = dataQuery.eq('transaction_type', 'refund');
      }

      // Get total count
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotalCount(count || 0);

      // Calculate offset for pagination
      const offset = (currentPage - 1) * itemsPerPage;

      // Fetch paginated transactions
      const { data: transactionsData, error: transactionsError } = await dataQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);
      
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
  }, [user, activeTab, currentPage, itemsPerPage]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user, fetchWalletData]);

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
  }, [fetchWalletData]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

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
          <DashboardHeader
            title="Wallet"
            subtitle="Manage your wallet balance and transactions"
            icon={<Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            userInitials={userInitials}
            isOnline={true}
            actionButton={
              <div className="flex items-center space-x-2 sm:space-x-3">
                <NotificationBell />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <span className="text-white font-semibold text-xs sm:text-sm">{userInitials}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-64 w-fit p-0" align="end">
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
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/customer-dashboard/wallet" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Wallet className="w-4 h-4 mr-3" />
                          Wallet
                        </Link>
                        <Link 
                          to="/customer-dashboard/profile" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button 
                          onClick={async () => {
                            try {
                              await signOut();
                            } catch (error) {
                              console.error('Error signing out:', error);
                            }
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            }
          />

          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Balance and Payment Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {/* Your Balance */}
              <Card className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border border-teal-200/30 shadow-xl">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl text-foreground flex items-center space-x-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <span>Your Balance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-3xl sm:text-4xl font-bold text-foreground mb-2">₹{walletBalance.toFixed(2)}</p>
                      <p className="text-muted-foreground text-sm sm:text-base">Available for design sessions</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:space-x-3">
                      <AddFundsButton onSuccess={fetchWalletData} />
                      <SimpleRazorpayWithdrawal 
                        currentBalance={walletBalance}
                        onSuccess={(amount) => {
                          console.log(`Successfully withdrew ₹${amount}`);
                          fetchWalletData();
                        }}
                        onError={(error) => {
                          console.error('Withdrawal failed:', error);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              {/* <Card className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border border-teal-200/30 shadow-xl">
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
              </Card> */}
            </div>

            {/* Transaction History */}
            <Card className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border border-teal-200/30 shadow-xl">
              <CardHeader className="p-4 sm:p-6">
                <div>
                  <CardTitle className="text-xl sm:text-2xl text-foreground">Transaction History</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">View your recent transactions and payments</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-teal-50 to-blue-50">
                    <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white text-xs sm:text-sm">All</TabsTrigger>
                    <TabsTrigger value="deposits" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white text-xs sm:text-sm">Deposits</TabsTrigger>
                    <TabsTrigger value="payments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white text-xs sm:text-sm">Payments</TabsTrigger>
                    <TabsTrigger value="refunds" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white text-xs sm:text-sm">Refunds</TabsTrigger>
                  </TabsList>
                  <TabsContent value={activeTab} className="mt-4 sm:mt-6">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-4">
                        {transactions.length > 0 ? transactions.map((transaction) => (
                        <Card key={transaction.id} className="border-teal-200/30 hover:shadow-md transition-shadow overflow-hidden">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start gap-3">
                              <div className={`w-12 h-12 sm:w-14 sm:h-14 ${transaction.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                                <transaction.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${transaction.iconColor}`} />
                              </div>
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground text-sm sm:text-base mb-1 sm:mb-2">{transaction.title}</p>
                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                      <div className="flex items-center space-x-1">
                                        <Calendar className="w-3 h-3 flex-shrink-0" />
                                        <span>{transaction.date}</span>
                                      </div>
                                      <span>•</span>
                                      <div className="flex items-center space-x-1">
                                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                        <span>{transaction.status}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className={`font-bold text-base sm:text-lg ${
                                      transaction.amount.startsWith('+') 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                    }`}>
                                      {transaction.amount}
                                    </p>
                                  </div>
                                </div>
                                {transaction.designer && (
                                  <div className="flex items-center text-xs text-muted-foreground space-x-1.5 pt-1 border-t border-gray-100">
                                    <User className="w-3 h-3 flex-shrink-0 mt-1" />
                                    <span className="truncate">Designer: {transaction.designer}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        )) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground text-sm sm:text-base">No transactions found.</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-teal-200/30">
                        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300/50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                          >
                            <span className="hidden sm:inline">Previous</span>
                            <span className="sm:hidden">Prev</span>
                          </Button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                              let pageNumber;
                              if (totalPages <= 5) {
                                pageNumber = i + 1;
                              } else if (currentPage <= 3) {
                                pageNumber = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNumber = totalPages - 4 + i;
                              } else {
                                pageNumber = currentPage - 2 + i;
                              }
                              
                              return (
                                <Button
                                  key={pageNumber}
                                  variant={currentPage === pageNumber ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageClick(pageNumber)}
                                  className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm ${
                                    currentPage === pageNumber
                                      ? "bg-gradient-to-r from-green-400 to-teal-500 text-white hover:from-green-500 hover:to-teal-600"
                                      : "hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300/50"
                                  }`}
                                >
                                  {pageNumber}
                                </Button>
                              );
                            })}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300/50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
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