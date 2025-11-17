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
      console.log('Fetching usage analytics...');
      
      // Fetch user data
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, created_at, updated_at, role')
        .not('role', 'is', null);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Fetch bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, created_at, scheduled_date, status, duration_hours, customer_id, designer_id');

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      }

      // Try to fetch active sessions
      let sessions: any[] = [];
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('active_sessions')
          .select('id, started_at, ended_at, status, customer_id, designer_id');
        if (!sessionError) sessions = sessionData || [];
      } catch (err) {
        console.log('active_sessions table not found, using bookings data');
        sessions = bookings?.filter(b => b.status === 'completed').map(b => ({
          id: b.id,
          started_at: b.scheduled_date || b.created_at,
          ended_at: null,
          status: 'completed',
          customer_id: b.customer_id,
          designer_id: b.designer_id,
          created_at: b.created_at
        })) || [];
      }

      // Fetch wallet transactions for activity tracking
      const { data: transactions, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('id, created_at, user_id, transaction_type');

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      }

      // Fetch page views for browser and device tracking
      let pageViewsData: any[] = [];
      try {
        const { data: pageViewsFromDB, error: pageViewsError } = await supabase
          .from('page_views')
          .select('id, created_at, user_id, page_path, browser_name, device_type');
        
        if (!pageViewsError && pageViewsFromDB) {
          pageViewsData = pageViewsFromDB;
        }
      } catch (err) {
        console.log('page_views table not found, browser/device tracking not available');
      }

      if (users) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Calculate real usage statistics
        const totalUsers = users.length;
        const activeUsersToday = users.filter(u => new Date(u.updated_at) >= today).length;
        const activeUsersWeek = users.filter(u => new Date(u.updated_at) >= weekAgo).length;
        const activeUsersMonth = users.filter(u => new Date(u.updated_at) >= monthAgo).length;
        
        const newRegistrationsToday = users.filter(u => new Date(u.created_at) >= today).length;
        const newRegistrationsWeek = users.filter(u => new Date(u.created_at) >= weekAgo).length;
        const newRegistrationsMonth = users.filter(u => new Date(u.created_at) >= monthAgo).length;

        // Calculate session metrics
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === 'ended' || s.status === 'completed').length;
        
        // Calculate average session duration
        let avgSessionDuration = 0;
        if (sessions.length > 0) {
          if (sessions[0]?.started_at && sessions[0]?.ended_at) {
            // active_sessions format
            const sessionsWithDuration = sessions.filter(s => s.ended_at && s.started_at);
            if (sessionsWithDuration.length > 0) {
              const totalDuration = sessionsWithDuration.reduce((sum, s) => {
                const duration = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime();
                return sum + (duration / (1000 * 60)); // Convert to minutes
              }, 0);
              avgSessionDuration = totalDuration / sessionsWithDuration.length;
            }
          } else {
            // bookings format
            const bookingSessions = bookings?.filter(b => b.duration_hours) || [];
            if (bookingSessions.length > 0) {
              avgSessionDuration = bookingSessions.reduce((sum, b) => sum + (b.duration_hours * 60), 0) / bookingSessions.length;
            }
          }
        }

        // Calculate page views - use actual page_views table if available, otherwise use transactions as proxy
        const pageViewsCount = pageViewsData.length > 0 ? pageViewsData.length : (transactions?.length || 0);
        const uniqueVisitors = pageViewsData.length > 0 
          ? new Set(pageViewsData.map(pv => pv.user_id).filter(Boolean)).size
          : new Set(transactions?.map(t => t.user_id) || []).size;
        // Bounce rate: users who only had one session/view (simplified calculation)
        // If we have sessions, calculate bounce rate based on single-session users
        let bounceRate = 0;
        if (sessions.length > 0) {
          const userSessionCounts = new Map<string, number>();
          sessions.forEach(s => {
            if (s.customer_id) {
              userSessionCounts.set(s.customer_id, (userSessionCounts.get(s.customer_id) || 0) + 1);
            }
            if (s.designer_id) {
              userSessionCounts.set(s.designer_id, (userSessionCounts.get(s.designer_id) || 0) + 1);
            }
          });
          const singleSessionUsers = Array.from(userSessionCounts.values()).filter(count => count === 1).length;
          const totalSessionUsers = userSessionCounts.size;
          bounceRate = totalSessionUsers > 0 ? (singleSessionUsers / totalSessionUsers) : 0;
        } else if (totalUsers > 0 && uniqueVisitors > 0) {
          // Fallback: use transaction-based calculation
          bounceRate = uniqueVisitors > 0 ? ((totalUsers - uniqueVisitors) / totalUsers) : 0;
        }

        // Device breakdown - calculate from page_views table
        const deviceBreakdown = {
          desktop: pageViewsData.filter(pv => pv.device_type === 'desktop').length,
          mobile: pageViewsData.filter(pv => pv.device_type === 'mobile').length,
          tablet: pageViewsData.filter(pv => pv.device_type === 'tablet').length
        };

        // Browser breakdown - calculate from page_views table
        const browserCounts = new Map<string, number>();
        pageViewsData.forEach(pv => {
          if (pv.browser_name) {
            const browser = pv.browser_name.toLowerCase();
            if (browser === 'chrome') {
              browserCounts.set('chrome', (browserCounts.get('chrome') || 0) + 1);
            } else if (browser === 'firefox') {
              browserCounts.set('firefox', (browserCounts.get('firefox') || 0) + 1);
            } else if (browser === 'safari') {
              browserCounts.set('safari', (browserCounts.get('safari') || 0) + 1);
            } else if (browser === 'edge') {
              browserCounts.set('edge', (browserCounts.get('edge') || 0) + 1);
            } else {
              browserCounts.set('other', (browserCounts.get('other') || 0) + 1);
            }
          }
        });

        const browserBreakdown = {
          chrome: browserCounts.get('chrome') || 0,
          firefox: browserCounts.get('firefox') || 0,
          safari: browserCounts.get('safari') || 0,
          edge: browserCounts.get('edge') || 0,
          other: browserCounts.get('other') || 0
        };

        // Top pages - calculate from page_views table (exclude admin pages)
        const pageCounts = new Map<string, { views: number; unique_visitors: Set<string> }>();
        pageViewsData.forEach(pv => {
          if (pv.page_path) {
            const page = pv.page_path.split('?')[0]; // Remove query params
            
            // Filter out admin pages, dashboard pages, and internal routes
            if (
              page.startsWith('/admin') ||
              page.startsWith('/customer-dashboard') ||
              page.startsWith('/designer-dashboard') ||
              page.startsWith('/session/') ||
              page.startsWith('/live-session/') ||
              page.startsWith('/auth') ||
              page.startsWith('/login') ||
              page.startsWith('/signup') ||
              page.startsWith('/admin-login')
            ) {
              return; // Skip admin and internal pages
            }
            
            const current = pageCounts.get(page) || { views: 0, unique_visitors: new Set() };
            current.views += 1;
            if (pv.user_id) {
              current.unique_visitors.add(pv.user_id);
            }
            pageCounts.set(page, current);
          }
        });

        const topPages = Array.from(pageCounts.entries())
          .map(([page, data]) => ({
            page,
            views: data.views,
            unique_visitors: data.unique_visitors.size
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10); // Top 10 pages

        // Calculate hourly activity from real session data
        const hourlyActivityMap = new Map<number, { users: Set<string>, sessions: number }>();
        for (let hour = 0; hour < 24; hour++) {
          hourlyActivityMap.set(hour, { users: new Set(), sessions: 0 });
        }

        // Process sessions to get hourly activity
        sessions.forEach(session => {
          const sessionDate = session.started_at ? new Date(session.started_at) : 
                             session.created_at ? new Date(session.created_at) : null;
          if (sessionDate) {
            const hour = sessionDate.getHours();
            const current = hourlyActivityMap.get(hour);
            if (current) {
              if (session.customer_id) current.users.add(session.customer_id);
              if (session.designer_id) current.users.add(session.designer_id);
              current.sessions += 1;
            }
          }
        });

        // Process bookings for hourly activity
        if (bookings) {
          bookings.forEach(booking => {
            const bookingDate = booking.scheduled_date ? new Date(booking.scheduled_date) : 
                               booking.created_at ? new Date(booking.created_at) : null;
            if (bookingDate) {
              const hour = bookingDate.getHours();
              const current = hourlyActivityMap.get(hour);
              if (current) {
                if (booking.customer_id) current.users.add(booking.customer_id);
                if (booking.designer_id) current.users.add(booking.designer_id);
                current.sessions += 1;
              }
            }
          });
        }

        const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
          const data = hourlyActivityMap.get(hour) || { users: new Set(), sessions: 0 };
          return {
            hour,
            users: data.users.size,
            sessions: data.sessions
          };
        });

        // Calculate daily activity from real data for the selected time range
        const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
        const dailyActivityMap = new Map<string, { users: Set<string>, sessions: number, page_views: number }>();
        
        // Initialize all days/hours in range
        if (timeRange === '24h') {
          // For 24h, show hourly breakdown
          const now = new Date();
          for (let i = 23; i >= 0; i--) {
            const date = new Date(now);
            date.setHours(date.getHours() - i);
            const dateStr = date.toISOString().split('T')[0];
            const hour = date.getHours();
            const key = `${dateStr}_${hour}`;
            dailyActivityMap.set(key, { users: new Set(), sessions: 0, page_views: 0 });
          }
        } else {
          // For multi-day ranges, show daily breakdown
          for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            const dateStr = date.toISOString().split('T')[0];
            dailyActivityMap.set(dateStr, { users: new Set(), sessions: 0, page_views: 0 });
          }
        }

        // Process users by date
        users.forEach(user => {
          const userDate = new Date(user.created_at || user.updated_at);
          if (timeRange === '24h') {
            const hour = userDate.getHours();
            const dateStr = userDate.toISOString().split('T')[0];
            const key = `${dateStr}_${hour}`;
            const dayData = dailyActivityMap.get(key);
            if (dayData) {
              dayData.users.add(user.user_id);
            }
          } else {
            const dateStr = userDate.toISOString().split('T')[0];
            const dayData = dailyActivityMap.get(dateStr);
            if (dayData) {
              dayData.users.add(user.user_id);
            }
          }
        });

        // Process sessions by date
        sessions.forEach(session => {
          const sessionDate = session.started_at ? new Date(session.started_at) : 
                             session.created_at ? new Date(session.created_at) : null;
          if (sessionDate) {
            if (timeRange === '24h') {
              const hour = sessionDate.getHours();
              const dateStr = sessionDate.toISOString().split('T')[0];
              const key = `${dateStr}_${hour}`;
              const dayData = dailyActivityMap.get(key);
              if (dayData) {
                if (session.customer_id) dayData.users.add(session.customer_id);
                if (session.designer_id) dayData.users.add(session.designer_id);
                dayData.sessions += 1;
              }
            } else {
              const dateStr = sessionDate.toISOString().split('T')[0];
              const dayData = dailyActivityMap.get(dateStr);
              if (dayData) {
                if (session.customer_id) dayData.users.add(session.customer_id);
                if (session.designer_id) dayData.users.add(session.designer_id);
                dayData.sessions += 1;
              }
            }
          }
        });

        // Process bookings by date
        if (bookings) {
          bookings.forEach(booking => {
            const bookingDate = booking.scheduled_date ? new Date(booking.scheduled_date) : 
                               booking.created_at ? new Date(booking.created_at) : null;
            if (bookingDate) {
              if (timeRange === '24h') {
                const hour = bookingDate.getHours();
                const dateStr = bookingDate.toISOString().split('T')[0];
                const key = `${dateStr}_${hour}`;
                const dayData = dailyActivityMap.get(key);
                if (dayData) {
                  if (booking.customer_id) dayData.users.add(booking.customer_id);
                  if (booking.designer_id) dayData.users.add(booking.designer_id);
                  dayData.sessions += 1;
                }
              } else {
                const dateStr = bookingDate.toISOString().split('T')[0];
                const dayData = dailyActivityMap.get(dateStr);
                if (dayData) {
                  if (booking.customer_id) dayData.users.add(booking.customer_id);
                  if (booking.designer_id) dayData.users.add(booking.designer_id);
                  dayData.sessions += 1;
                }
              }
            }
          });
        }

        // Process page views by date (use page_views table if available, otherwise use transactions as proxy)
        if (pageViewsData.length > 0) {
          pageViewsData.forEach(pageView => {
            const pvDate = new Date(pageView.created_at);
            if (timeRange === '24h') {
              const hour = pvDate.getHours();
              const dateStr = pvDate.toISOString().split('T')[0];
              const key = `${dateStr}_${hour}`;
              const dayData = dailyActivityMap.get(key);
              if (dayData) {
                dayData.page_views += 1;
              }
            } else {
              const dateStr = pvDate.toISOString().split('T')[0];
              const dayData = dailyActivityMap.get(dateStr);
              if (dayData) {
                dayData.page_views += 1;
              }
            }
          });
        } else if (transactions) {
          // Fallback to transactions if page_views table is empty
          transactions.forEach(transaction => {
            const transDate = new Date(transaction.created_at);
            if (timeRange === '24h') {
              const hour = transDate.getHours();
              const dateStr = transDate.toISOString().split('T')[0];
              const key = `${dateStr}_${hour}`;
              const dayData = dailyActivityMap.get(key);
              if (dayData) {
                dayData.page_views += 1;
              }
            } else {
              const dateStr = transDate.toISOString().split('T')[0];
              const dayData = dailyActivityMap.get(dateStr);
              if (dayData) {
                dayData.page_views += 1;
              }
            }
          });
        }

        const dailyActivity = Array.from(dailyActivityMap.entries())
          .map(([date, data]) => {
            // For 24h view, extract just the date part for display
            const displayDate = timeRange === '24h' ? date.split('_')[0] + ' ' + date.split('_')[1] + ':00' : date;
            return {
              date: displayDate,
              users: data.users.size,
              sessions: data.sessions,
              page_views: data.page_views
            };
          })
          .sort((a, b) => {
            // Sort by the original key for proper ordering
            const aKey = timeRange === '24h' ? a.date : a.date;
            const bKey = timeRange === '24h' ? b.date : b.date;
            return aKey.localeCompare(bKey);
        });

        const stats: UsageStats = {
          total_users: totalUsers,
          active_users_today: activeUsersToday,
          active_users_week: activeUsersWeek,
          active_users_month: activeUsersMonth,
          new_registrations_today: newRegistrationsToday,
          new_registrations_week: newRegistrationsWeek,
          new_registrations_month: newRegistrationsMonth,
          total_sessions: totalSessions,
          average_session_duration: avgSessionDuration,
          page_views: pageViewsCount,
          unique_visitors: uniqueVisitors,
          bounce_rate: bounceRate,
          device_breakdown: deviceBreakdown,
          browser_breakdown: browserBreakdown,
          top_pages: topPages,
          hourly_activity: hourlyActivity,
          daily_activity: dailyActivity,
        };

        setStats(stats);
      } else {
        // Set default stats when no data is available
        setStats({
          total_users: 0,
          active_users_today: 0,
          active_users_week: 0,
          active_users_month: 0,
          new_registrations_today: 0,
          new_registrations_week: 0,
          new_registrations_month: 0,
          total_sessions: 0,
          average_session_duration: 0,
          page_views: 0,
          unique_visitors: 0,
          bounce_rate: 0,
          device_breakdown: { desktop: 0, mobile: 0, tablet: 0 },
          browser_breakdown: { chrome: 0, firefox: 0, safari: 0, edge: 0, other: 0 },
          top_pages: [],
          hourly_activity: [],
          daily_activity: []
        });
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      // Set default stats on error
      setStats({
        total_users: 0,
        active_users_today: 0,
        active_users_week: 0,
        active_users_month: 0,
        new_registrations_today: 0,
        new_registrations_week: 0,
        new_registrations_month: 0,
        total_sessions: 0,
        average_session_duration: 0,
        page_views: 0,
        unique_visitors: 0,
        bounce_rate: 0,
        device_breakdown: { desktop: 0, mobile: 0, tablet: 0 },
        browser_breakdown: { chrome: 0, firefox: 0, safari: 0, edge: 0, other: 0 },
        top_pages: [],
        hourly_activity: [],
        daily_activity: []
      });
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
              {stats.bounce_rate > 0 ? `${(stats.bounce_rate * 100).toFixed(1)}% bounce rate` : 'No bounce data available'}
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
                <CardTitle>
                  Daily Activity ({timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.daily_activity.length > 0 ? (
                <div className="space-y-4">
                    {stats.daily_activity.map((day, index) => {
                      const maxUsers = Math.max(...stats.daily_activity.map(d => d.users), 1);
                      // For 24h view, the date format is "YYYY-MM-DD HH:00"
                      let dayLabel: string;
                      if (timeRange === '24h') {
                        const parts = day.date.split(' ');
                        if (parts.length >= 2) {
                          const hourPart = parts[1] || '00:00';
                          dayLabel = hourPart;
                        } else {
                          dayLabel = day.date;
                        }
                      } else {
                        const date = new Date(day.date);
                        dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      }
                      return (
                    <div key={index} className="flex items-center justify-between">
                          <div className="text-sm font-medium min-w-[100px]">
                            {dayLabel}
                      </div>
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="text-sm text-muted-foreground min-w-[80px]">
                              {day.users} users, {day.sessions} sessions
                        </div>
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                                style={{ width: `${(day.users / maxUsers) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                      );
                    })}
                </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activity data available for the selected time range
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.top_pages.length > 0 ? (
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
                              style={{ width: `${(page.views / Math.max(...stats.top_pages.map(p => p.views), 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No page view data available
                  </p>
                )}
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
                <CardTitle>Hourly Activity (24 Hours)</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.hourly_activity.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {stats.hourly_activity.map((hour, index) => {
                      const maxUsers = Math.max(...stats.hourly_activity.map(h => h.users), 1);
                      const maxSessions = Math.max(...stats.hourly_activity.map(h => h.sessions), 1);
                      return (
                        <div key={index} className="flex items-center justify-between py-1">
                          <span className="text-sm font-medium min-w-[60px]">
                            {String(hour.hour).padStart(2, '0')}:00
                          </span>
                          <div className="flex items-center space-x-3 flex-1">
                            <span className="text-xs text-muted-foreground min-w-[80px]">
                              {hour.users} users, {hour.sessions} sessions
                            </span>
                            <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                                style={{ width: `${(hour.users / maxUsers) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                      );
                    })}
                </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hourly activity data available
                  </p>
                )}
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
                {stats.device_breakdown.desktop > 0 || stats.device_breakdown.mobile > 0 || stats.device_breakdown.tablet > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm">Desktop</span>
                    </div>
                      <span className="font-medium">{stats.device_breakdown.desktop}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm">Mobile</span>
                    </div>
                      <span className="font-medium">{stats.device_breakdown.mobile}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm">Tablet</span>
                    </div>
                      <span className="font-medium">{stats.device_breakdown.tablet}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Device tracking not available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Browser Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Browser Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.browser_breakdown.chrome > 0 || stats.browser_breakdown.firefox > 0 || stats.browser_breakdown.safari > 0 || stats.browser_breakdown.edge > 0 || stats.browser_breakdown.other > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Chrome</span>
                      <span className="font-medium">{stats.browser_breakdown.chrome}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Firefox</span>
                      <span className="font-medium">{stats.browser_breakdown.firefox}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Safari</span>
                      <span className="font-medium">{stats.browser_breakdown.safari}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Edge</span>
                      <span className="font-medium">{stats.browser_breakdown.edge}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other</span>
                      <span className="font-medium">{stats.browser_breakdown.other}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Browser tracking not available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
