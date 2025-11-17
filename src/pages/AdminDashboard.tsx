
import { useState } from 'react';
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
import { useAdminStats } from '@/hooks/useAdminStats';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAdminPlatformSettings } from '@/hooks/useAdminPlatformSettings';
import { useAdminAnnouncements } from '@/hooks/useAdminAnnouncements';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useAdminStats();
  const { users, loading: usersLoading, toggleAdminStatus } = useAdminUsers();
  const { settings, loading: settingsLoading, updateSettings } = useAdminPlatformSettings();
  const { announcements, loading: announcementsLoading, createAnnouncement } = useAdminAnnouncements();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // New announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success',
    target: 'all'
  });

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      return;
    }

    const result = await createAnnouncement({
      ...newAnnouncement,
      is_active: true
    });
    
    if (result) {
      setNewAnnouncement({ title: '', message: '', type: 'info', target: 'all' });
    }
  };

  const handleSettingsUpdate = (key: string, value: any) => {
    if (settings) {
      updateSettings({ [key]: value });
    }
  };

  const exportData = (type: string) => {
    // Implementation would generate and download CSV/Excel file
    console.log(`Exporting ${type} data...`);
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

  const loading = statsLoading || usersLoading || settingsLoading || announcementsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
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
          {/* <Button variant="outline" onClick={() => exportData('all')}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button> */}
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
            <div className="text-3xl font-bold">₹{stats?.total_revenue || 0}</div>
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
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          {/* <TabsTrigger value="announcements">Announcements</TabsTrigger> */}
          {/* <TabsTrigger value="communications">Communications</TabsTrigger> */}
          {/* <TabsTrigger value="settings">Settings</TabsTrigger> */}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {announcements.slice(0, 4).map((announcement, index) => (
                    <div key={announcement.id} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        announcement.type === 'success' ? 'bg-green-500' :
                        announcement.type === 'warning' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}></div>
                      <span className="text-sm">{announcement.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {settings?.maintenance_mode ? '0%' : '99.9%'}
                    </div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">245ms</div>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">{users.length}</div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">0</div>
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

        {/* Announcements Tab */}
        {/*
        <TabsContent value="announcements" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Button onClick={handleCreateAnnouncement} className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Send Announcement
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {announcements.slice(0, 5).map((announcement) => (
                    <div key={announcement.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <Badge variant={announcement.type === 'success' ? 'default' : 
                                      announcement.type === 'warning' ? 'destructive' : 'secondary'}>
                          {announcement.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{announcement.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <p className="text-sm text-muted-foreground">No announcements yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        */}

        {/* Communications Tab - Commented out */}
        {/*
        <TabsContent value="communications" className="space-y-4">
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
        </TabsContent>
        */}

        {/* Settings Tab - Commented out */}
        {/*
        <TabsContent value="settings" className="space-y-4">
          {settings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      checked={settings.maintenance_mode}
                      onCheckedChange={(checked) => handleSettingsUpdate('maintenance_mode', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Registrations</Label>
                      <p className="text-sm text-muted-foreground">Allow new user signups</p>
                    </div>
                    <Switch 
                      checked={settings.new_registrations}
                      onCheckedChange={(checked) => handleSettingsUpdate('new_registrations', checked)}
                    />
                  </div>
                  <div>
                    <Label>Commission Rate (%)</Label>
                    <Input 
                      type="number"
                      value={settings.commission_rate}
                      onChange={(e) => handleSettingsUpdate('commission_rate', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Featured Designers Limit</Label>
                    <Input 
                      type="number"
                      value={settings.featured_designers_limit}
                      onChange={(e) => handleSettingsUpdate('featured_designers_limit', Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

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
                      <Badge variant={settings.maintenance_mode ? 'destructive' : 'default'}>
                        {settings.maintenance_mode ? 'Maintenance' : 'Online'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>New Registrations</span>
                      <Badge variant={settings.new_registrations ? 'default' : 'secondary'}>
                        {settings.new_registrations ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission Rate</span>
                      <Badge variant="outline">{settings.commission_rate}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Featured Limit</span>
                      <Badge variant="outline">{settings.featured_designers_limit}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Run System Diagnostics
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        */}
      </Tabs>
    </div>
  );
}
