import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User,
  Calendar,
  FileText,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DesignerSidebar } from '@/components/DesignerSidebar';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface Complaint {
  id: string;
  session_id: string;
  booking_id: string;
  customer_id: string;
  designer_id: string;
  file_id: string;
  complaint_type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string;
  file_name: string;
}

export default function DesignerComplaints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_complaints')
        .select(`
          *,
          customer:profiles!customer_complaints_customer_id_fkey(first_name, last_name),
          file:session_files(name)
        `)
        .eq('designer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedComplaints = data?.map(complaint => ({
        ...complaint,
        customer_name: `${complaint.customer?.first_name || ''} ${complaint.customer?.last_name || ''}`.trim(),
        file_name: complaint.file?.name || 'Unknown File'
      })) || [];

      setComplaints(formattedComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getComplaintTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'quality_issue': 'Quality Issue',
      'wrong_file': 'Wrong File',
      'incomplete_work': 'Incomplete Work',
      'late_delivery': 'Late Delivery',
      'communication_issue': 'Communication Issue',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'pending': 'secondary',
      'under_review': 'default',
      'resolved': 'default',
      'rejected': 'destructive'
    };
    return variants[status] || 'default';
  };

  const getPriorityBadge = (priority: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'low': 'outline',
      'medium': 'default',
      'high': 'secondary',
      'urgent': 'destructive'
    };
    return variants[priority] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'under_review':
        return <Eye className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <DesignerSidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-semibold text-gray-900">Complaints</h1>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Customer Complaints</h2>
                  <p className="text-gray-600">View and respond to customer complaints about your work</p>
                </div>
              </div>

              {/* Complaints List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : complaints.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Complaints</h3>
                    <p className="text-gray-600">
                      You haven't received any complaints from customers yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {complaint.title}
                            </h3>
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{complaint.customer_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{complaint.file_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {new Date(complaint.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getStatusBadge(complaint.status)} className="flex items-center gap-1">
                              {getStatusIcon(complaint.status)}
                              {complaint.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getPriorityBadge(complaint.priority)}>
                              {complaint.priority}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Complaint Type</h4>
                            <Badge variant="outline">
                              {getComplaintTypeLabel(complaint.complaint_type)}
                            </Badge>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                            <p className="text-gray-700">{complaint.description}</p>
                          </div>

                          {complaint.admin_notes && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Admin Notes</h4>
                              <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                                {complaint.admin_notes}
                              </p>
                            </div>
                          )}

                          {complaint.resolution && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Resolution</h4>
                              <p className="text-gray-700 bg-green-50 p-3 rounded-lg">
                                {complaint.resolution}
                              </p>
                            </div>
                          )}

                          {complaint.status === 'resolved' && complaint.resolved_at && (
                            <div className="text-sm text-gray-500">
                              Resolved on: {new Date(complaint.resolved_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
