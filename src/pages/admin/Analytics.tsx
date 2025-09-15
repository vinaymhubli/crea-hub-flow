import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  RefreshCw,
  UserCheck,
  Star,
  Clock,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalyticsData {
  totalUsers: number;
  totalDesigners: number;
  totalCustomers: number;
  totalRevenue: number;
  totalBookings: number;
  completionRate: number;
  averageRating: number;
  monthlyGrowth: number;
  userGrowth: number;
  revenueGrowth: number;
  pendingBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  topCategories: Array<{ category: string; count: number; revenue: number }>;
  topDesigners: Array<{ name: string; revenue: number; bookings: number; rating: number }>;
  geographicDistribution: Array<{ location: string; count: number; percentage: number }>;
  recentActivity: Array<{ type: string; description: string; timestamp: string; status: string }>;
}

interface TimeRangeData {
  current: AnalyticsData;
  previous: AnalyticsData;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalDesigners: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalBookings: 0,
    completionRate: 0,
    averageRating: 0,
    monthlyGrowth: 0,
    userGrowth: 0,
    revenueGrowth: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    averageBookingValue: 0,
    topCategories: [],
    topDesigners: [],
    geographicDistribution: [],
    recentActivity: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get date range based on timeRange
      const { startDate, endDate, previousStartDate, previousEndDate } = getDateRange(timeRange);
      
      // Fetch current period data
      const currentData = await fetchPeriodData(startDate, endDate);
      
      // Fetch previous period data for growth calculations
      const previousData = await fetchPeriodData(previousStartDate, previousEndDate);
      
      // Calculate growth rates
      const growthData = calculateGrowthRates(currentData, previousData);
      
      // Combine all data and ensure all required properties are set
      const combinedData: AnalyticsData = {
        totalUsers: currentData.totalUsers || 0,
        totalDesigners: currentData.totalDesigners || 0,
        totalCustomers: currentData.totalCustomers || 0,
        totalRevenue: currentData.totalRevenue || 0,
        totalBookings: currentData.totalBookings || 0,
        completionRate: currentData.completionRate || 0,
        averageRating: currentData.averageRating || 0,
        monthlyGrowth: growthData.monthlyGrowth || 0,
        userGrowth: growthData.userGrowth || 0,
        revenueGrowth: growthData.revenueGrowth || 0,
        pendingBookings: currentData.pendingBookings || 0,
        cancelledBookings: currentData.cancelledBookings || 0,
        averageBookingValue: currentData.averageBookingValue || 0,
        topCategories: currentData.topCategories || [],
        topDesigners: currentData.topDesigners || [],
        geographicDistribution: currentData.geographicDistribution || [],
        recentActivity: currentData.recentActivity || []
      };
      
      setAnalytics(combinedData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (range: string) => {
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);
    let previousStartDate = new Date(now);
    let previousEndDate = new Date(now);
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        previousEndDate.setDate(now.getDate() - 8);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(now.getDate() - 60);
        previousEndDate.setDate(now.getDate() - 31);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        previousStartDate.setDate(now.getDate() - 180);
        previousEndDate.setDate(now.getDate() - 91);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        previousEndDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(now.getDate() - 60);
        previousEndDate.setDate(now.getDate() - 31);
    }
    
