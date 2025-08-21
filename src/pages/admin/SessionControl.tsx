import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, Eye, MessageCircle, Phone, Video, Clock, DollarSign, Users, Search, Filter, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// Dummy data for active sessions
const dummySessions = [
  {
    id: '1',
    sessionId: 'SES-2024-001',
    status: 'active',
    startTime: '2024-01-19T10:00:00Z',
    duration: 120, // minutes
    elapsed: 45, // minutes
    client: {
      name: 'John Smith',
      email: 'john.smith@techcorp.com',
      avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
      company: 'Tech Corp'
    },
    designer: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
      specialty: 'UI/UX Design'
    },
    service: 'Website Redesign Consultation',
    amount: 170,
    hourlyRate: 85,
    roomId: 'room_001',
    participants: 2,
    isRecording: true,
    connectionQuality: 'excellent',
    lastActivity: '2024-01-19T10:43:00Z'
  },
  {
    id: '2',
    sessionId: 'SES-2024-002',
    status: 'paused',
    startTime: '2024-01-19T09:30:00Z',
    duration: 60,
    elapsed: 30,
    client: {
      name: 'Emily Davis',
      email: 'emily.davis@startup.com',
      avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
      company: 'StartUp Inc'
    },
    designer: {
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
      specialty: 'Graphic Design'
    },
    service: 'Logo Design Review',
    amount: 95,
    hourlyRate: 95,
    roomId: 'room_002',
    participants: 2,
    isRecording: false,
    connectionQuality: 'good',
    lastActivity: '2024-01-19T10:00:00Z'
  },
  {
    id: '3',
    sessionId: 'SES-2024-003',
    status: 'active',
    startTime: '2024-01-19T11:00:00Z',
    duration: 180,
    elapsed: 90,
    client: {
      name: 'David Wilson',
      email: 'david.wilson@agency.com',
      avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
      company: 'Design Agency'
    },
    designer: {
      name: 'Alex Rodriguez',
      email: 'alex.rodriguez@email.com',
      avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
      specialty: 'Mobile App Design'
    },
    service: 'Mobile App UI Consultation',
    amount: 240,
    hourlyRate: 80,
    roomId: 'room_003',
    participants: 3,
    isRecording: true,
    connectionQuality: 'poor',
    lastActivity: '2024-01-19T12:28:00Z'
  },
  {
    id: '4',
    sessionId: 'SES-2024-004',
    status: 'ended',
    startTime: '2024-01-19T08:00:00Z',
    duration: 90,
    elapsed: 90,
    client: {
      name: 'Lisa Anderson',
      email: 'lisa.anderson@retail.com',
      avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
      company: 'Retail Co'
    },
    designer: {
      name: 'Emma Williams',
      email: 'emma.williams@email.com',
      avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
      specialty: 'Web Design'
    },
    service: 'E-commerce Website Review',
    amount: 97.5,
    hourlyRate: 65,
    roomId: 'room_004',
    participants: 2,
    isRecording: false,
    connectionQuality: 'excellent',
    lastActivity: '2024-01-19T09:30:00Z'
  }
];

