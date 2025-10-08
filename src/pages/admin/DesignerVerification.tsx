
import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Search, Filter, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DesignerWithProfile {
  id: string;
  user_id: string;
  specialty: string;
  hourly_rate: number;
  bio: string;
  location: string;
  skills: string[];
  portfolio_images: string[];
  verification_status: string;
  experience_years: number;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    blocked?: boolean;
  };
}

export default function DesignerVerification() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: designers = [], isLoading } = useQuery({
    queryKey: ['admin-designers', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('designers')
        .select(`
          *,
          user:profiles!user_id(first_name, last_name, email, avatar_url)
        `);

      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data as DesignerWithProfile[];
    },
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async ({ designerId, status }: { designerId: string; status: string }) => {
      const { error } = await supabase
        .from('designers')
        .update({ verification_status: status })
        .eq('id', designerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-designers'] });
      toast({
        title: "Success",
        description: "Designer verification status updated",
      });
    },
    onError: (error) => {
      console.error('Error updating verification status:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (designerId: string) => {
    updateVerificationMutation.mutate({ designerId, status: 'approved' });
  };

  const handleReject = async (designerId: string) => {
    try {
      // First update the designer status to rejected
      await updateVerificationMutation.mutateAsync({ designerId, status: 'rejected' });
      
      // Then block the user account
      const { error: blockError } = await supabase
        .from('profiles')
        .update({
          blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_reason: 'Account rejected by admin'
        } as Record<string, unknown>)
        .eq('user_id', designerId);
      
      if (blockError) {
        console.error('Error blocking user:', blockError);
        toast({
          title: "Warning",
          description: "Designer rejected but blocking failed. Please check manually.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Designer rejected and account blocked successfully.",
        });
      }
    } catch (error) {
      console.error('Error rejecting designer:', error);
    }
  };

  const handleBlockDesigner = async (designerId: string) => {
    try {
      // Block the user account
      const { error: blockError } = await supabase
        .from('profiles')
        .update({
          blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_reason: 'Account blocked by admin'
        } as Record<string, unknown>)
        .eq('user_id', designerId);
      
      if (blockError) {
        console.error('Error blocking user:', blockError);
        toast({
          title: "Error",
          description: "Failed to block designer account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Designer account blocked successfully.",
        });
        // Refresh the data
        queryClient.invalidateQueries({ queryKey: ['admin-designers'] });
      }
    } catch (error) {
      console.error('Error blocking designer:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredDesigners = designers.filter(designer => {
    const matchesSearch = designer.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designer.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designer.user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designer.user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designer.user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
    // <AdminLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Designer Verification</h1>
            <p className="text-muted-foreground">Review and approve designer applications</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-4 py-2">
              {filteredDesigners.length} designer{filteredDesigners.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            
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

          <TabsContent value={statusFilter} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDesigners.map((designer) => (
                <Card key={designer.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={designer.user.avatar_url} />
                          <AvatarFallback>
                            {designer.user.first_name?.[0]}{designer.user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {designer.user.first_name} {designer.user.last_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{designer.user.email}</p>
                        </div>
                      </div>
                      {getStatusBadge(designer.verification_status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Specialty</h4>
                      <p className="font-medium">{designer.specialty}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Per Minute Rate</h4>
                      <p className="font-medium">₹{designer.hourly_rate}/min</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Experience</h4>
                      <p className="font-medium">{designer.experience_years || 0} years</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Location</h4>
                      <p className="font-medium">{designer.location || 'Not specified'}</p>
                    </div>

                    {designer.skills && designer.skills.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {designer.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {designer.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{designer.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {designer.bio && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Bio</h4>
                        <p className="text-sm line-clamp-3">{designer.bio}</p>
                      </div>
                    )}

                    {designer.portfolio_images && designer.portfolio_images.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Portfolio</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {designer.portfolio_images.slice(0, 3).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Portfolio ${index + 1}`}
                              className="w-full h-16 object-cover rounded border"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 space-y-2">
                      {designer.verification_status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(designer.id)}
                            disabled={updateVerificationMutation.isPending}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(designer.id)}
                            disabled={updateVerificationMutation.isPending}
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {designer.verification_status !== 'pending' && (
                        <div className="flex gap-2">
                          {designer.verification_status === 'approved' && (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(designer.id)}
                                disabled={updateVerificationMutation.isPending}
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleBlockDesigner(designer.id)}
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Block
                              </Button>
                            </>
                          )}
                          
                          {designer.verification_status === 'rejected' && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(designer.id)}
                              disabled={updateVerificationMutation.isPending}
                              className="flex-1"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-1" />
                        View Full Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDesigners.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Filter className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No designers found</h3>
                  <p>No designers match your current filters.</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    // </AdminLayout>
  );
}
