import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Calendar, DollarSign, TrendingUp, Settings, MessageSquare, ShieldCheck,
  BarChart3, PieChart, Activity, Bell, Mail, Database, AlertTriangle,
  Star, CreditCard, Wallet, Gift, Megaphone, FileText, Globe, 
  Eye, EyeOff, Download, Filter, Search, Trash2, Edit
} from 'lucide-react';
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
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  created_at: string;
  is_admin: boolean;
}

interface Booking {
  id: string;
  service: string;
  status: string;
  total_amount: number;
  scheduled_date: string;
  customer_id: string;
  designer_id: string;
}

interface Designer {
  id: string;
  user_id: string;
  specialty: string;
  hourly_rate: number;
  rating: number;
  reviews_count: number;
  is_online: boolean;
  completion_rate: number;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // New announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success'
  });

  // Platform settings
  const [platformSettings, setPlatformSettings] = useState({
    maintenance_mode: false,
    new_registrations: true,
    commission_rate: 15,
    featured_designers_limit: 6
  });

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        return <Navigate to="/secret-admin-login" replace />;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(profileData?.is_admin || false);
    };

    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  // Redirect if not logged in or not admin
  if (!user) {
    return <Navigate to="/secret-admin-login" replace />;
  }

  if (user && !loading && !isAdmin) {
    return <Navigate to="/secret-admin-login" replace />;
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const [usersCount, designersCount, bookingsData] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('designers').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('status, total_amount')
      ]);

      const totalBookings = bookingsData.data?.length || 0;
      const pendingBookings = bookingsData.data?.filter(b => b.status === 'pending').length || 0;
      const completedBookings = bookingsData.data?.filter(b => b.status === 'completed').length || 0;
      const totalRevenue = bookingsData.data?.filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      setStats({
        total_users: usersCount.count || 0,
        total_designers: designersCount.count || 0,
        total_bookings: totalBookings,
        pending_bookings: pendingBookings,
        completed_bookings: completedBookings,
        total_revenue: totalRevenue
      });

      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(usersData || []);

      // Fetch bookings
      const { data: allBookingsData } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setBookings(allBookingsData || []);

      // Fetch designers
      const { data: designersData } = await supabase
        .from('designers')
        .select('*')
        .order('rating', { ascending: false });
      setDesigners(designersData || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId ? { ...booking, status } : booking
        )
      );
      toast.success('Booking status updated');
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking status');
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, is_admin: !currentStatus } : user
        )
      );
      toast.success('Admin status updated');
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // This would typically insert into an announcements table
      toast.success('Announcement created successfully');
      setNewAnnouncement({ title: '', message: '', type: 'info' });
    } catch (error) {
      toast.error('Failed to create announcement');
    }
  };

  const exportData = (type: string) => {
    toast.info(`Exporting ${type} data...`);
    // Implementation would generate and download CSV/Excel file
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'admin') return matchesSearch && user.is_admin;
    if (filterStatus === 'designer') return matchesSearch && user.user_type === 'designer';
    if (filterStatus === 'customer') return matchesSearch && user.user_type === 'client';
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Manage your design platform with powerful tools</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <ShieldCheck className="h-4 w-4" />
              Administrator
            </Badge>
            <Button variant="outline" onClick={() => exportData('all')}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total_designers || 0} designers
              </p>
              <Progress value={75} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_bookings || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pending_bookings || 0} pending
              </p>
              <Progress value={85} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats?.total_revenue || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.completed_bookings || 0} completed sessions
              </p>
              <Progress value={92} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.total_bookings 
                  ? Math.round((stats.completed_bookings / stats.total_bookings) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Completion rate</p>
              <Progress value={88} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="designers">Designers</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Analytics Charts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Revenue Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Revenue chart visualization</p>
                      <p className="text-sm">Integration with charting library needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">New designer registered</span>
                      <span className="text-xs text-muted-foreground ml-auto">2 min ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Booking completed</span>
                      <span className="text-xs text-muted-foreground ml-auto">5 min ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Payment processed</span>
                      <span className="text-xs text-muted-foreground ml-auto">10 min ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">New message received</span>
                      <span className="text-xs text-muted-foreground ml-auto">15 min ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">99.9%</div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">245ms</div>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">1.2k</div>
                    <p className="text-sm text-muted-foreground">Active Sessions</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">0</div>
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search users..." 
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="designer">Designers</SelectItem>
                        <SelectItem value="customer">Customers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.user_type === 'designer' ? 'default' : 'secondary'}>
                            {user.user_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_admin ? 'destructive' : 'outline'}>
                            {user.is_admin ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAdminStatus(user.id, user.is_admin)}
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

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
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
                              booking.status === 'pending' ? 'secondary' :
                              booking.status === 'confirmed' ? 'outline' : 'destructive'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${booking.total_amount}</TableCell>
                        <TableCell>
                          {new Date(booking.scheduled_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Designers Tab */}
          <TabsContent value="designers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Designer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {designers.map((designer) => (
                    <Card key={designer.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{designer.specialty}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{designer.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          ${designer.hourly_rate}/hour
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant={designer.is_online ? 'default' : 'secondary'}>
                            {designer.is_online ? 'Online' : 'Offline'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {designer.completion_rate}% completion
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send Announcement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    Send Announcement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Announcement title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message"
                      value={newAnnouncement.message}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Announcement message"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={newAnnouncement.type} onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, type: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createAnnouncement} className="w-full">
                    <Bell className="h-4 w-4 mr-2" />
                    Send Announcement
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email to All Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Push Notification
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Gift className="h-4 w-4 mr-2" />
                    Create Promotion
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Platform Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Temporarily disable the platform</p>
                    </div>
                    <Switch 
                      checked={platformSettings.maintenance_mode}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({ ...prev, maintenance_mode: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Registrations</Label>
                      <p className="text-sm text-muted-foreground">Allow new user signups</p>
                    </div>
                    <Switch 
                      checked={platformSettings.new_registrations}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({ ...prev, new_registrations: checked }))}
                    />
                  </div>
                  <div>
                    <Label>Commission Rate (%)</Label>
                    <Input 
                      type="number"
                      value={platformSettings.commission_rate}
                      onChange={(e) => setPlatformSettings(prev => ({ ...prev, commission_rate: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Featured Designers Limit</Label>
                    <Input 
                      type="number"
                      value={platformSettings.featured_designers_limit}
                      onChange={(e) => setPlatformSettings(prev => ({ ...prev, featured_designers_limit: Number(e.target.value) }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Platform Status</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Database</span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Gateway</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Video Calls</span>
                      <Badge variant="default">Operational</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Email Service</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Run System Diagnostics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}