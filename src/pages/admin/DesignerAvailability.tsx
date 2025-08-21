import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, Activity } from 'lucide-react';

export default function DesignerAvailability() {
  const [designers, setDesigners] = useState([
    {
      id: '1',
      name: 'Sarah Johnson',
      specialty: 'UI/UX Design',
      status: 'online',
      nextAvailable: '2024-01-15T14:00:00Z',
      weeklyHours: 32,
      bookedHours: 24
    },
    {
      id: '2', 
      name: 'Mike Chen',
      specialty: 'Web Development',
      status: 'busy',
      nextAvailable: '2024-01-16T09:00:00Z',
      weeklyHours: 40,
      bookedHours: 38
    }
  ]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Designer Availability
          </h1>
          <p className="text-muted-foreground">Monitor designer schedules and availability</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Available designers</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Session</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Currently busy</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Today</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Total sessions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Weekly Schedule Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Calendar integration coming soon</p>
              <p className="text-sm">Full schedule view with drag & drop functionality</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Designer List */}
      <Card>
        <CardHeader>
          <CardTitle>Designer Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {designers.map((designer) => (
              <div key={designer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{designer.name}</h3>
                    <p className="text-sm text-muted-foreground">{designer.specialty}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge variant={designer.status === 'online' ? 'default' : 'secondary'}>
                    {designer.status}
                  </Badge>
                  
                  <div className="text-sm text-muted-foreground">
                    <div>Next: {new Date(designer.nextAvailable).toLocaleTimeString()}</div>
                    <div>Utilization: {Math.round((designer.bookedHours / designer.weeklyHours) * 100)}%</div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    View Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}