export default function SessionControl() {
  const [sessions, setSessions] = useState(dummySessions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [sessionToTerminate, setSessionToTerminate] = useState<any>(null);

  const handleSessionAction = (sessionId: string, action: string) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              status: action === 'pause' ? 'paused' : action === 'resume' ? 'active' : action === 'terminate' ? 'ended' : session.status
            }
          : session
      )
    );
    toast.success(`Session ${action}d successfully`);
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.designer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
          Active
        </Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Pause className="h-3 w-3 mr-1" />
          Paused
        </Badge>;
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <Square className="h-3 w-3 mr-1" />
          Ended
        </Badge>;
      default:
        return null;
    }
  };

  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateProgress = (elapsed: number, duration: number) => {
    return Math.min((elapsed / duration) * 100, 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Session Control</h1>
          <p className="text-muted-foreground">Monitor and manage live design sessions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
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
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600">
                  {sessions.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paused Sessions</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {sessions.filter(s => s.status === 'paused').length}
                </p>
              </div>
              <Pause className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold text-primary">
                  {sessions.filter(s => s.status === 'active').reduce((acc, s) => acc + s.participants, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Today</p>
                <p className="text-2xl font-bold text-foreground">
                  ${sessions.reduce((acc, s) => acc + s.amount, 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Live Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div key={session.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(session.status)}
                      <Badge variant="outline" className="text-xs">
                        {session.sessionId}
                      </Badge>
                    </div>
                    <div className={`text-sm ${getConnectionQualityColor(session.connectionQuality)}`}>
                      Connection: {session.connectionQuality}
                    </div>
                    {session.connectionQuality === 'poor' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session.isRecording && (
                      <Badge variant="outline" className="mr-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                        Recording
                      </Badge>
                    )}
                    ${session.amount}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.client.avatar} alt={session.client.name} />
                      <AvatarFallback>{session.client.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{session.client.name}</p>
                      <p className="text-sm text-muted-foreground">{session.client.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.designer.avatar} alt={session.designer.name} />
                      <AvatarFallback>{session.designer.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{session.designer.name}</p>
                      <p className="text-sm text-muted-foreground">{session.designer.specialty}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Service:</span>
                    <span>{session.service}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{formatDuration(session.elapsed)} / {formatDuration(session.duration)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Participants:</span>
                    <span>{session.participants}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress:</span>
                    <span>{Math.round(calculateProgress(session.elapsed, session.duration))}%</span>
                  </div>
                  <Progress value={calculateProgress(session.elapsed, session.duration)} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedSession(session)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Session Details - {session.sessionId}</DialogTitle>
                        </DialogHeader>
                        {selectedSession && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Client Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p><span className="text-muted-foreground">Name:</span> {selectedSession.client.name}</p>
                                  <p><span className="text-muted-foreground">Email:</span> {selectedSession.client.email}</p>
                                  <p><span className="text-muted-foreground">Company:</span> {selectedSession.client.company}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Designer Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p><span className="text-muted-foreground">Name:</span> {selectedSession.designer.name}</p>
                                  <p><span className="text-muted-foreground">Email:</span> {selectedSession.designer.email}</p>
                                  <p><span className="text-muted-foreground">Specialty:</span> {selectedSession.designer.specialty}</p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Session Details</h4>
                                <div className="space-y-1 text-sm">
                                  <p><span className="text-muted-foreground">Service:</span> {selectedSession.service}</p>
                                  <p><span className="text-muted-foreground">Room ID:</span> {selectedSession.roomId}</p>
                                  <p><span className="text-muted-foreground">Started:</span> {new Date(selectedSession.startTime).toLocaleString()}</p>
                                  <p><span className="text-muted-foreground">Recording:</span> {selectedSession.isRecording ? 'Yes' : 'No'}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Financial Details</h4>
                                <div className="space-y-1 text-sm">
                                  <p><span className="text-muted-foreground">Hourly Rate:</span> ${selectedSession.hourlyRate}</p>
                                  <p><span className="text-muted-foreground">Total Amount:</span> ${selectedSession.amount}</p>
                                  <p><span className="text-muted-foreground">Duration:</span> {formatDuration(selectedSession.duration)}</p>
                                  <p><span className="text-muted-foreground">Elapsed:</span> {formatDuration(selectedSession.elapsed)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    {session.status === 'active' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/session/${session.roomId}`, '_blank')}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {session.status === 'active' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSessionAction(session.id, 'pause')}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {session.status === 'paused' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSessionAction(session.id, 'resume')}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {(session.status === 'active' || session.status === 'paused') && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setSessionToTerminate(session);
                          setShowTerminateDialog(true);
                        }}
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Terminate Session Dialog */}
      <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate this session? This action cannot be undone and will end the session immediately for all participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (sessionToTerminate) {
                  handleSessionAction(sessionToTerminate.id, 'terminate');
                  setShowTerminateDialog(false);
                  setSessionToTerminate(null);
                }
              }}
            >
              Terminate Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}