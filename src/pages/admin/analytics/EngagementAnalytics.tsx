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
      
      // Fetch user metrics - get all users with role
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id, created_at, last_sign_in_at, updated_at')
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
          .select('id, scheduled_date, created_at, status, duration_hours, customer_id, designer_id')
          .in('status', ['completed', 'confirmed', 'in_progress']);
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

      // Calculate metrics from real data - use same logic as UsageAnalytics
      const totalUsers = userData?.length || 0;
      
      // Active users = users who had activity (updated_at) in last 30 days (same as UsageAnalytics)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const activeUsers = userData?.filter(u => {
        const lastUpdate = u.updated_at ? new Date(u.updated_at) : null;
        return lastUpdate && lastUpdate >= thirtyDaysAgo;
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
      
      // Engagement Score: weighted calculation based on active users, sessions, and activity
      // Formula: (active users ratio + session activity ratio) / 2 * 100
      const activeUserRatio = totalUsers > 0 ? (activeUsers / totalUsers) : 0;
      const sessionActivityRatio = totalUsers > 0 ? (completedSessions / totalUsers) : 0;
      // Cap session activity ratio at 1.0 (can't have more sessions than users in ratio)
      const cappedSessionRatio = Math.min(sessionActivityRatio, 1.0);
      const engagementScore = ((activeUserRatio + cappedSessionRatio) / 2) * 100;

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

      // Fetch daily engagement data - use real data from database
      const engagementData = await Promise.all(
        dateRange.map(async (date) => {
          // Fetch active users for this date (users who were active on this day)
          // Active = users who logged in or had activity (updated_at) on this date
          let activeUsers = new Set<string>();
          try {
            // Get users who logged in on this date
            const { data: signInUsers, error: signInError } = await supabase
              .from('profiles')
              .select('user_id, last_sign_in_at, updated_at')
              .gte('last_sign_in_at', `${date}T00:00:00`)
              .lt('last_sign_in_at', `${date}T23:59:59`);
            
            if (!signInError && signInUsers) {
              signInUsers.forEach(u => {
                if (u.user_id) activeUsers.add(u.user_id);
              });
            }

            // Also get users who had profile updates on this date (activity indicator)
            // Only count if updated_at is different from created_at (real activity, not just creation)
            const { data: updatedUsers, error: updatedError } = await supabase
              .from('profiles')
              .select('user_id, updated_at, created_at')
              .gte('updated_at', `${date}T00:00:00`)
              .lt('updated_at', `${date}T23:59:59`);
            
            if (!updatedError && updatedUsers) {
              updatedUsers.forEach(u => {
                // Only count if updated_at is different from created_at (real activity)
                if (u.user_id && u.updated_at && u.created_at && u.updated_at !== u.created_at) {
                  activeUsers.add(u.user_id);
                }
              });
            }
          } catch (err) {
            console.log('Error fetching active users for date:', date, err);
          }

          // Fetch sessions for this date - handle both active_sessions and bookings
          let sessions = [];
          let sessionUserIds = new Set<string>();
          try {
            const { data: activeSessions, error: activeSessionsError } = await supabase
              .from('active_sessions')
              .select('id, started_at, customer_id, designer_id')
              .gte('started_at', `${date}T00:00:00`)
              .lt('started_at', `${date}T23:59:59`);
            
            if (!activeSessionsError && activeSessions) {
              sessions = activeSessions;
              activeSessions.forEach(s => {
                if (s.customer_id) {
                  activeUsers.add(s.customer_id);
                  sessionUserIds.add(s.customer_id);
                }
                if (s.designer_id) {
                  activeUsers.add(s.designer_id);
                  sessionUserIds.add(s.designer_id);
                }
              });
            } else {
              // Fallback to bookings
              const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select('id, scheduled_date, created_at, customer_id, designer_id')
                .or(`scheduled_date.gte.${date}T00:00:00,scheduled_date.lt.${date}T23:59:59,created_at.gte.${date}T00:00:00,created_at.lt.${date}T23:59:59`)
                .in('status', ['completed', 'confirmed', 'in_progress']);
              
              if (!bookingError && bookingData) {
                sessions = bookingData.filter(b => {
                  const bookingDate = b.scheduled_date || b.created_at;
                  return bookingDate >= `${date}T00:00:00` && bookingDate < `${date}T23:59:59`;
                });
                sessions.forEach(s => {
                  if (s.customer_id) {
                    activeUsers.add(s.customer_id);
                    sessionUserIds.add(s.customer_id);
                  }
                  if (s.designer_id) {
                    activeUsers.add(s.designer_id);
                    sessionUserIds.add(s.designer_id);
                  }
                });
              }
            }
          } catch (err) {
            console.log('Error fetching sessions for date:', date, err);
          }

          // Fetch messages for this date - handle missing table
          let messages = [];
          let messageUserIds = new Set<string>();
          try {
            const { data: messageData, error: messageError } = await supabase
              .from('messages')
              .select('id, created_at, sender_id, receiver_id')
              .gte('created_at', `${date}T00:00:00`)
              .lt('created_at', `${date}T23:59:59`);
            
            if (!messageError && messageData) {
              messages = messageData;
              messageData.forEach(m => {
                if (m.sender_id) {
                  activeUsers.add(m.sender_id);
                  messageUserIds.add(m.sender_id);
                }
                if (m.receiver_id) {
                  activeUsers.add(m.receiver_id);
                  messageUserIds.add(m.receiver_id);
                }
              });
            }
          } catch (err) {
            console.log('Messages table not found for date:', date);
          }

          // Calculate engagement rate: (users with sessions or messages) / total active users
          const engagedUsers = new Set([...sessionUserIds, ...messageUserIds]);
          const engagementRate = activeUsers.size > 0 
            ? (engagedUsers.size / activeUsers.size) * 100 
            : 0;

          return {
            date,
            active_users: activeUsers.size,
            sessions: sessions.length,
            messages: messages.length,
            engagement_rate: engagementRate
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
        ['Date', 'Active Users', 'Sessions', 'Engagement Rate (%)'].join(','),
        ...engagementData.map(d => [
          d.date,
          d.active_users,
          d.sessions,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          {/* Total Messages - Commented out as requested */}
          {/* <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold">{metrics.total_messages}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-pink-600" />
              </div>
            </CardContent>
          </Card> */}
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
                  <th className="text-left p-2">Engagement Rate</th>
                </tr>
              </thead>
              <tbody>
                {engagementData.map((data, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{new Date(data.date).toLocaleDateString()}</td>
                    <td className="p-2">{data.active_users}</td>
                    <td className="p-2">{data.sessions}</td>
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
