import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Search, Filter, Eye, FileText, Star, MapPin } from 'lucide-react';
import { toast } from 'sonner';

// Dummy data for designer applications
const dummyApplications = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    specialty: 'UI/UX Design',
    experience: '5 years',
    location: 'New York, USA',
    portfolio: 'https://sarahjohnson.portfolio.com',
    status: 'pending',
    appliedDate: '2024-01-15',
    avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
    bio: 'Passionate UI/UX designer with expertise in mobile and web applications.',
    skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research'],
    portfolio_images: [
      'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400',
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400'
    ],
    documents: ['Certificate of Design', 'Portfolio PDF', 'Resume'],
    rating: 4.8,
    hourlyRate: 85
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    specialty: 'Graphic Design',
    experience: '7 years',
    location: 'San Francisco, USA',
    portfolio: 'https://michaelchen.design',
    status: 'approved',
    appliedDate: '2024-01-10',
    avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
    bio: 'Creative graphic designer specializing in brand identity and print design.',
    skills: ['Adobe Creative Suite', 'Branding', 'Print Design', 'Logo Design'],
    portfolio_images: [
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
      'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400'
    ],
    documents: ['Design Degree', 'Portfolio', 'References'],
    rating: 4.9,
    hourlyRate: 95
  },
  {
    id: '3',
    name: 'Emma Williams',
    email: 'emma.williams@email.com',
    specialty: 'Web Design',
    experience: '3 years',
    location: 'London, UK',
    portfolio: 'https://emmawilliams.dev',
    status: 'rejected',
    appliedDate: '2024-01-08',
    avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
    bio: 'Modern web designer with a focus on responsive and accessible designs.',
    skills: ['HTML/CSS', 'JavaScript', 'React', 'Responsive Design'],
    portfolio_images: [
      'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400'
    ],
    documents: ['Web Design Certificate', 'Portfolio'],
    rating: 4.2,
    hourlyRate: 65
  },
  {
    id: '4',
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@email.com',
    specialty: 'Mobile App Design',
    experience: '4 years',
    location: 'Toronto, Canada',
    portfolio: 'https://alexrodriguez.mobile',
    status: 'pending',
    appliedDate: '2024-01-12',
    avatar: '/lovable-uploads/33257a77-a6e4-46e6-ae77-b94b22a97d58.png',
    bio: 'Mobile app designer with extensive experience in iOS and Android platforms.',
    skills: ['Figma', 'Sketch', 'Principle', 'Mobile UI', 'User Testing'],
    portfolio_images: [
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
      'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400'
    ],
    documents: ['Mobile Design Portfolio', 'App Store Screenshots'],
    rating: 4.6,
    hourlyRate: 80
  }
];

export default function DesignerVerification() {
  const [applications, setApplications] = useState(dummyApplications);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus }
          : app
      )
    );
    toast.success(`Application ${newStatus} successfully`);
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Designer Verification</h1>
          <p className="text-muted-foreground">Review and approve designer applications</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
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
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
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
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold text-foreground">{applications.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {applications.filter(app => app.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {applications.filter(app => app.status === 'approved').length}
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
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {applications.filter(app => app.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Designer Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div key={application.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={application.avatar} alt={application.name} />
                      <AvatarFallback>{application.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{application.name}</h3>
                      <p className="text-sm text-muted-foreground">{application.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{application.specialty}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {application.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">${application.hourlyRate}/hr</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{application.rating}</span>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(application.status)} flex items-center gap-1`}>
                      {getStatusIcon(application.status)}
                      {application.status}
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Designer Application Review</DialogTitle>
                        </DialogHeader>
                        {selectedApplication && (
                          <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="profile">Profile</TabsTrigger>
                              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                              <TabsTrigger value="documents">Documents</TabsTrigger>
                            </TabsList>
                            <TabsContent value="profile" className="space-y-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={selectedApplication.avatar} alt={selectedApplication.name} />
                                  <AvatarFallback>{selectedApplication.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-xl font-semibold">{selectedApplication.name}</h3>
                                  <p className="text-muted-foreground">{selectedApplication.email}</p>
                                  <p className="text-sm text-muted-foreground">{selectedApplication.location}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Specialty</label>
                                  <p className="text-muted-foreground">{selectedApplication.specialty}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Experience</label>
                                  <p className="text-muted-foreground">{selectedApplication.experience}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Hourly Rate</label>
                                  <p className="text-muted-foreground">${selectedApplication.hourlyRate}/hr</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Applied Date</label>
                                  <p className="text-muted-foreground">{selectedApplication.appliedDate}</p>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Bio</label>
                                <p className="text-muted-foreground">{selectedApplication.bio}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Skills</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {selectedApplication.skills.map((skill: string, index: number) => (
                                    <Badge key={index} variant="outline">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            </TabsContent>
                            <TabsContent value="portfolio" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                {selectedApplication.portfolio_images.map((image: string, index: number) => (
                                  <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden">
                                    <img 
                                      src={image} 
                                      alt={`Portfolio ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                              <div>
                                <label className="text-sm font-medium">Portfolio Website</label>
                                <p className="text-primary hover:underline cursor-pointer">{selectedApplication.portfolio}</p>
                              </div>
                            </TabsContent>
                            <TabsContent value="documents" className="space-y-4">
                              <div className="space-y-2">
                                {selectedApplication.documents.map((doc: string, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <span>{doc}</span>
                                    </div>
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                          </Tabs>
                        )}
                        <div className="flex justify-end gap-2 mt-6">
                          <Button 
                            variant="outline"
                            onClick={() => handleStatusChange(selectedApplication.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button 
                            onClick={() => handleStatusChange(selectedApplication.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}