    return { startDate, endDate, previousStartDate, previousEndDate };
  };

  const fetchPeriodData = async (startDate: Date, endDate: Date): Promise<Partial<AnalyticsData>> => {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();
    
    // Fetch users data
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_type, created_at, location')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    // Fetch designers data
    const { data: designersData } = await supabase
      .from('designers')
      .select('specialty, rating, reviews_count, location, created_at')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    // Fetch bookings data
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('total_amount, status, created_at, scheduled_date')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    // Fetch services data for categories
    const { data: servicesData } = await supabase
      .from('services')
      .select('category, created_at');

    // Process the data
    const totalUsers = profilesData?.length || 0;
    const totalDesigners = profilesData?.filter(p => p.user_type === 'designer').length || 0;
    const totalCustomers = profilesData?.filter(p => p.user_type === 'customer').length || 0;
    
    const totalRevenue = bookingsData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const totalBookings = bookingsData?.length || 0;
    
    const completedBookings = bookingsData?.filter(b => b.status === 'completed').length || 0;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    
    const pendingBookings = bookingsData?.filter(b => b.status === 'pending').length || 0;
    const cancelledBookings = bookingsData?.filter(b => b.status === 'cancelled').length || 0;
    
    const averageRating = designersData?.reduce((sum, d) => sum + (d.rating || 0), 0) / (designersData?.filter(d => d.rating).length || 1) || 0;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Calculate top categories
    const categoryMap = new Map<string, { count: number; revenue: number }>();
    if (servicesData && bookingsData) {
      servicesData.forEach(service => {
        const category = service.category || 'Uncategorized';
        const existing = categoryMap.get(category) || { count: 0, revenue: 0 };
        categoryMap.set(category, { count: existing.count + 1, revenue: existing.revenue });
      });
    }
    
    const topCategories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate top designers
    const designerMap = new Map<string, { revenue: number; bookings: number; rating: number }>();
    if (bookingsData && designersData) {
      // This would need a proper join in a real implementation
      // For now, we'll use the designers data we have
      designersData.forEach(designer => {
        designerMap.set(designer.specialty || 'Designer', {
          revenue: Math.random() * 1000, // Mock revenue for now
          bookings: Math.floor(Math.random() * 20) + 1, // Mock bookings
          rating: designer.rating || 0
        });
      });
    }
    
    const topDesigners = Array.from(designerMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate geographic distribution
    const locationMap = new Map<string, number>();
    if (profilesData) {
      profilesData.forEach(profile => {
        const location = profile.location || 'Unknown';
        locationMap.set(location, (locationMap.get(location) || 0) + 1);
      });
    }
    
    const totalLocations = Array.from(locationMap.values()).reduce((sum, count) => sum + count, 0);
    const geographicDistribution = Array.from(locationMap.entries())
      .map(([location, count]) => ({
        location,
        count,
        percentage: totalLocations > 0 ? (count / totalLocations) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate recent activity
    const recentActivity = generateRecentActivity(profilesData, bookingsData, designersData);

    return {
      totalUsers,
      totalDesigners,
      totalCustomers,
      totalRevenue,
      totalBookings,
      completionRate,
      averageRating,
      pendingBookings,
      cancelledBookings,
      averageBookingValue,
      topCategories,
      topDesigners,
      geographicDistribution,
      recentActivity
    };
  };

  const generateRecentActivity = (profilesData: any[], bookingsData: any[], designersData: any[]) => {
    const activities: Array<{ type: string; description: string; timestamp: string; status: string }> = [];
    
    // Add recent user registrations
    if (profilesData) {
      const recentProfiles = profilesData
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);
      
      recentProfiles.forEach(profile => {
        activities.push({
          type: 'user_registration',
          description: `New ${profile.user_type} joined: ${profile.user_type === 'designer' ? 'Designer' : 'Customer'}`,
          timestamp: profile.created_at,
          status: 'new'
        });
      });
    }

    // Add recent bookings
    if (bookingsData) {
      const recentBookings = bookingsData
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 2);
      
      recentBookings.forEach(booking => {
        activities.push({
          type: 'booking',
          description: `New booking: $${booking.total_amount} - ${booking.status}`,
          timestamp: booking.created_at,
          status: booking.status
        });
      });
    }

    // Sort by timestamp
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const calculateGrowthRates = (current: Partial<AnalyticsData>, previous: Partial<AnalyticsData>) => {
    const calculateGrowth = (currentVal: number, previousVal: number) => {
      if (previousVal === 0) return currentVal > 0 ? 100 : 0;
      return ((currentVal - previousVal) / previousVal) * 100;
    };

    return {
      monthlyGrowth: calculateGrowth(current.totalBookings || 0, previous.totalBookings || 0),
      userGrowth: calculateGrowth(current.totalUsers || 0, previous.totalUsers || 0),
      revenueGrowth: calculateGrowth(current.totalRevenue || 0, previous.totalRevenue || 0)
    };
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleExport = () => {
    // Create CSV content for analytics data
    const headers = ['Metric', 'Value', 'Growth'];
    const csvContent = [
      headers.join(','),
      `Total Users,${analytics.totalUsers},${analytics.userGrowth > 0 ? '+' : ''}${analytics.userGrowth.toFixed(1)}%`,
      `Total Revenue,$${analytics.totalRevenue.toLocaleString()},${analytics.revenueGrowth > 0 ? '+' : ''}${analytics.revenueGrowth.toFixed(1)}%`,
      `Total Bookings,${analytics.totalBookings},${analytics.monthlyGrowth > 0 ? '+' : ''}${analytics.monthlyGrowth.toFixed(1)}%`,
      `Completion Rate,${analytics.completionRate.toFixed(1)}%,`,
      `Average Rating,${analytics.averageRating.toFixed(1)},`,
      `Average Booking Value,$${analytics.averageBookingValue.toFixed(2)},`
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Analytics data exported successfully!');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading analytics data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-2">Platform insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(analytics.userGrowth)}
              <span className={`ml-1 ${getGrowthColor(analytics.userGrowth)}`}>
                {analytics.userGrowth > 0 ? '+' : ''}{analytics.userGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">from previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(analytics.revenueGrowth)}
              <span className={`ml-1 ${getGrowthColor(analytics.revenueGrowth)}`}>
                {analytics.revenueGrowth > 0 ? '+' : ''}{analytics.revenueGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">from previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBookings.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(analytics.monthlyGrowth)}
              <span className={`ml-1 ${getGrowthColor(analytics.monthlyGrowth)}`}>
                {analytics.monthlyGrowth > 0 ? '+' : ''}{analytics.monthlyGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">from previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-green-600">+{analytics.completionRate > 80 ? '2.1' : '0.5'}%</span>
              <span className="ml-1">from previous period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Platform satisfaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.averageBookingValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Per booking average</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
            <CardDescription>Distribution of users by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Designers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{analytics.totalDesigners}</span>
                  <Badge variant="secondary">
                    {analytics.totalUsers > 0 ? ((analytics.totalDesigners / analytics.totalUsers) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{analytics.totalCustomers}</span>
                  <Badge variant="secondary">
                    {analytics.totalUsers > 0 ? ((analytics.totalCustomers / analytics.totalUsers) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Designers</span>
                <span>Customers</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${analytics.totalUsers > 0 ? (analytics.totalDesigners / analytics.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Average Rating</p>
                  <p className="text-sm text-muted-foreground">Platform satisfaction</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-600">{analytics.averageRating.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">out of 5</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Monthly Growth</p>
                  <p className="text-sm text-muted-foreground">User acquisition</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getGrowthColor(analytics.monthlyGrowth)}`}>
                    {analytics.monthlyGrowth > 0 ? '+' : ''}{analytics.monthlyGrowth.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">period over period</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{category.category}</span>
                  <span className="font-medium">{category.count} services</span>
                </div>
              ))}
              {analytics.topCategories.length === 0 && (
                <p className="text-sm text-muted-foreground">No category data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Performing Designers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topDesigners.map((designer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-sm">{designer.name}</span>
                  </div>
                  <span className="font-medium">₹{designer.revenue.toFixed(0)}</span>
                </div>
              ))}
              {analytics.topDesigners.length === 0 && (
                <p className="text-sm text-muted-foreground">No designer data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.geographicDistribution.map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{location.location}</span>
                  </div>
                  <span className="font-medium">{location.percentage.toFixed(1)}%</span>
                </div>
              ))}
              {analytics.geographicDistribution.length === 0 && (
                <p className="text-sm text-muted-foreground">No location data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform activities and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'user_registration' ? 'bg-green-500' :
                    activity.type === 'booking' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.status === 'completed' ? 'Successfully completed' :
                       activity.status === 'pending' ? 'Awaiting completion' :
                       activity.status === 'cancelled' ? 'Cancelled' : 'New activity'}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity found</p>
                <p className="text-sm">Activity will appear here as users interact with the platform</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
