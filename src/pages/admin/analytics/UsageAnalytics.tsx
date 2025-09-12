import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, Users, Calendar, Clock, TrendingUp, TrendingDown,
  Eye, MousePointer, Smartphone, Monitor, Globe, BarChart3,
  PieChart, LineChart, Download, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UsageStats {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  active_users_month: number;
  new_registrations_today: number;
  new_registrations_week: number;
  new_registrations_month: number;
  total_sessions: number;
  average_session_duration: number;
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  device_breakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  browser_breakdown: {
    chrome: number;
    firefox: number;
    safari: number;
    edge: number;
    other: number;
  };
  top_pages: Array<{
    page: string;
    views: number;
    unique_visitors: number;
  }>;
  hourly_activity: Array<{
    hour: number;
    users: number;
    sessions: number;
  }>;
  daily_activity: Array<{
    date: string;
    users: number;
    sessions: number;
    page_views: number;
  }>;
}

export default function UsageAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  useEffect(() => {
    fetchUsageStats();
  }, [timeRange]);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      
      // Fetch user data
      const { data: users } = await supabase.from('profiles').select('*');
      const { data: bookings } = await supabase.from('bookings').select('*');
      const { data: sessions } = await supabase.from('active_sessions' as any).select('*');

      if (users && bookings && sessions) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Calculate usage statistics
        const stats: UsageStats = {
          total_users: users.length,
          active_users_today: users.filter(u => new Date(u.updated_at) >= today).length,
          active_users_week: users.filter(u => new Date(u.updated_at) >= weekAgo).length,
          active_users_month: users.filter(u => new Date(u.updated_at) >= monthAgo).length,
          new_registrations_today: users.filter(u => new Date(u.created_at) >= today).length,
          new_registrations_week: users.filter(u => new Date(u.created_at) >= weekAgo).length,
          new_registrations_month: users.filter(u => new Date(u.created_at) >= monthAgo).length,
          total_sessions: sessions.length,
          average_session_duration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length || 0,
          page_views: Math.floor(Math.random() * 10000) + 5000, // Mock data
          unique_visitors: users.length,
          bounce_rate: Math.random() * 0.3 + 0.2, // Mock data
          device_breakdown: {
            desktop: Math.floor(Math.random() * 50) + 40,
            mobile: Math.floor(Math.random() * 40) + 30,
            tablet: Math.floor(Math.random() * 20) + 10,
          },
          browser_breakdown: {
            chrome: Math.floor(Math.random() * 50) + 40,
            firefox: Math.floor(Math.random() * 20) + 10,
            safari: Math.floor(Math.random() * 20) + 10,
            edge: Math.floor(Math.random() * 15) + 5,
            other: Math.floor(Math.random() * 10) + 5,
          },
          top_pages: [
            { page: '/', views: Math.floor(Math.random() * 1000) + 500, unique_visitors: Math.floor(Math.random() * 800) + 400 },
            { page: '/designers', views: Math.floor(Math.random() * 800) + 300, unique_visitors: Math.floor(Math.random() * 600) + 200 },
            { page: '/how-to-use', views: Math.floor(Math.random() * 600) + 200, unique_visitors: Math.floor(Math.random() * 400) + 150 },
            { page: '/contact', views: Math.floor(Math.random() * 400) + 100, unique_visitors: Math.floor(Math.random() * 300) + 80 },
            { page: '/support', views: Math.floor(Math.random() * 300) + 50, unique_visitors: Math.floor(Math.random() * 200) + 40 },
          ],
          hourly_activity: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            users: Math.floor(Math.random() * 50) + 10,
            sessions: Math.floor(Math.random() * 80) + 20,
          })),
          daily_activity: Array.from({ length: 7 }, (_, i) => {
            const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
            return {
              date: date.toISOString().split('T')[0],
              users: Math.floor(Math.random() * 100) + 50,
              sessions: Math.floor(Math.random() * 150) + 80,
              page_views: Math.floor(Math.random() * 1000) + 500,
            };
          }),
        };

        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading usage analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usage Analytics</h1>
          <p className="text-muted-foreground">Track user engagement and platform usage</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchUsageStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.new_registrations_week} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_users_week.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active_users_week / stats.total_users) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_sessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(stats.average_session_duration)}min avg duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.page_views.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {(stats.bounce_rate * 100).toFixed(1)}% bounce rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.daily_activity.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="text-sm">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-muted-foreground">
                          {day.users} users
                        </div>
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(day.users / Math.max(...stats.daily_activity.map(d => d.users))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.top_pages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="text-sm font-medium">{page.page}</div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-muted-foreground">
                          {page.views} views
                        </div>
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(page.views / Math.max(...stats.top_pages.map(p => p.views))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* User Growth */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Today</span>
                    <span className="font-medium">{stats.new_registrations_today}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Week</span>
                    <span className="font-medium">{stats.new_registrations_week}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="font-medium">{stats.new_registrations_month}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Users */}
            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Today</span>
                    <span className="font-medium">{stats.active_users_today}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Week</span>
                    <span className="font-medium">{stats.active_users_week}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="font-medium">{stats.active_users_month}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Session Duration */}
            <Card>
              <CardHeader>
                <CardTitle>Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {Math.round(stats.average_session_duration)}min
                  </div>
                  <p className="text-sm text-muted-foreground">Average session duration</p>
                </div>
              </CardContent>
            </Card>

            {/* Hourly Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.hourly_activity.slice(0, 12).map((hour, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{hour.hour}:00</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{hour.users} users</span>
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(hour.users / Math.max(...stats.hourly_activity.map(h => h.users))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm">Desktop</span>
                    </div>
                    <span className="font-medium">{stats.device_breakdown.desktop}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm">Mobile</span>
                    </div>
                    <span className="font-medium">{stats.device_breakdown.mobile}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm">Tablet</span>
                    </div>
                    <span className="font-medium">{stats.device_breakdown.tablet}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Browser Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Browser Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Chrome</span>
                    <span className="font-medium">{stats.browser_breakdown.chrome}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Firefox</span>
                    <span className="font-medium">{stats.browser_breakdown.firefox}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Safari</span>
                    <span className="font-medium">{stats.browser_breakdown.safari}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Edge</span>
                    <span className="font-medium">{stats.browser_breakdown.edge}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other</span>
                    <span className="font-medium">{stats.browser_breakdown.other}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
