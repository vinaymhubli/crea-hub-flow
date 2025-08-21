import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle, Pause, StopCircle, Users, Clock, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ActiveSession {
  id: string;
  customer: string;
  designer: string;
  service: string;
  startTime: string;
  duration: number;
  status: 'active' | 'paused' | 'ending';
  amount: number;
}

export default function SessionControl() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([
    {
      id: '1',
      customer: 'John Smith',
      designer: 'Sarah Johnson',
      service: 'UI/UX Consultation',
      startTime: '2024-01-15T14:30:00Z',
      duration: 45,
      status: 'active',
      amount: 120
    },
    {
      id: '2',
      customer: 'Emily Davis',
      designer: 'Mike Chen',
      service: 'Web Development',
      startTime: '2024-01-15T13:00:00Z',
      duration: 90,
      status: 'active',
      amount: 180
    }
  ]);

  const pauseSession = (sessionId: string) => {
    setActiveSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'paused' as const }
          : session
      )
    );
  };

  const resumeSession = (sessionId: string) => {
    setActiveSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'active' as const }
          : session
      )
    );
  };

  const endSession = (sessionId: string) => {
    setActiveSessions(prev => 
      prev.filter(session => session.id !== sessionId)
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Session Control
          </h1>
          <p className="text-muted-foreground">Monitor and manage active design sessions</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <PlayCircle className="h-4 w-4" />
          {activeSessions.filter(s => s.status === 'active').length} Active Sessions
        </Badge>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <PlayCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSessions.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Sessions</CardTitle>
            <Pause className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSessions.filter(s => s.status === 'paused').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(activeSessions.reduce((acc, s) => acc + s.duration, 0))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Revenue</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${activeSessions.reduce((acc, s) => acc + s.amount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Live Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Designer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.customer}</TableCell>
                  <TableCell>{session.designer}</TableCell>
                  <TableCell>{session.service}</TableCell>
                  <TableCell>{formatDuration(session.duration)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      session.status === 'active' ? 'default' :
                      session.status === 'paused' ? 'secondary' : 'destructive'
                    }>
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${session.amount}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {session.status === 'active' ? (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => pauseSession(session.id)}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => resumeSession(session.id)}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => endSession(session.id)}
                      >
                        <StopCircle className="h-4 w-4 mr-1" />
                        End
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Session Quality Monitoring */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Session Quality Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">98%</div>
              <p className="text-sm text-muted-foreground">Connection Quality</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">45ms</div>
              <p className="text-sm text-muted-foreground">Average Latency</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">0</div>
              <p className="text-sm text-muted-foreground">Connection Issues</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}