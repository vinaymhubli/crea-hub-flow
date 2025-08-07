import { useState } from 'react';
import { 
  LayoutDashboard, 
  User, 
  FolderOpen, 
  Calendar, 
  Clock, 
  DollarSign, 
  History, 
  Settings,
  Download,
  FileText,
  TrendingUp
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const sidebarItems = [
  { title: "Dashboard", url: "/designer-dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/designer-dashboard/profile", icon: User },
  { title: "Portfolio", url: "/designer-dashboard/portfolio", icon: FolderOpen },
  { title: "Bookings", url: "/designer-dashboard/bookings", icon: Calendar },
  { title: "Availability", url: "/designer-dashboard/availability", icon: Clock },
  { title: "Earnings", url: "/designer-dashboard/earnings", icon: DollarSign },
  { title: "Session History", url: "/designer-dashboard/history", icon: History },
  { title: "Settings", url: "/designer-dashboard/settings", icon: Settings },
];

function DesignerSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">VB</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Vb Bn</p>
              <p className="text-sm text-gray-500">Designer</p>
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
                          ? 'bg-gradient-to-r from-green-50 to-blue-50 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 border-r-2 border-green-500' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive(item.url) ? 'text-green-600' : ''}`} />
                        <span className="font-medium">{item.title}</span>
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

export default function DesignerEarnings() {
  const [activeTab, setActiveTab] = useState("this-month");
  const [selectedMonth, setSelectedMonth] = useState("august");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    accountHolderName: "",
    accountNumber: "",
    routingNumber: "",
    bankName: "",
    accountType: "checking"
  });

  const months = [
    { value: "january", label: "January" },
    { value: "february", label: "February" },
    { value: "march", label: "March" },
    { value: "april", label: "April" },
    { value: "may", label: "May" },
    { value: "june", label: "June" },
    { value: "july", label: "July" },
    { value: "august", label: "August" },
    { value: "september", label: "September" },
    { value: "october", label: "October" },
    { value: "november", label: "November" },
    { value: "december", label: "December" },
  ];

  const years = ["2025", "2024", "2023", "2022"];

  const handleExport = () => {
    // Create CSV data
    const csvData = [
      ['Date', 'Type', 'Amount', 'Status', 'Client'],
      ['2025-08-05', 'Design Session', '$0.00', 'Completed', 'No data'],
      // Add more sample data or real data here
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `earnings-${selectedMonth}-${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleBankInfoChange = (field: string, value: string) => {
    setBankInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveBankInfo = () => {
    // Save bank information (you can add validation here)
    console.log('Saving bank info:', bankInfo);
    setIsUpdateDialogOpen(false);
    // Here you would typically save to your backend
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 to-blue-500 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/20" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Earnings</h1>
                  <p className="text-white/80">Track your income and financial performance</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Time Period Controls */}
            <div className="flex items-center justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-auto grid-cols-4">
                  <TabsTrigger value="this-week">This Week</TabsTrigger>
                  <TabsTrigger value="this-month">This Month</TabsTrigger>
                  <TabsTrigger value="this-year">This Year</TabsTrigger>
                  <TabsTrigger value="all-time">All Time</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center space-x-3">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={handleExport} className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">$0.00</p>
                      <p className="text-sm text-gray-500 mt-2">0.0% vs. previous period</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Completed Payments</p>
                      <p className="text-2xl font-bold text-gray-900">$0.00</p>
                      <p className="text-sm text-gray-500 mt-2">No pending payments</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-sm text-gray-500 mt-2">0.0% vs. previous period</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Avg. Hourly Rate</p>
                      <p className="text-2xl font-bold text-gray-900">$0.00</p>
                      <p className="text-sm text-gray-500 mt-2">0.0 hours worked</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Charts and Transactions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Earnings Overview Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings Overview</CardTitle>
                    <CardDescription>Your earnings this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No earnings data available</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transactions */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Transactions</CardTitle>
                        <CardDescription>History of your recent payments</CardDescription>
                      </div>
                      <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Transactions</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">No transactions found</h3>
                      <p className="text-sm text-gray-500">You have no transactions in this time period</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Summary and Statistics */}
              <div className="space-y-6">
                {/* Payment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                    <CardDescription>Breakdown of your earnings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Completed</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending Payments</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cancelled Sessions</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Platform Fee</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Net Earnings</span>
                        <span className="font-bold text-lg">$0.00</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Session Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Session Statistics</CardTitle>
                    <CardDescription>Your design session metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Sessions</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Hours Worked</span>
                      <span className="font-semibold">0.0 hrs</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg. Session Length</span>
                      <span className="font-semibold">0 min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className="font-semibold">0%</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Hourly Rate</p>
                          <p className="font-bold text-lg">$0.00</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Per Session</p>
                          <p className="font-bold text-lg">$0.00</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payout Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payout Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Next Payout</p>
                      <p className="font-bold text-xl">$0.00</p>
                      <p className="text-sm text-gray-500">Estimated date: Aug 12, 2025</p>
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-3">Your account details</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Bank Account</p>
                          <p className="text-sm text-gray-500">••••••••1234</p>
                        </div>
                        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Update
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Update Bank Account</DialogTitle>
                              <DialogDescription>
                                Enter your bank account details for receiving payments.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="accountHolderName" className="text-right">
                                  Account Holder
                                </Label>
                                <Input
                                  id="accountHolderName"
                                  value={bankInfo.accountHolderName}
                                  onChange={(e) => handleBankInfoChange('accountHolderName', e.target.value)}
                                  className="col-span-3"
                                  placeholder="Full name"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="accountNumber" className="text-right">
                                  Account Number
                                </Label>
                                <Input
                                  id="accountNumber"
                                  value={bankInfo.accountNumber}
                                  onChange={(e) => handleBankInfoChange('accountNumber', e.target.value)}
                                  className="col-span-3"
                                  placeholder="1234567890"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="routingNumber" className="text-right">
                                  Routing Number
                                </Label>
                                <Input
                                  id="routingNumber"
                                  value={bankInfo.routingNumber}
                                  onChange={(e) => handleBankInfoChange('routingNumber', e.target.value)}
                                  className="col-span-3"
                                  placeholder="123456789"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="bankName" className="text-right">
                                  Bank Name
                                </Label>
                                <Input
                                  id="bankName"
                                  value={bankInfo.bankName}
                                  onChange={(e) => handleBankInfoChange('bankName', e.target.value)}
                                  className="col-span-3"
                                  placeholder="Bank of America"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="accountType" className="text-right">
                                  Account Type
                                </Label>
                                <Select value={bankInfo.accountType} onValueChange={(value) => handleBankInfoChange('accountType', value)}>
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="checking">Checking</SelectItem>
                                    <SelectItem value="savings">Savings</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSaveBankInfo}>
                                Save Account
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}