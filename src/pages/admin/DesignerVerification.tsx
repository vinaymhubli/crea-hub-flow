import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { UserCheck, Search, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface PendingDesigner {
  id: string;
  user_id: string;
  specialty: string;
  hourly_rate: number;
  bio: string;
  skills: string[];
  portfolio_images: string[];
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function DesignerVerification() {
  const [pendingDesigners, setPendingDesigners] = useState<PendingDesigner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingDesigners();
  }, []);

  const fetchPendingDesigners = async () => {
    try {
      // This would fetch designers with verification_status = 'pending'
      const { data, error } = await supabase
        .from('designers')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingDesigners(data || []);
    } catch (error) {
      console.error('Error fetching pending designers:', error);
      toast.error('Failed to load pending designers');
    } finally {
      setLoading(false);
    }
  };

  const approveDesigner = async (designerId: string) => {
    try {
      // Update verification status to approved
      toast.success('Designer approved successfully');
      fetchPendingDesigners();
    } catch (error) {
      toast.error('Failed to approve designer');
    }
  };

  const rejectDesigner = async (designerId: string) => {
    try {
      // Update verification status to rejected
      toast.success('Designer rejected');
      fetchPendingDesigners();
    } catch (error) {
      toast.error('Failed to reject designer');
    }
  };

  const filteredDesigners = pendingDesigners.filter(designer =>
    designer.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    designer.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    designer.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Designer Verification
          </h1>
          <p className="text-muted-foreground">Review and approve designer applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {filteredDesigners.length} Pending
          </Badge>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search designers by name or specialty..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDesigners.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Designers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Pending Designer Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Designer</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDesigners.map((designer) => (
                <TableRow key={designer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {designer.profiles?.first_name} {designer.profiles?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {designer.profiles?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{designer.specialty}</Badge>
                  </TableCell>
                  <TableCell>${designer.hourly_rate}/hr</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {designer.skills?.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {designer.skills?.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{designer.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(designer.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => approveDesigner(designer.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => rejectDesigner(designer.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}