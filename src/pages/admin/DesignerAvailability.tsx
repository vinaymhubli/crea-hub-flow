
import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Search, Users, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DesignerWithAvailability {
  id: string;
  user_id: string;
  specialty: string;
  is_online: boolean | null;
  bio: string | null;
  hourly_rate: number;
  rating: number | null;
  reviews_count: number | null;
  completion_rate: number | null;
  available_for_urgent: boolean | null;
  display_hourly_rate: boolean | null;
  experience_years: number | null;
  location: string | null;
  verification_status: string;
  created_at: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    avatar_url?: string | null;
  } | null;
  availability_settings?: {
    auto_accept_bookings: boolean;
    buffer_time_minutes: number;
    working_hours_start: string;
    working_hours_end: string;
  } | null;
  upcoming_bookings_count?: number;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DesignerAvailability() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: designers = [], isLoading } = useQuery({
    queryKey: ['admin-designer-availability', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('designers')
        .select(`
          *,
          user:profiles!user_id(first_name, last_name, avatar_url)
        `);

      if (searchTerm) {
        query = query.or(`specialty.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get availability settings and upcoming bookings for each designer
      const designersWithData = await Promise.all(
        (data || []).map(async (designer) => {
          // Get availability settings
          const { data: settings } = await supabase
            .from('designer_availability_settings')
            .select('*')
            .eq('designer_id', designer.id)
            .maybeSingle();

          // Get upcoming bookings count
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('designer_id', designer.id)
            .in('status', ['pending', 'confirmed'])
            .gte('scheduled_date', new Date().toISOString());

          return {
            ...designer,
            availability_settings: settings,
            upcoming_bookings_count: count || 0
          };
        })
      );

      return designersWithData as DesignerWithAvailability[];
    },
  });

  const { data: weeklySchedules = [] } = useQuery({
    queryKey: ['admin-weekly-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designer_weekly_schedule')
        .select('*')
        .order('designer_id')
        .order('day_of_week');
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: specialDays = [] } = useQuery({
    queryKey: ['admin-special-days'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designer_special_days')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date');
      
      if (error) throw error;
      return data || [];
    },
  });

  const toggleDesignerOnlineStatus = async (designerId: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from('designers')
        .update({ is_online: !currentStatus })
        .eq('id', designerId);

      if (error) throw error;
      
      // Refetch data
      window.location.reload();
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const getDesignerSchedule = (designerId: string) => {
    return weeklySchedules.filter(schedule => schedule.designer_id === designerId);
  };

  const getDesignerSpecialDays = (designerId: string) => {
    return specialDays.filter(day => day.designer_id === designerId);
  };

  const filteredDesigners = designers.filter(designer => {
    const fullName = `${designer.user?.first_name || ''} ${designer.user?.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           designer.specialty.toLowerCase().includes(searchTerm.toLowerCase());
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
            <h1 className="text-3xl font-bold">Designer Availability</h1>
            <p className="text-muted-foreground">Manage designer schedules and availability settings</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {filteredDesigners.length} designer{filteredDesigners.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search designers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDesigners.map((designer) => {
            const schedule = getDesignerSchedule(designer.id);
            const upcomingSpecialDays = getDesignerSpecialDays(designer.id);
            
            return (
              <Card key={designer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={designer.user?.avatar_url || undefined} />
                        <AvatarFallback>
                          {designer.user?.first_name?.[0]}{designer.user?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {designer.user?.first_name} {designer.user?.last_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{designer.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={designer.is_online ? 'default' : 'secondary'}>
                        {designer.is_online ? 'Online' : 'Offline'}
                      </Badge>
                      <Switch
                        checked={designer.is_online || false}
                        onCheckedChange={() => toggleDesignerOnlineStatus(designer.id, designer.is_online)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Availability Settings */}
                  {designer.availability_settings && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                        <Settings className="w-3 h-3" />
                        Settings
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Auto Accept:</span>
                          <Badge variant={designer.availability_settings.auto_accept_bookings ? 'default' : 'secondary'} className="text-xs">
                            {designer.availability_settings.auto_accept_bookings ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Buffer Time:</span>
                          <span className="font-medium">{designer.availability_settings.buffer_time_minutes}min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Working Hours:</span>
                          <span className="font-medium">
                            {designer.availability_settings.working_hours_start} - {designer.availability_settings.working_hours_end}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upcoming Bookings */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Upcoming Bookings
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total upcoming:</span>
                      <Badge variant="outline" className="text-xs">
                        {designer.upcoming_bookings_count || 0}
                      </Badge>
                    </div>
                  </div>

                  {/* Weekly Schedule */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Weekly Schedule
                    </h4>
                    {schedule.length > 0 ? (
                      <div className="space-y-1">
                        {schedule.map((day) => (
                          <div key={day.id} className="flex justify-between text-xs">
                            <span className="font-medium">{daysOfWeek[day.day_of_week]}:</span>
                            <span className={day.is_available ? 'text-green-600' : 'text-muted-foreground'}>
                              {day.is_available ? `${day.start_time} - ${day.end_time}` : 'Unavailable'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No schedule set</p>
                    )}
                  </div>

                  {/* Special Days */}
                  {upcomingSpecialDays.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Special Days</h4>
                      <div className="space-y-1">
                        {upcomingSpecialDays.slice(0, 3).map((day) => (
                          <div key={day.id} className="flex justify-between text-xs">
                            <span>{new Date(day.date).toLocaleDateString()}</span>
                            <Badge 
                              variant={day.is_available ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {day.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </div>
                        ))}
                        {upcomingSpecialDays.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{upcomingSpecialDays.length - 3} more special days
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="w-4 h-4 mr-1" />
                      Manage Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDesigners.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No designers found</h3>
              <p>No designers match your search criteria.</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
