import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageCircle, 
  Clock, 
  TrendingUp, 
  Activity,
  BarChart3,
  Download,
  Calendar,
  Eye,
  Heart,
  Share2,
  ThumbsUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EngagementMetrics {
  total_users: number;
  active_users: number;
  total_sessions: number;
  avg_session_duration: number;
  total_messages: number;
  user_retention_rate: number;
  engagement_score: number;
}

interface EngagementData {
  date: string;
  active_users: number;
  sessions: number;
  messages: number;
  engagement_rate: number;
}

export default function EngagementAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (user) {
      fetchEngagementMetrics();
      fetchEngagementData();
    }
  }, [user, timeRange]);

  const fetchEngagementMetrics = async () => {
    try {
      setLoading(true);
      console.log('Fetching engagement metrics...');
      
      // Fetch user metrics
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id, created_at, last_sign_in_at')
        .not('role', 'is', null);

      if (userError) {
        console.error('User data error:', userError);
      }

      // Fetch session metrics - try active_sessions first, fallback to bookings
      let sessionData = null;
      let sessionError = null;
      let bookingsData = null;
      
      try {
        const { data, error } = await supabase
          .from('active_sessions')
          .select('id, started_at, ended_at, status');
        sessionData = data;
        sessionError = error;
      } catch (err) {
        console.log('active_sessions table not found, trying bookings...');
        const { data, error } = await supabase
          .from('bookings')
          .select('id, scheduled_date, created_at, status, duration_hours')
          .eq('status', 'completed');
        sessionData = data;
        bookingsData = data;
        sessionError = error;
      }

      if (sessionError) {
        console.error('Session data error:', sessionError);
      }

      // Fetch message metrics - try messages table, but don't fail if it doesn't exist
      let messageData = null;
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, created_at');
        if (!error) {
          messageData = data;
        }
      } catch (err) {
        console.log('messages table not found, using empty data');
        messageData = [];
      }

      // Calculate metrics
      const totalUsers = userData?.length || 0;
      const activeUsers = userData?.filter(u => {
        const lastSignIn = new Date(u.last_sign_in_at || u.created_at);
        const daysSinceLastSignIn = (Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastSignIn <= 30;
      }).length || 0;

      const totalSessions = sessionData?.length || 0;
      const completedSessions = sessionData?.filter(s => 
        s.status === 'ended' || s.status === 'completed'
      ).length || 0;
      
      // Calculate average session duration - handle both active_sessions and bookings
      let avgSessionDuration = 0;
      if (sessionData && completedSessions > 0) {
        if (sessionData[0]?.started_at && sessionData[0]?.ended_at) {
          // active_sessions format
          const sessionsWithDuration = sessionData.filter(s => s.ended_at && s.started_at);
          if (sessionsWithDuration.length > 0) {
            avgSessionDuration = sessionsWithDuration.reduce((acc, session) => {
              const duration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
              return acc + (duration / (1000 * 60)); // Convert to minutes
            }, 0) / sessionsWithDuration.length;
          }
        } else if (bookingsData) {
          // bookings format - calculate from duration_hours
          const bookingsWithDuration = bookingsData.filter(b => b.duration_hours && b.duration_hours > 0);
          if (bookingsWithDuration.length > 0) {
            avgSessionDuration = bookingsWithDuration.reduce((acc, booking) => {
              return acc + (booking.duration_hours * 60); // Convert hours to minutes
            }, 0) / bookingsWithDuration.length;
          }
        }
      }

      const totalMessages = messageData?.length || 0;
      const userRetentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
      const engagementScore = totalUsers > 0 ? ((activeUsers + completedSessions + totalMessages) / (totalUsers * 3)) * 100 : 0;

      console.log('Calculated metrics:', {
        totalUsers,
        activeUsers,
        totalSessions,
        completedSessions,
        avgSessionDuration,
        totalMessages,
        userRetentionRate,
        engagementScore
      });

      setMetrics({
        total_users: totalUsers,
        active_users: activeUsers,
        total_sessions: totalSessions,
        avg_session_duration: avgSessionDuration,
        total_messages: totalMessages,
        user_retention_rate: userRetentionRate,
        engagement_score: engagementScore
      });

    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      // Set default metrics instead of showing error
      setMetrics({
        total_users: 0,
        active_users: 0,
        total_sessions: 0,
        avg_session_duration: 0,
        total_messages: 0,
        user_retention_rate: 0,
        engagement_score: 0
      });
      
      // Only show error toast for critical errors, not missing tables
      if (error.message && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        toast({
          title: "Error",
          description: "Failed to fetch engagement metrics",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEngagementData = async () => {
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Generate date range
      const dateRange = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dateRange.push(date.toISOString().split('T')[0]);
      }

      // Fetch daily engagement data
      const engagementData = await Promise.all(
        dateRange.map(async (date) => {
          // Try to fetch users - handle missing last_sign_in_at field
          let users = [];
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('user_id, last_sign_in_at, created_at')
              .gte('created_at', `${date}T00:00:00`)
              .lt('created_at', `${date}T23:59:59`);
            if (!error) users = data || [];
          } catch (err) {
            console.log('Error fetching users for date:', date);
          }

          // Try to fetch sessions - handle both active_sessions and bookings
          let sessions = [];
          try {
            const { data, error } = await supabase
              .from('active_sessions')
              .select('id, started_at')
              .gte('started_at', `${date}T00:00:00`)
              .lt('started_at', `${date}T23:59:59`);
            if (!error) {
              sessions = data || [];
            } else {
              // Fallback to bookings
              const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select('id, scheduled_date')
                .gte('scheduled_date', `${date}T00:00:00`)
                .lt('scheduled_date', `${date}T23:59:59`)
                .eq('status', 'completed');
              if (!bookingError) sessions = bookingData || [];
            }
          } catch (err) {
            console.log('Error fetching sessions for date:', date);
          }

          // Try to fetch messages - handle missing table
          let messages = [];
          try {
            const { data, error } = await supabase
              .from('messages')
              .select('id')
              .gte('created_at', `${date}T00:00:00`)
              .lt('created_at', `${date}T23:59:59`);
            if (!error) messages = data || [];
          } catch (err) {
            console.log('Messages table not found for date:', date);
          }

          return {
            date,
            active_users: users.length,
            sessions: sessions.length,
            messages: messages.length,
            engagement_rate: users.length > 0 ? ((sessions.length + messages.length) / users.length) * 100 : 0
          };
        })
      );

      setEngagementData(engagementData);
    } catch (error) {
      console.error('Error fetching engagement data:', error);
    }
  };

  const exportEngagementData = () => {
    try {
      const csvContent = [
        ['Date', 'Active Users', 'Sessions', 'Messages', 'Engagement Rate (%)'].join(','),
        ...engagementData.map(d => [
          d.date,
          d.active_users,
          d.sessions,
          d.messages,
          d.engagement_rate.toFixed(2)
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `engagement-analytics-${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Engagement data exported successfully",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Engagement Analytics</h1>
          <p className="text-gray-600">Track user engagement and platform activity</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportEngagementData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Engagement Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{metrics.total_users}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">{metrics.active_users}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold">{metrics.total_sessions}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                  <p className="text-2xl font-bold">{metrics.engagement_score.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Session Duration</p>
                  <p className="text-2xl font-bold">{metrics.avg_session_duration.toFixed(1)}m</p>
                </div>
                <Clock className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold">{metrics.total_messages}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-pink-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">User Retention</p>
                  <p className="text-2xl font-bold">{metrics.user_retention_rate.toFixed(1)}%</p>
                </div>
                <Heart className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Platform Health</p>
                  <p className="text-2xl font-bold">
                    {metrics.engagement_score > 70 ? 'Excellent' : 
                     metrics.engagement_score > 50 ? 'Good' : 
                     metrics.engagement_score > 30 ? 'Fair' : 'Poor'}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Engagement Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Daily Engagement Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Active Users</th>
                  <th className="text-left p-2">Sessions</th>
                  <th className="text-left p-2">Messages</th>
                  <th className="text-left p-2">Engagement Rate</th>
                </tr>
              </thead>
              <tbody>
                {engagementData.map((data, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{new Date(data.date).toLocaleDateString()}</td>
                    <td className="p-2">{data.active_users}</td>
                    <td className="p-2">{data.sessions}</td>
                    <td className="p-2">{data.messages}</td>
                    <td className="p-2">{data.engagement_rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
