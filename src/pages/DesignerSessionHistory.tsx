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
  Search,
  AlertTriangle,
  RefreshCw
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">VB</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Vb Bn</p>
              <p className="text-sm text-gray-500">designer</p>
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
                          ? 'bg-green-50 text-green-600 border-r-2 border-green-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      >
                        <item.icon className="w-5 h-5" />
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

export default function DesignerSessionHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(true); // Set to true to show error state initially

  const handleExportReport = () => {
    // Create CSV data for session history
    const csvData = [
      ['Date', 'Client', 'Session ID', 'Duration', 'Status', 'Earnings'],
      ['2025-08-05', 'No data', 'N/A', '0 min', 'N/A', '$0.00'],
      // Add more sample data or real data here
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleRetry = async () => {
    setIsLoading(true);
    setHasError(false);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setHasError(true); // Still showing error for demo
    }, 1000);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Implement search functionality here
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Session History</h1>
                  <p className="text-gray-600">Track your past design sessions and performance</p>
                </div>
              </div>
              
              <Button onClick={handleExportReport} className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </Button>
            </div>
          </header>

          <div className="p-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by client name or session ID..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sessions Content */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
                <p className="text-sm text-gray-500">0 sessions found</p>
              </div>
              
              <div className="p-12">
                {hasError ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-gray-600 mb-4">Failed to load session history. Please try again.</p>
                    <Button 
                      onClick={handleRetry}
                      disabled={isLoading}
                      className="flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span>Retry</span>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No sessions found</h3>
                    <p className="text-sm text-gray-500">You have no design sessions matching the current filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}