import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, DollarSign, UserCheck, Settings, MessageSquare, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminStats {
  total_users: number;
  total_designers: number;
  total_bookings: number;
  pending_bookings: number;
  completed_bookings: number;
  total_revenue: number;
}

interface User {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  user_type: string;
  is_admin: boolean;
  created_at: string;
}

interface Booking {
  id: string;
  customer_id: string;
  designer_id: string;
  service: string;
  status: string;
  total_amount: number;
  scheduled_date: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  const fetchAdminData = async () => {
    try {
      setLoadingData(true);

      // Fetch admin stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
      if (statsError) throw statsError;
      setStats(statsData as unknown as AdminStats);

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (usersError) throw usersError;
      setUsers(usersData);

      // Fetch all bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (bookingsError) throw bookingsError;
      setBookings(bookingsData);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const updateUserStatus = async (userId: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin })
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success(`User ${isAdmin ? 'promoted to' : 'removed from'} admin`);
      fetchAdminData();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const StatCard = ({ title, value, description, icon: Icon, trend, trendValue }: any) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {trend && (
            <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/60" />
    </Card>
  );

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, bookings, and system overview</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            description="Registered users"
            icon={Users}
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Active Designers"
            value={stats?.total_designers || 0}
            description="Available designers"
            icon={UserCheck}
            trend="up"
            trendValue="+8%"
          />
          <StatCard
            title="Total Bookings"
            value={stats?.total_bookings || 0}
            description={`${stats?.pending_bookings || 0} pending`}
            icon={Calendar}
            trend="up"
            trendValue="+23%"
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats?.total_revenue || 0}`}
            description="From completed bookings"
            icon={DollarSign}
            trend="up"
            trendValue="+15%"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">System Health</h3>
                <p className="text-sm text-muted-foreground">All systems operational</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">{bookings.length} recent bookings</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold">Pending Reviews</h3>
                <p className="text-sm text-muted-foreground">{stats?.pending_bookings || 0} items need attention</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and admin privileges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.first_name || user.last_name 
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : 'No name'
                          }
                        </TableCell>
                        <TableCell>{user.email || 'No email'}</TableCell>
                        <TableCell>
                          <Badge variant={user.user_type === 'designer' ? 'default' : 'secondary'}>
                            {user.user_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_admin ? 'destructive' : 'outline'}>
                            {user.is_admin ? 'Admin' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatus(user.user_id, !user.is_admin)}
                            disabled={user.user_id === profile?.user_id}
                          >
                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>
                  Overview of all bookings in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.service}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              booking.status === 'completed' ? 'default' :
                              booking.status === 'confirmed' ? 'secondary' :
                              booking.status === 'pending' ? 'outline' : 'destructive'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${booking.total_amount}</TableCell>
                        <TableCell>
                          {new Date(booking.scheduled_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(booking.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>Monthly user registration trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-8 w-8 mx-auto mb-2" />
                      <p>Analytics dashboard coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                      <p>Chart visualization in development</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div>
                    <h3 className="font-medium">User Registration</h3>
                    <p className="text-sm text-muted-foreground">Allow new users to register</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Manage email notification settings</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div>
                    <h3 className="font-medium">Payment Settings</h3>
                    <p className="text-sm text-muted-foreground">Configure payment processing</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div>
                    <h3 className="font-medium">Security Settings</h3>
                    <p className="text-sm text-muted-foreground">Manage authentication and security</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}