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
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  PieChart,
  BarChart3,
  Eye,
  EyeOff,
  LineChart
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  const [hideAmount, setHideAmount] = useState(false);

  // Sample earnings data
  // Chart data
  const monthlyData = [
    { month: 'Jan', earnings: 1800 },
    { month: 'Feb', earnings: 2100 },
    { month: 'Mar', earnings: 1950 },
    { month: 'Apr', earnings: 2300 },
    { month: 'May', earnings: 2450 },
    { month: 'Jun', earnings: 2600 },
  ];

  const dailyData = [
    { day: 'Mon', amount: 120 },
    { day: 'Tue', amount: 200 },
    { day: 'Wed', amount: 150 },
    { day: 'Thu', amount: 300 },
    { day: 'Fri', amount: 180 },
    { day: 'Sat', amount: 250 },
    { day: 'Sun', amount: 100 },
  ];

  const categoryData = [
    { name: 'Logo Design', value: 35, color: '#10B981' },
    { name: 'Web Design', value: 45, color: '#3B82F6' },
    { name: 'Branding', value: 20, color: '#8B5CF6' },
  ];

  const earningsData = {
    thisMonth: {
      total: 2450,
      completed: 2100,
      pending: 350,
      sessions: 12,
      avgHourly: 85,
      growth: 15.3
    },
    transactions: [
      {
        id: 1,
        client: "Sarah Johnson",
        project: "E-commerce Redesign",
        amount: 300,
        date: "Aug 14, 2025",
        status: "completed",
        type: "project"
      },
      {
        id: 2,
        client: "Mike Chen",
        project: "Logo Design Session",
        amount: 150,
        date: "Aug 13, 2025", 
        status: "completed",
        type: "hourly"
      },
      {
        id: 3,
        client: "Lisa Brown",
        project: "Brand Identity Package",
        amount: 500,
        date: "Aug 12, 2025",
        status: "pending",
        type: "project"
      }
    ]
  };

  const formatAmount = (amount: number) => {
    return hideAmount ? "••••" : `$${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Enhanced Header */}
          <header className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 px-6 py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2" />
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Earnings</h1>
                    <p className="text-white/90 text-lg">Track your income and financial performance</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-white/90 font-medium">{formatAmount(earningsData.thisMonth.total)} this month</span>
                      <span className="text-white/60">•</span>
                      <span className="text-white/90 font-medium">+{earningsData.thisMonth.growth}% growth</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setHideAmount(!hideAmount)}
                  className="text-white hover:bg-white/20"
                >
                  {hideAmount ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Earnings</h3>
                  <p className="text-3xl font-bold text-gray-900">{formatAmount(earningsData.thisMonth.total)}</p>
                  <p className="text-sm text-green-600 mt-2">+{earningsData.thisMonth.growth}% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Available Balance</h3>
                  <p className="text-3xl font-bold text-gray-900">{formatAmount(earningsData.thisMonth.completed)}</p>
                  <p className="text-sm text-gray-500 mt-2">Ready for withdrawal</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Sessions Completed</h3>
                  <p className="text-3xl font-bold text-gray-900">{earningsData.thisMonth.sessions}</p>
                  <p className="text-sm text-gray-500 mt-2">This month</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <PieChart className="w-6 h-6 text-white" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Avg. Hourly Rate</h3>
                  <p className="text-3xl font-bold text-gray-900">{formatAmount(earningsData.thisMonth.avgHourly)}</p>
                  <p className="text-sm text-gray-500 mt-2">Per hour</p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 mb-8">
                <TabsList className="grid w-auto grid-cols-3 bg-transparent gap-2">
                  <TabsTrigger 
                    value="this-month"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="transactions"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold"
                  >
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="payouts"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold"
                  >
                    Payouts
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="this-month" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card className="bg-white border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <LineChart className="w-5 h-5 mr-2" />
                        Monthly Trends
                      </CardTitle>
                      <CardDescription>Your earnings over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 flex flex-col justify-between">
                        <div className="grid grid-cols-6 gap-4 h-full items-end">
                          {monthlyData.map((item, index) => (
                            <div key={item.month} className="flex flex-col items-center space-y-2">
                              <div 
                                className="w-8 bg-gradient-to-t from-green-400 to-blue-500 rounded-t-md"
                                style={{ height: `${(item.earnings / 3000) * 200}px` }}
                              ></div>
                              <span className="text-xs text-gray-600 font-medium">{item.month}</span>
                              <span className="text-xs text-gray-500">${item.earnings}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Weekly Performance
                      </CardTitle>
                      <CardDescription>Daily earnings this week</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 flex items-end justify-center space-x-3">
                        {dailyData.map((item) => (
                          <div key={item.day} className="flex flex-col items-center space-y-2">
                            <div 
                              className="w-10 bg-gradient-to-t from-blue-400 to-green-500 rounded-t-lg"
                              style={{ height: `${(item.amount / 300) * 200}px` }}
                            ></div>
                            <span className="text-xs text-gray-600 font-medium">{item.day}</span>
                            <span className="text-xs text-gray-500">${item.amount}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="bg-white border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PieChart className="w-5 h-5 mr-2" />
                        Service Breakdown
                      </CardTitle>
                      <CardDescription>Earnings by service type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center mb-6">
                        <div className="relative w-48 h-48">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-blue-500 p-1">
                            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">100%</p>
                                <p className="text-sm text-gray-600">Services</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {categoryData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                              <span className="text-sm text-gray-600">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white border-0 shadow-xl">
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Request Payout
                        </Button>
                        <Button variant="outline" className="w-full">
                          <FileText className="w-4 h-4 mr-2" />
                          Download Invoice
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Tax Documents
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-0 shadow-xl">
                      <CardHeader>
                        <CardTitle>Monthly Goal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-medium">{formatAmount(earningsData.thisMonth.total)} / $3000</span>
                          </div>
                          <Progress value={(earningsData.thisMonth.total / 3000) * 100} className="h-2" />
                          <p className="text-sm text-gray-500">82% of monthly goal achieved</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6">
                {earningsData.transactions.map((transaction) => (
                  <Card key={transaction.id} className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{transaction.project}</h3>
                            <p className="text-gray-600">{transaction.client}</p>
                            <p className="text-sm text-gray-500">{transaction.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">{formatAmount(transaction.amount)}</p>
                            <p className="text-sm text-gray-500 capitalize">{transaction.type}</p>
                          </div>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>


              <TabsContent value="payouts" className="space-y-6">
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Wallet className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Payout Management</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                    Manage your payout methods and withdrawal history.
                  </p>
                  <Button className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-8">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}