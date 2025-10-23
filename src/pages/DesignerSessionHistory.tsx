import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  History, 
  Download,
  Search,
  Filter,
  Video,
  MessageCircle,
  Star,
  FileText,
  Play,
  Eye,
  MapPin,
  MoreVertical
} from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DesignerSidebar } from "@/components/DesignerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function DesignerSessionHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("recent");
  
  const { sessions, stats, loading, error } = useSessionHistory();
  const { user } = useAuth();
  const exportReport = () => {
    try {
      const header = [
        'Session ID',
        'Date',
        'Type',
        'Session Name',
        'Minutes',
        'Earnings',
        'Rating',
        'Review'
      ];

      const rows = sessions.map((s) => [
        s.id,
        s.date,
        s.type,
        s.project,
        String(s.durationMinutes ?? ''),
        String(s.earnings ?? ''),
        s.rating != null ? String(s.rating) : '',
        // Quote review to protect commas/newlines
        s.feedback ? `"${String(s.feedback).replace(/"/g, '""')}"` : ''
      ]);

      const csv = [header, ...rows]
        .map((r) => r.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `designer_session_report_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export report:', e);
    }
  };

  // Real client feedback pulled from session_reviews
  const [reviews, setReviews] = useState<Array<{
    id: string;
    session_id: string;
    rating: number;
    review_text: string | null;
    review_date: string;
    customer_profile?: { first_name?: string | null; last_name?: string | null };
  }>>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      if (!user?.id) return;
      try {
        setReviewsLoading(true);
        setReviewsError(null);

        // 1) Get designer id for current user
        const { data: designerRow, error: dErr } = await supabase
          .from('designers')
          .select('id, user_id')
          .eq('user_id', user.id)
          .single();
        if (dErr || !designerRow) {
          setReviews([]);
          return;
        }

        // 2) Get sessions for this designer
        const { data: designerSessions, error: sErr } = await supabase
          .from('active_sessions')
          .select('session_id')
          .eq('designer_id', designerRow.id);
        if (sErr || !designerSessions || designerSessions.length === 0) {
          setReviews([]);
          return;
        }

        const sessionIds = designerSessions.map(s => s.session_id);

        // 3) Pull reviews for those sessions
        const { data: reviewsData, error: rErr } = await supabase
          .from('session_reviews')
          .select('id, session_id, rating, review_text, review_date, customer_id')
          .in('session_id', sessionIds)
          .order('review_date', { ascending: false });

        // 3b) Fallback: also fetch by designer_name match (simple mapping requested)
        // Resolve the designer's full name from profiles
        let fullName: string | null = null;
        if (designerRow.user_id) {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', designerRow.user_id)
            .single();
          if (profileRow) {
            const maybe = `${profileRow.first_name || ''} ${profileRow.last_name || ''}`.trim();
            fullName = maybe || null;
          }
        }

        let reviewsByName: any[] = [];
        if (fullName) {
          const { data: nameData } = await supabase
            .from('session_reviews')
            .select('id, session_id, rating, review_text, review_date, customer_id, designer_name')
            .eq('designer_name', fullName)
            .order('review_date', { ascending: false });
          reviewsByName = nameData || [];
        }

        const combined = [ ...(reviewsData || []), ...reviewsByName ];
        if (rErr || combined.length === 0) {
          setReviews([]);
          return;
        }

        // 4) Fetch customer profiles for names
        const customerIds = Array.from(new Set(combined.map(r => r.customer_id)));
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', customerIds);

        const result = combined.map(r => ({
          id: r.id,
          session_id: r.session_id,
          rating: r.rating,
          review_text: r.review_text,
          review_date: r.review_date,
          customer_profile: profilesData?.find(p => p.user_id === (r as any).customer_id) || undefined,
        }));

        setReviews(result);
      } catch (e: any) {
        setReviewsError(e?.message || 'Failed to load reviews');
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [user?.id]);

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
          <DesignerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading session history...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
          <DesignerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600">Error: {error}</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderSessionCard = (session: any) => (
    <Card key={session.id} className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
          <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <AvatarImage src={session.client.avatar} />
              <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold text-sm sm:text-base">
                {session.client.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base truncate">{session.project}</h3>
              <p className="text-gray-600 font-medium text-sm truncate">{session.client.name}</p>
              <p className="text-xs sm:text-sm text-gray-500">{session.date}</p>
              
              {/* Show rating if available */}
              {session.rating && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-0.5 sm:space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                          star <= session.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">({session.rating}/5)</span>
                </div>
              )}
              
              {/* Show feedback if available */}
              {session.feedback && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs sm:text-sm text-gray-700 line-clamp-2">
                  "{session.feedback}"
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 self-start">
            {getStatusBadge(session.status)}
            {/* 3-dots menu commented out per request */}
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {session.hasRecording && (
                  <DropdownMenuItem>
                    <Play className="w-4 h-4 mr-2" />
                    Watch Recording
                  </DropdownMenuItem>
                )}
                {session.hasNotes && (
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    View Notes
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600 truncate">{session.date}</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600 truncate">{session.duration}</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {session.type === 'Video Call' ? (
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            ) : (
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm text-gray-600 truncate">{session.type}</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-green-600">₹{session.earnings}</span>
          </div>
        </div>

        {session.rating && (
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    i < session.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs sm:text-sm text-gray-600">({session.rating}/5)</span>
          </div>
        )}

        {session.feedback && (
          <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-blue-800 italic line-clamp-2">"{session.feedback}"</p>
          </div>
        )}

        {/* Tools used + action buttons commented out per request */}
        {/* <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Tools used:</span>
              <div className="flex space-x-1">
                {session.tools.map((tool: string) => (
                  <Badge key={tool} variant="outline" className="text-xs">{tool}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {session.hasRecording && (
              <Button variant="outline" size="sm">
                <Play className="w-4 h-4 mr-1" />
                Recording
              </Button>
            )}
            {session.hasNotes && (
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-1" />
                Notes
              </Button>
            )}
          </div>
        </div> */}
      </CardContent>
    </Card>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          <DashboardHeader
            title="Session History"
            subtitle="Track your past design sessions and performance"
            icon={<History className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            additionalInfo={
              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1 text-xs sm:text-sm">
                <span className="text-white/90 font-medium">{stats.totalSessions} sessions</span>
                <span className="text-white/60 hidden sm:inline">•</span>
                <span className="text-white/90 font-medium">{stats.totalHours.toFixed(1)} hours</span>
                <span className="text-white/60 hidden sm:inline">•</span>
                <span className="text-white/90 font-medium">{stats.avgRating.toFixed(1)} ⭐ avg rating</span>
              </div>
            }
          />

          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Real Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Sessions</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{Math.max(0, stats.totalHours).toFixed(1)}h</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Hours</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Avg. Rating</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{Math.round(stats.totalEarnings)}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by client name or project..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-green-400 focus:ring-green-200 text-sm"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 border-gray-200 text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="border-gray-200 w-full sm:w-auto text-sm">
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">More Filters</span>
                  <span className="sm:hidden">Filters</span>
                </Button>
              </div>
            </div>

            {/* Enhanced Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-1.5 sm:p-2 mb-6 sm:mb-8 overflow-x-auto">
                <TabsList className="grid w-full grid-cols-2 bg-transparent gap-1.5 sm:gap-2 min-w-max sm:min-w-0">
                  <TabsTrigger 
                    value="recent"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl py-2 sm:py-3 px-6 sm:px-8 font-semibold text-xs sm:text-sm whitespace-nowrap"
                  >
                    Recent Sessions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="feedback"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl py-2 sm:py-3 px-6 sm:px-8 font-semibold text-xs sm:text-sm whitespace-nowrap"
                  >
                    Client Feedback
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="recent" className="space-y-4 sm:space-y-6">
                {sessions.map(renderSessionCard)}
              </TabsContent>

              <TabsContent value="feedback" className="space-y-4 sm:space-y-6">
                {reviewsLoading ? (
                  <div className="text-sm text-gray-500 px-2">Loading feedback…</div>
                ) : reviewsError ? (
                  <div className="text-sm text-red-600 px-2">{reviewsError}</div>
                ) : reviews.length === 0 ? (
                  <div className="text-sm text-gray-500 px-2">No client feedback yet.</div>
                ) : (
                  reviews.map((review) => (
                    <Card key={review.id} className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
                          <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarImage src={undefined} />
                              <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold text-sm sm:text-base">
                                {(review.customer_profile?.first_name || 'C').slice(0,1)}
                                {(review.customer_profile?.last_name || '').slice(0,1)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base truncate">Live Design Session</h3>
                              <p className="text-gray-600 font-medium text-sm truncate">{`${review.customer_profile?.first_name || ''} ${review.customer_profile?.last_name || ''}`.trim() || 'Customer'}</p>
                              <p className="text-xs sm:text-sm text-gray-500">{new Date(review.review_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 self-start">
                            <div className="flex items-center space-x-0.5 sm:space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 sm:w-5 sm:h-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-base sm:text-lg font-semibold text-gray-700">({review.rating}/5)</span>
                          </div>
                        </div>

                        {review.review_text && (
                          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                            <p className="text-gray-800 italic text-sm sm:text-base lg:text-lg leading-relaxed">"{review.review_text}"</p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            <span className="text-xs sm:text-sm text-gray-500">Session ID:</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-700 break-all">{review.session_id}</span>
                          </div>
                          {/* Reply to Feedback button commented out per request */}
                          {/* <Button variant="outline" size="sm">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Reply to Feedback
                          </Button> */}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}