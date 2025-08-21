import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Search, Calendar as CalendarIcon, Users, MapPin, Star, Settings, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

// Dummy data for designer availability
const dummyDesigners = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    specialty: 'UI/UX Design',
    location: 'New York, USA',
    avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
    isOnline: true,
    isAvailable: true,
    rating: 4.8,
    hourlyRate: 85,
    totalHours: 240,
    completedSessions: 48,
    responseTime: '< 1 hour',
    workingHours: {
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false }
    },
    upcomingBookings: [
      { date: '2024-01-20', time: '10:00', client: 'Tech Corp', duration: 2 },
      { date: '2024-01-22', time: '14:00', client: 'StartUp Inc', duration: 1 }
    ],
    timezone: 'EST (UTC-5)'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    specialty: 'Graphic Design',
    location: 'San Francisco, USA',
    avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
    isOnline: false,
    isAvailable: true,
    rating: 4.9,
    hourlyRate: 95,
    totalHours: 180,
    completedSessions: 36,
    responseTime: '< 2 hours',
    workingHours: {
      monday: { start: '10:00', end: '18:00', enabled: true },
      tuesday: { start: '10:00', end: '18:00', enabled: true },
      wednesday: { start: '10:00', end: '18:00', enabled: true },
      thursday: { start: '10:00', end: '18:00', enabled: true },
      friday: { start: '10:00', end: '16:00', enabled: true },
      saturday: { start: '11:00', end: '15:00', enabled: true },
      sunday: { start: '11:00', end: '15:00', enabled: false }
    },
    upcomingBookings: [
      { date: '2024-01-21', time: '11:00', client: 'Design Studio', duration: 3 }
    ],
    timezone: 'PST (UTC-8)'
  },
  {
    id: '3',
    name: 'Emma Williams',
    email: 'emma.williams@email.com',
    specialty: 'Web Design',
    location: 'London, UK',
    avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
    isOnline: true,
    isAvailable: false,
    rating: 4.2,
    hourlyRate: 65,
    totalHours: 120,
    completedSessions: 24,
    responseTime: '< 3 hours',
    workingHours: {
      monday: { start: '08:00', end: '16:00', enabled: true },
      tuesday: { start: '08:00', end: '16:00', enabled: true },
      wednesday: { start: '08:00', end: '16:00', enabled: true },
      thursday: { start: '08:00', end: '16:00', enabled: true },
      friday: { start: '08:00', end: '16:00', enabled: true },
      saturday: { start: '09:00', end: '13:00', enabled: false },
      sunday: { start: '09:00', end: '13:00', enabled: false }
    },
    upcomingBookings: [],
    timezone: 'GMT (UTC+0)'
  },
  {
    id: '4',
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@email.com',
    specialty: 'Mobile App Design',
    location: 'Toronto, Canada',
    avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
    isOnline: true,
    isAvailable: true,
    rating: 4.6,
    hourlyRate: 80,
    totalHours: 200,
    completedSessions: 40,
    responseTime: '< 1 hour',
    workingHours: {
      monday: { start: '09:30', end: '17:30', enabled: true },
      tuesday: { start: '09:30', end: '17:30', enabled: true },
      wednesday: { start: '09:30', end: '17:30', enabled: true },
      thursday: { start: '09:30', end: '17:30', enabled: true },
      friday: { start: '09:30', end: '17:30', enabled: true },
      saturday: { start: '10:00', end: '14:00', enabled: true },
      sunday: { start: '10:00', end: '14:00', enabled: false }
    },
    upcomingBookings: [
      { date: '2024-01-19', time: '15:00', client: 'Mobile First', duration: 2 },
      { date: '2024-01-23', time: '10:00', client: 'App Innovators', duration: 1 }
    ],
    timezone: 'EST (UTC-5)'
  }
];

export default function DesignerAvailability() {
  const [designers, setDesigners] = useState(dummyDesigners);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDesigner, setSelectedDesigner] = useState<any>(null);

  const toggleAvailability = (designerId: string) => {
    setDesigners(prev => 
      prev.map(designer => 
        designer.id === designerId 
          ? { ...designer, isAvailable: !designer.isAvailable }
          : designer
      )
    );
    toast.success('Designer availability updated');
  };

  const filteredDesigners = designers.filter(designer => {
    const matchesSearch = designer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designer.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designer.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'online') matchesStatus = designer.isOnline;
    else if (statusFilter === 'available') matchesStatus = designer.isAvailable;
    else if (statusFilter === 'busy') matchesStatus = !designer.isAvailable;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (designer: any) => {
    if (!designer.isAvailable) {
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Busy</Badge>;
    }
    if (designer.isOnline) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Offline</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Designer Availability</h1>
          <p className="text-muted-foreground">Monitor and manage designer schedules and availability</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search designers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Designers</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Designers</p>
                <p className="text-2xl font-bold text-foreground">{designers.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Now</p>
                <p className="text-2xl font-bold text-green-600">
                  {designers.filter(d => d.isOnline).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-blue-600">
                  {designers.filter(d => d.isAvailable).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Busy</p>
                <p className="text-2xl font-bold text-red-600">
                  {designers.filter(d => !d.isAvailable).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Designers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDesigners.map((designer) => (
          <Card key={designer.id} className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={designer.avatar} alt={designer.name} />
                      <AvatarFallback>{designer.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    {designer.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{designer.name}</h3>
                    <p className="text-sm text-muted-foreground">{designer.specialty}</p>
                  </div>
                </div>
                {getStatusBadge(designer)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Location:</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {designer.location}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium">${designer.hourlyRate}/hr</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rating:</span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {designer.rating}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Response Time:</span>
                <span>{designer.responseTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Availability:</span>
                <Switch
                  checked={designer.isAvailable}
                  onCheckedChange={() => toggleAvailability(designer.id)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Upcoming Bookings:</p>
                {designer.upcomingBookings.length > 0 ? (
                  <div className="space-y-1">
                    {designer.upcomingBookings.slice(0, 2).map((booking: any, index: number) => (
                      <div key={index} className="text-xs p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-3 w-3" />
                          {booking.date} at {booking.time}
                        </div>
                        <div className="text-muted-foreground">{booking.client} ({booking.duration}h)</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No upcoming bookings</p>
                )}
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedDesigner(designer)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Manage {designer?.name}'s Schedule</DialogTitle>
                  </DialogHeader>
                  {selectedDesigner && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Working Hours</h4>
                          <div className="space-y-2">
                            {Object.entries(selectedDesigner.workingHours).map(([day, hours]: [string, any]) => (
                              <div key={day} className="flex items-center justify-between text-sm">
                                <span className="capitalize">{day}:</span>
                                <div className="flex items-center gap-2">
                                  <span className={hours.enabled ? 'text-foreground' : 'text-muted-foreground'}>
                                    {hours.enabled ? `${hours.start} - ${hours.end}` : 'Off'}
                                  </span>
                                  <Switch checked={hours.enabled} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Statistics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Total Hours:</span>
                              <span>{selectedDesigner.totalHours}h</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Completed Sessions:</span>
                              <span>{selectedDesigner.completedSessions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Timezone:</span>
                              <span>{selectedDesigner.timezone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Calendar View</h4>
                        <Calendar mode="single" className="rounded-md border" />
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}