
import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, Clock, Search, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SessionBooking {
  id: string;
  service: string;
  status: string;
  scheduled_date: string;
  duration_hours: number;
  total_amount: number;
  customer_id: string;
  designer_id: string;
  customer: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  designer: {
    user_id: string;
    specialty: string;
    user: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  };
}

export default function SessionControl() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('today');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['admin-sessions', statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!customer_id(first_name, last_name, avatar_url),
          designer:designers!designer_id(
            user_id,
            specialty,
            user:profiles!user_id(first_name, last_name, avatar_url)
          )
        `);

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      switch (statusFilter) {
        case 'today':
          query = query
            .gte('scheduled_date', todayStr)
            .lt('scheduled_date', tomorrowStr);
          break;
        case 'active':
          query = query.eq('status', 'in_progress');
          break;
        case 'upcoming':
          query = query
            .in('status', ['confirmed', 'pending'])
            .gte('scheduled_date', new Date().toISOString());
          break;
        case 'all':
          break;
      }

      if (searchTerm) {
        query = query.or(`service.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      return data as SessionBooking[];
    },
  });

  const updateSessionStatusMutation = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      toast({
        title: "Success",
        description: "Session status updated",
      });
    },
    onError: (error) => {
      console.error('Error updating session status:', error);
      toast({
        title: "Error",
        description: "Failed to update session status",
        variant: "destructive",
      });
    },
  });

  const handleStartSession = (sessionId: string) => {
    updateSessionStatusMutation.mutate({ sessionId, status: 'in_progress' });
  };

  const handlePauseSession = (sessionId: string) => {
    updateSessionStatusMutation.mutate({ sessionId, status: 'paused' });
  };

  const handleEndSession = (sessionId: string) => {
    updateSessionStatusMutation.mutate({ sessionId, status: 'completed' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-800"><Play className="w-3 h-3 mr-1" />Active</Badge>;
      case 'paused':
        return <Badge variant="secondary"><Pause className="w-3 h-3 mr-1" />Paused</Badge>;
      case 'completed':
        return <Badge variant="outline"><Square className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSessionProgress = (session: SessionBooking) => {
    const scheduledTime = new Date(session.scheduled_date);
    const now = new Date();
    const sessionDuration = session.duration_hours * 60 * 60 * 1000; // Convert hours to milliseconds
    const elapsed = now.getTime() - scheduledTime.getTime();
    const progress = Math.min(Math.max((elapsed / sessionDuration) * 100, 0), 100);
    
    return {
      elapsed: Math.max(0, elapsed),
      progress: session.status === 'in_progress' ? progress : 0,
      isOverdue: elapsed > sessionDuration && session.status !== 'completed'
    };
  };

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const filteredSessions = sessions.filter(session => {
    return session.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
           session.customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           session.customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           session.designer.user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           session.designer.user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Session Control</h1>
            <p className="text-muted-foreground">Monitor and manage active design sessions</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-4 py-2">
              {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <TabsContent value={statusFilter} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSessions.map((session) => {
                const progress = getSessionProgress(session);
                
                return (
                  <Card key={session.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{session.service}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.scheduled_date).toLocaleString()} • {session.duration_hours}h session
                          </p>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Participants */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Customer</h4>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={session.customer.avatar_url} />
                              <AvatarFallback>
                                {session.customer.first_name?.[0]}{session.customer.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {session.customer.first_name} {session.customer.last_name}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Designer</h4>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={session.designer.user.avatar_url} />
                              <AvatarFallback>
                                {session.designer.user.first_name?.[0]}{session.designer.user.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {session.designer.user.first_name} {session.designer.user.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{session.designer.specialty}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Session Progress */}
                      {session.status === 'in_progress' && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-sm text-muted-foreground">Progress</h4>
                            <span className="text-sm font-medium">
                              {formatDuration(progress.elapsed)} / {session.duration_hours}h
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${progress.isOverdue ? 'bg-red-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(progress.progress, 100)}%` }}
                            />
                          </div>
                          {progress.isOverdue && (
                            <p className="text-xs text-red-500 mt-1">Session is overdue</p>
                          )}
                        </div>
                      )}

                      {/* Session Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium ml-2">${session.total_amount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium ml-2">{session.duration_hours}h</span>
                        </div>
                      </div>

                      {/* Session Controls */}
                      <div className="flex gap-2 pt-4">
                        {session.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartSession(session.id)}
                            disabled={updateSessionStatusMutation.isPending}
                            className="flex-1"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start Session
                          </Button>
                        )}
                        
                        {session.status === 'in_progress' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePauseSession(session.id)}
                              disabled={updateSessionStatusMutation.isPending}
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Pause
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEndSession(session.id)}
                              disabled={updateSessionStatusMutation.isPending}
                              className="flex-1"
                            >
                              <Square className="w-4 h-4 mr-1" />
                              End Session
                            </Button>
                          </>
                        )}
                        
                        {session.status === 'paused' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStartSession(session.id)}
                              disabled={updateSessionStatusMutation.isPending}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Resume
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEndSession(session.id)}
                              disabled={updateSessionStatusMutation.isPending}
                              className="flex-1"
                            >
                              <Square className="w-4 h-4 mr-1" />
                              End Session
                            </Button>
                          </>
                        )}

                        {session.status === 'completed' && (
                          <Button size="sm" variant="outline" className="w-full" disabled>
                            <Square className="w-4 h-4 mr-1" />
                            Session Completed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredSessions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Calendar className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No sessions found</h3>
                  <p>No sessions match your current filters.</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
