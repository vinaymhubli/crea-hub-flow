import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Building, 
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DemoRequest {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company: string | null;
  project_type: string;
  preferred_date: string;
  preferred_time: string;
  message: string | null;
  phone: string | null;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  assigned_to: string | null;
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function DemoRequests() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);

  if (!user || !profile?.is_admin) {
    return <Navigate to="/admin-login" replace />;
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('free_demo_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching demo requests:', error);
      toast.error('Failed to load demo requests');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('free_demo_requests')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Request status updated successfully');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.project_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading demo requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Free Demo Requests</h1>
          <p className="text-gray-600">Manage and track free demo session requests from clients</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, company, or project type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchRequests} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="grid gap-6">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No demo requests found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No demo requests have been submitted yet'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <span>{request.email}</span>
                        </div>
                        {request.company && (
                          <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{request.company}</span>
                          </div>
                        )}
                        {request.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{request.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center space-x-1 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(request.preferred_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{request.preferred_time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Project Type:</span>
                      <span className="text-gray-600 capitalize">{request.project_type.replace('-', ' ')}</span>
                    </div>
                    {request.message && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{request.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Submitted: {new Date(request.created_at).toLocaleString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        View Details
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateRequestStatus(request.id, 'scheduled')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Schedule
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateRequestStatus(request.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {request.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
