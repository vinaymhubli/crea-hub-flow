import { useState } from 'react';
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
  CheckCircle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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

const sidebarItems = [
  { title: "Dashboard", url: "/customer-dashboard", icon: LayoutDashboard },
  { title: "Find Designer", url: "/designers", icon: Search },
  { title: "My Bookings", url: "/customer-dashboard/bookings", icon: Calendar },
  { title: "Messages", url: "/customer-dashboard/messages", icon: MessageCircle },
  { title: "Recent Designers", url: "/customer-dashboard/recent-designers", icon: Users },
  { title: "Wallet", url: "/customer-dashboard/wallet", icon: Wallet },
  { title: "Notifications", url: "/customer-dashboard/notifications", icon: Bell },
  { title: "Profile", url: "/customer-dashboard/profile", icon: User },
  { title: "Settings", url: "/customer-dashboard/settings", icon: Settings },
];

const transactions = [
  {
    id: 1,
    type: "deposit",
    title: "Added funds",
    date: "Aug 4, 2025",
    amount: "+$50.00",
    status: "completed",
    icon: ArrowDownLeft,
    color: "bg-green-100",
    iconColor: "text-green-600"
  },
  {
    id: 2,
    type: "payment",
    title: "Design session",
    date: "Jul 29, 2025",
    designer: "Emma Thompson",
    amount: "-$25.00",
    status: "completed",
    icon: ArrowUpRight,
    color: "bg-blue-100",
    iconColor: "text-blue-600"
  },
  {
    id: 3,
    type: "payment",
    title: "Logo design session",
    date: "Jul 22, 2025",
    designer: "Marcus Chen",
    amount: "-$15.00",
    status: "completed",
    icon: ArrowUpRight,
    color: "bg-blue-100",
    iconColor: "text-blue-600"
  },
  {
    id: 4,
    type: "refund",
    title: "Cancelled session refund",
    date: "Jul 6, 2025",
    amount: "+$10.00",
    status: "completed",
    icon: RefreshCw,
    color: "bg-yellow-100",
    iconColor: "text-yellow-600"
  },
  {
    id: 5,
    type: "deposit",
    title: "Added funds",
    date: "Jun 6, 2025",
    amount: "+$100.00",
    status: "completed",
    icon: ArrowDownLeft,
    color: "bg-green-100",
    iconColor: "text-green-600"
  }
];

function CustomerSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">VB</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Viaan Bindra</p>
              <p className="text-sm text-gray-500">Customer</p>
            </div>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.url) 
                          ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                      {isActive(item.url) && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function AddFundsModal() {
  const [amount, setAmount] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Funds
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-900">Add funds to your wallet</DialogTitle>
          <DialogDescription>
            Enter the amount you would like to add to your wallet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="amount"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card-5678">•••• 5678</SelectItem>
                <SelectItem value="new">Add new payment method</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setOpen(false)}>
            Add Funds
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerWallet() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === "all") return true;
    if (activeTab === "deposits") return transaction.type === "deposit";
    if (activeTab === "payments") return transaction.type === "payment";
    if (activeTab === "refunds") return transaction.type === "refund";
    return true;
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
                  <p className="text-gray-600">Manage your wallet balance and transactions</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                      <span className="text-blue-600 font-semibold text-sm">VB</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">VB</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Viaan Bindra</p>
                          <p className="text-sm text-gray-500">customer@example.com</p>
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
                        <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Balance and Payment Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">Your Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-4xl font-bold text-gray-900">$120.00</p>
                      <p className="text-gray-600">Available for design sessions</p>
                    </div>
                    <div className="flex space-x-3">
                      <AddFundsModal />
                      <Button variant="outline">
                        Withdraw
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">•••• 5678</p>
                          <p className="text-sm text-gray-500">Expires 12/25</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        Default
                      </Badge>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-xl text-gray-900">Transaction History</CardTitle>
                  <CardDescription>View your recent transactions</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="deposits">Deposits</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="refunds">Refunds</TabsTrigger>
                  </TabsList>
                  <TabsContent value={activeTab} className="mt-6">
                    <div className="space-y-3">
                      {filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 ${transaction.color} rounded-full flex items-center justify-center`}>
                              <transaction.icon className={`w-5 h-5 ${transaction.iconColor}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{transaction.title}</p>
                              <div className="flex items-center text-sm text-gray-500 space-x-2">
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
                              <div className="flex items-center text-xs text-gray-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                <span>{transaction.status}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-center mt-8">
                      <Button variant="outline">
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
    </SidebarProvider>
  );
}