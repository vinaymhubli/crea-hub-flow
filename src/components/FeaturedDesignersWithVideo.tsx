import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Calendar, 
  Play, 
  ChevronLeft, 
  ChevronRight,
  Crown,
  Users,
  UserCircle,
  CheckCircle,
  Zap,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FeaturedDesigner {
  id: string;
  designer_id: string;
  designer_table_id?: string;
  designer_name: string;
  designer_avatar?: string;
  specialty: string;
  rating: number;
  reviews_count: number;
  hourly_rate: number;
  bio?: string;
  location?: string;
  is_online?: boolean;
  position: number;
  verification_status: string;
  portfolio_items?: any[];
  social_media_links?: any[];
}

interface VideoContent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  youtube_url: string;
  thumbnail_url?: string;
  is_published: boolean;
}

export function FeaturedDesignersWithVideo() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [featuredDesigners, setFeaturedDesigners] = useState<FeaturedDesigner[]>([]);
  const [videoContent, setVideoContent] = useState<VideoContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const fetchFeaturedDesigners = useCallback(async () => {
    try {
      setLoading(true);
      
      // First get featured designers from featured_designers table
      const { data: featuredData, error: featuredError } = await (supabase as any)
        .from('featured_designers')
        .select('designer_id, position')
        .eq('is_active', true)
        .order('position', { ascending: true })
        .limit(6);
      
      if (featuredError) throw featuredError;
      
      if (!featuredData || featuredData.length === 0) {
        setFeaturedDesigners([]);
        return;
      }
      
      // Get designer details from designers table
      const designerIds = featuredData.map(fd => fd.designer_id);
      const { data: designersData, error: designersError } = await supabase
        .from('designers')
        .select(`
          id,
          user_id,
          specialty,
          rating,
          reviews_count,
          hourly_rate,
          bio,
          location,
          is_online,
          verification_status,
          portfolio_images,
          skills
        `)
        .in('user_id', designerIds);
      
      if (designersError) throw designersError;
      
      console.log('Featured data:', featuredData);
      console.log('Designers data:', designersData);
      
      // Get user profiles for names and avatars
      const userIds = designersData?.map(d => d.user_id) || [];
      console.log('User IDs to fetch profiles for:', userIds);
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);
      
      console.log('Profiles data:', profilesData);
      
      // Transform and map data
      const transformedDesigners = featuredData.map((featured, index) => {
        const designer = designersData?.find(d => d.user_id === featured.designer_id);
        const profile = profilesData?.find(p => p.id === featured.designer_id);
        
        if (!designer) return null;
        
        console.log('Featured designer mapping:', {
          featured_designer_id: featured.designer_id,
          designer_user_id: designer.user_id,
          profile_id: profile?.id,
          profile_name: profile ? `${profile.first_name} ${profile.last_name}` : 'No profile'
        });
        
        const designerName = profile ? 
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
          'Unknown Designer';
        
        return {
          id: designer.id,
          designer_id: designer.user_id,
          designer_table_id: designer.id,
          designer_name: designerName || 'Unknown Designer',
          designer_avatar: profile?.avatar_url,
          specialty: designer.specialty || 'Design',
          rating: designer.rating || 0,
          reviews_count: designer.reviews_count || 0,
          hourly_rate: designer.hourly_rate || 0,
          bio: designer.bio || 'Professional designer ready to help with your projects.',
          location: designer.location,
          is_online: designer.is_online || false,
          position: featured.position,
          verification_status: designer.verification_status || 'pending',
          portfolio_items: designer.portfolio_images || [],
          social_media_links: designer.skills || []
        };
      }).filter(Boolean);
      
      setFeaturedDesigners(transformedDesigners);
    } catch (error) {
      console.error("Error fetching featured designers:", error);
      toast({
        title: "Error",
        description: "Failed to load featured designers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchVideoContent = useCallback(async () => {
    try {
      // Fetch video from featured_designer_video table
      const { data, error } = await (supabase as any)
        .from('featured_designer_video')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      
      // Transform to VideoContent format
      const videoContent: VideoContent = {
        id: data.id,
        title: data.title || 'Featured Designers Video',
        subtitle: 'Meet our top designers',
        description: data.description || 'Discover our featured designers',
        youtube_url: data.youtube_url,
        is_published: data.is_active
      };
      
      setVideoContent(videoContent);
    } catch (error) {
      console.error("Error fetching featured designer video:", error);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedDesigners();
    fetchVideoContent();
  }, [fetchFeaturedDesigners, fetchVideoContent]);

  // Auto-play slideshow
  useEffect(() => {
    if (!isAutoPlaying || featuredDesigners.length <= 2) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => 
        prev >= Math.ceil(featuredDesigners.length / 2) - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredDesigners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => 
      prev >= Math.ceil(featuredDesigners.length / 2) - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => 
      prev <= 0 ? Math.ceil(featuredDesigners.length / 2) - 1 : prev - 1
    );
  };

  const handleDesignerClick = (designer: FeaturedDesigner) => {
    if (designer.designer_table_id) {
      navigate(`/designers/${designer.designer_table_id}`);
    }
  };

  const handleMessage = (designer: FeaturedDesigner) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Navigate to messages or open chat
    navigate('/customer-dashboard/messages');
  };

  const handleBook = (designer: FeaturedDesigner) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (designer.designer_table_id) {
      navigate(`/designers/${designer.designer_table_id}?action=book`);
    }
  };

  const handleLiveSession = (designer: FeaturedDesigner) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Handle live session request
    navigate('/customer-dashboard/live-sessions');
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-3 h-3 text-white" />;
      case 2:
        return <Award className="w-3 h-3 text-white" />;
      case 3:
        return <Zap className="w-3 h-3 text-white" />;
      default:
        return <span className="text-xs font-bold">{position}</span>;
    }
  };

  const extractVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnailUrl = (youtubeUrl: string) => {
    const videoId = extractVideoId(youtubeUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  if (loading) {
    return (
      <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Centered Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Featured Designers
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet some of our top-rated designers who consistently deliver exceptional results for clients worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Video Section */}
          <div className="space-y-6">

            {/* Video/Illustration Section */}
            <div className="relative bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl p-8 overflow-hidden h-96">
              {videoContent?.youtube_url ? (
                <div className="relative h-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractVideoId(videoContent.youtube_url)}?autoplay=0&rel=0&modestbranding=1`}
                    title={videoContent.title}
                    className="w-full h-full rounded-2xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-200 to-blue-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  {/* Illustration placeholder - you can replace this with actual illustration */}
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-white font-medium text-lg">Featured Designers Video</p>
                    <p className="text-white/80 text-sm mt-2">Coming Soon</p>
                  </div>
                </div>
              )}
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-green-500/20 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-blue-500/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              {/* Stats Card */}
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Active Designers</div>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Live Now</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Featured Designers Cards */}
          <div className="space-y-6">

            {featuredDesigners.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Featured Designers</h3>
                <p className="text-gray-600 mb-6">Check back later for featured designers</p>
                <Link to="/designers">
                  <Button>Find Designers</Button>
                </Link>
              </Card>
            ) : (
              <div className="relative">
                {/* Designer Cards Container */}
                <div className="overflow-hidden">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%` }}
                  >
                    {Array.from({ length: Math.ceil(featuredDesigners.length / 2) }).map((_, slideIndex) => (
                      <div key={slideIndex} className="w-full flex-shrink-0">
                        <div className="space-y-4">
                          {featuredDesigners
                            .slice(slideIndex * 2, slideIndex * 2 + 2)
                            .map((designer) => (
                              <Card
                                key={designer.id}
                                className="group hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white hover:border-green-200 overflow-hidden h-40"
                              >
                                <CardContent className="p-6 h-full flex flex-col">
                                  <div className="flex items-start justify-between flex-1">
                                    {/* Left Section - Profile */}
                                    <div className="flex items-start space-x-4 flex-1">
                                      <div className="relative flex-shrink-0">
                                        {designer.designer_avatar ? (
                                          <img
                                            src={designer.designer_avatar}
                                            alt={designer.designer_name}
                                            className="w-20 h-20 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-xl">
                                            {(designer.designer_name || 'D').split(' ').map(n => n[0]).join('').toUpperCase()}
                                          </div>
                                        )}
                                        {designer.is_online && (
                                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                        )}
                                        {designer.position <= 3 && (
                                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                            <Crown className="w-3 h-3 text-white" />
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <h4 className="font-bold text-gray-900 text-lg truncate">
                                            {designer.designer_name || 'Unknown Designer'}
                                          </h4>
                                          {designer.verification_status === 'verified' && (
                                            <div className="flex items-center space-x-1 flex-shrink-0">
                                              <CheckCircle className="w-4 h-4 text-green-500" />
                                              <span className="text-xs text-green-600 font-medium">Verified</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        <p className="text-gray-600 font-medium mb-2 truncate">{designer.specialty || 'Design'}</p>
                                        
                                        <div className="flex items-center space-x-1 mb-2">
                                          <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />
                                          <span className="text-sm font-medium text-gray-700">{designer.rating || 0}</span>
                                          <span className="text-sm text-gray-500">({designer.reviews_count || 0})</span>
                                          <span className="text-sm text-green-600 font-medium ml-2">
                                            {designer.is_online ? 'Online' : 'Offline'}
                                          </span>
                                        </div>
                                        
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                          {designer.bio || "Professional designer ready to help with your projects."}
                                        </p>
                                        
                                        <div className="flex flex-wrap gap-1 mb-3">
                                          {(designer.social_media_links || []).slice(0, 6).map((skill, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-700">
                                              {skill}
                                            </Badge>
                                          ))}
                                        </div>
                                        
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                          <div className="flex items-center space-x-1">
                                            <Award className="w-3 h-3 text-yellow-500" />
                                            <span>Top Rated</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <Clock className="w-3 h-3 text-orange-500" />
                                            <span>Fast Responder</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Right Section - Pricing and Actions */}
                                    <div className="text-right ml-4 flex-shrink-0 w-32">
                                      <p className="font-bold text-gray-900 text-lg mb-1">₹{designer.hourly_rate || 0}/min</p>
                                      <p className="text-sm text-gray-500 mb-4">Usually responds in 1 hour</p>
                                      
                                      <div className="space-y-2">
                                        <Button
                                          size="sm"
                                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDesignerClick(designer);
                                          }}
                                        >
                                          View Profile
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMessage(designer);
                                          }}
                                        >
                                          Chat {!user && "(Sign in required)"}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleBook(designer);
                                          }}
                                        >
                                          Book Session {!user && "(Sign in required)"}
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleLiveSession(designer);
                                          }}
                                        >
                                          Live Session {!user && "(Sign in required)"}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {featuredDesigners.length > 2 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </>
                )}

                {/* Dots Indicator */}
                {featuredDesigners.length > 2 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    {Array.from({ length: Math.ceil(featuredDesigners.length / 2) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentSlide ? 'bg-teal-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
