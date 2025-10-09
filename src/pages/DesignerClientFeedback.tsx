import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Calendar, User, TrendingUp, Award } from 'lucide-react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { DesignerSidebar } from "@/components/DesignerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Review {
  id: string;
  session_id: string;
  customer_id: string;
  designer_name: string;
  rating: number;
  review_text: string | null;
  review_date: string;
  customer_profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    email: string;
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export default function DesignerClientFeedback() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchReviews();
    }
  }, [user?.id]);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Get designer profile first
      const { data: designerData } = await supabase
        .from('designers')
        .select('id, user_id, average_rating, total_reviews')
        .eq('user_id', user?.id)
        .single();

      if (!designerData) {
        console.error('Designer profile not found');
        return;
      }

      // Get designer's name from profiles
      const { data: designerProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user?.id)
        .single();

      const designerName = designerProfile 
        ? `${designerProfile.first_name} ${designerProfile.last_name}`.trim()
        : 'Designer';

      console.log('👤 Designer profile:', designerProfile);
      console.log('👤 Searching for designer name:', designerName);

      // Also try searching by designer_id instead of name
      const { data: allReviews } = await supabase
        .from('session_reviews')
        .select('*');
      
      console.log('📊 All reviews in database:', allReviews);
      console.log('📊 Unique designer names in DB:', [...new Set(allReviews?.map(r => r.designer_name) || [])]);

      // Fetch reviews for sessions where this designer participated
      console.log('🔍 Fetching reviews for designer ID:', designerData.id);
      
      // First, get all session IDs where this designer was involved
      const { data: designerSessions, error: sessionsError } = await supabase
        .from('active_sessions')
        .select('session_id')
        .eq('designer_id', designerData.id);

      if (sessionsError) {
        console.error('❌ Error fetching designer sessions:', sessionsError);
        return;
      }

      console.log('📊 Designer sessions found:', designerSessions);
      
      if (!designerSessions || designerSessions.length === 0) {
        console.log('📊 No sessions found for this designer');
        setReviews([]);
        setStats({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
        return;
      }

      // Get session IDs array
      const sessionIds = designerSessions.map(s => s.session_id);
      console.log('📊 Session IDs to search for reviews:', sessionIds);

      // Now fetch reviews for those sessions
      const { data: reviewsData, error } = await supabase
        .from('session_reviews')
        .select(`
          id,
          session_id,
          customer_id,
          designer_name,
          rating,
          review_text,
          review_date
        `)
        .in('session_id', sessionIds)
        .order('review_date', { ascending: false });

      // Fetch customer profiles separately
      if (reviewsData && reviewsData.length > 0) {
        const customerIds = [...new Set(reviewsData.map(review => review.customer_id))];
        const { data: customerProfiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url, email')
          .in('user_id', customerIds);

        // Map profiles to reviews
        reviewsData.forEach(review => {
          const profile = customerProfiles?.find(p => p.user_id === review.customer_id);
          review.customer_profile = profile;
        });
      }

      if (error) {
        console.error('❌ Error fetching reviews:', error);
        return;
      }

      console.log('📊 Fetched reviews data:', reviewsData);
      console.log('📊 Number of reviews found:', reviewsData?.length || 0);

      // Transform the data
      const transformedReviews: Review[] = (reviewsData || []).map(review => ({
        ...review,
        customer_profile: review.customer_profile
      }));

      setReviews(transformedReviews);

      // Calculate stats
      const totalReviews = transformedReviews.length;
      const averageRating = totalReviews > 0 
        ? Number((transformedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(2))
        : 0;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      transformedReviews.forEach(review => {
        ratingDistribution[review.rating]++;
      });

      setStats({
        totalReviews,
        averageRating,
        ratingDistribution
      });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100';
    if (rating >= 3.5) return 'text-yellow-600 bg-yellow-100';
    if (rating >= 2.5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
          <DesignerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading client feedback...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <DesignerSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Client Feedback</h1>
              <p className="text-xl text-gray-600">See what your clients are saying about your work</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <MessageCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Rating</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                        <Badge className={getRatingColor(stats.averageRating)}>
                          {stats.averageRating >= 4.5 ? 'Excellent' : 
                           stats.averageRating >= 3.5 ? 'Good' : 
                           stats.averageRating >= 2.5 ? 'Fair' : 'Needs Improvement'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">5-Star Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.ratingDistribution[5]}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Satisfaction Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalReviews > 0 
                          ? Math.round(((stats.ratingDistribution[4] + stats.ratingDistribution[5]) / stats.totalReviews) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rating Distribution */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>Rating Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = stats.ratingDistribution[rating];
                    const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 w-16">
                          <span className="text-sm font-medium">{rating}</span>
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <span>Recent Reviews</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet. Complete some sessions to start receiving feedback!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={review.customer_profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold">
                              {review.customer_profile?.first_name?.[0] || 'C'}
                              {review.customer_profile?.last_name?.[0] || ''}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {review.customer_profile?.first_name} {review.customer_profile?.last_name}
                                </h4>
                                <p className="text-sm text-gray-500">{review.customer_profile?.email}</p>
                              </div>
                              <div className="text-right">
                                {renderStars(review.rating)}
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(review.review_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            {review.review_text && (
                              <div className="bg-gray-50 rounded-lg p-4 mt-3">
                                <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>Session ID: {review.session_id}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
