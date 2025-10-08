import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  Crown,
  CheckCircle,
  Users,
  Award,
  MapPin,
  Calendar,
  UserCircle,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BookingDialog } from "./BookingDialog";
import { toast } from "sonner";

interface FeaturedDesigner {
  id: string;
  designer_id: string; // This is the user_id
  designer_table_id?: string; // This will be the actual designers.id
  position: number;
  designer_name: string;
  designer_email: string;
  designer_avatar?: string;
  designer_rating: number;
  designer_specialties: string[];
  designer_experience: number;
  designer_verified: boolean;
  featured_since: string;
}

interface FeaturedDesignersDisplayProps {
  limit?: number;
  showPosition?: boolean;
  className?: string;
}

export function FeaturedDesignersDisplay({
  limit = 10,
  showPosition = true,
  className = "",
}: FeaturedDesignersDisplayProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [featuredDesigners, setFeaturedDesigners] = useState<
    FeaturedDesigner[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchFeaturedDesigners = useCallback(async () => {
    try {
      setLoading(true);
      // @ts-expect-error - get_featured_designers RPC function exists but not in generated types
      const { data, error } = await supabase.rpc("get_featured_designers");
      if (error) throw error;
      
      const designers = ((data as unknown) as FeaturedDesigner[] || []).slice(0, limit);
      
      // Fetch actual designer IDs from designers table
      // designer_id in featured_designers is actually the user_id
      const designersWithTableIds = await Promise.all(
        designers.map(async (designer) => {
          try {
            const { data: designerData, error: designerError } = await supabase
              .from('designers')
              .select('id')
              .eq('user_id', designer.designer_id)
              .single();
            
            if (designerError) {
              console.error('Error fetching designer table id:', designerError);
              return designer;
            }
            
            return {
              ...designer,
              designer_table_id: designerData.id
            };
          } catch (err) {
            console.error('Error mapping designer ID:', err);
            return designer;
          }
        })
      );
      
      console.log('Featured designers with table IDs:', designersWithTableIds);
      setFeaturedDesigners(designersWithTableIds);
    } catch (error) {
      console.error("Error fetching featured designers:", error);
      toast.error("Failed to load featured designers");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFeaturedDesigners();
  }, [fetchFeaturedDesigners]);

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Crown className="w-3 h-3 text-white" />;
    if (position <= 3) return <Award className="w-3 h-3 text-white" />;
    return <Star className="w-3 h-3 text-white" />;
  };

  const getPositionColor = (position: number) => {
    if (position === 1)
      return "bg-gradient-to-r from-green-100 to-teal-100 text-green-800 border-green-300";
    if (position <= 3) return "bg-gradient-to-r from-teal-100 to-blue-100 text-teal-800 border-teal-300";
    return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300";
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, index) => (
            <Card key={index} className="animate-pulse border border-teal-200/30 bg-gradient-to-br from-card via-teal-50/10 to-blue-50/10">
              <div className="h-1.5 bg-gradient-to-r from-green-200 via-teal-200 to-blue-200"></div>
              <CardContent className="p-5">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-14 h-14 bg-teal-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-teal-200 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-teal-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-teal-100 rounded w-20"></div>
                  <div className="h-6 bg-blue-100 rounded w-24"></div>
                </div>
                <div className="h-10 bg-gradient-to-r from-green-200 via-teal-200 to-blue-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (featuredDesigners.length === 0) {
    return (
      <Card className={`${className} border border-teal-200/30 bg-gradient-to-br from-card via-teal-50/10 to-blue-50/10`}>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-100 to-teal-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">No Featured Designers</h3>
          <p className="text-muted-foreground">
            Check back later for featured designers
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 rounded-full flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
            Featured Designers
          </h2>
        </div>
        <Link to="/designers">
          <Button 
            variant="outline" 
            size="sm"
            className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300/50"
          >
            View All Designers
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredDesigners.map((designer) => (
          <Card
            key={designer.id}
            className="group hover:shadow-xl transition-all duration-300 border border-teal-200/30 bg-gradient-to-br from-card via-teal-50/10 to-blue-50/10 hover:border-teal-300 overflow-hidden"
          >
            <div className="h-1.5 bg-gradient-to-r from-green-400 via-teal-500 to-blue-500"></div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {designer.designer_avatar ? (
                      <img
                        src={designer.designer_avatar}
                        alt={designer.designer_name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-teal-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-teal-100 to-blue-100 flex items-center justify-center ring-2 ring-teal-200">
                        <UserCircle className="w-10 h-10 text-teal-600" />
                      </div>
                    )}
                    {designer.position <= 3 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                        {getPositionIcon(designer.position)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg group-hover:bg-gradient-to-r group-hover:from-green-600 group-hover:to-teal-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                      {designer.designer_name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-green-500 fill-current" />
                        <span className="text-sm font-medium ml-1 text-green-700">
                          {designer.designer_rating.toFixed(1)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs border-teal-300 text-teal-700">
                        {designer.designer_experience} years
                      </Badge>
                    </div>
                  </div>
                </div>

                {showPosition && (
                  <div className="flex items-center space-x-2">
                    {getPositionIcon(designer.position)}
                    <Badge className={getPositionColor(designer.position)}>
                      #{designer.position}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Specialties */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1.5">
                  {designer.designer_specialties
                    .slice(0, 3)
                    .map((specialty, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs bg-gradient-to-r from-teal-50 to-blue-50 text-teal-700 border-teal-200"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  {designer.designer_specialties.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200">
                      +{designer.designer_specialties.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Verification Status */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-teal-100">
                <div className="flex items-center space-x-2">
                  {designer.designer_verified ? (
                    <Badge className="bg-gradient-to-r from-green-100 to-teal-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600 border-gray-300">
                      Unverified
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(designer.featured_since).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                {/* View Profile - No auth required */}
                <Link
                  to={`/designer/${designer.designer_table_id || designer.designer_id}`}
                  state={{ 
                    hideGlobalChrome: location.pathname.includes('/customer-dashboard'),
                    fromPath: location.pathname 
                  }}
                  className="w-full"
                  onClick={() => {
                    console.log('Navigating to designer ID:', designer.designer_table_id);
                    console.log('Full designer object:', designer);
                  }}
                >
                  <Button 
                    className="w-full bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 hover:shadow-lg transition-all duration-300 text-white"
                    disabled={!designer.designer_table_id}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </Link>
                
                {/* Book Session - Auth required */}
                {user ? (
                  <BookingDialog 
                    designer={{
                      id: designer.designer_table_id || designer.designer_id,
                      profiles: {
                        first_name: designer.designer_name.split(' ')[0],
                        last_name: designer.designer_name.split(' ').slice(1).join(' '),
                        avatar_url: designer.designer_avatar,
                        email: designer.designer_email
                      },
                      specialty: designer.designer_specialties[0] || 'Designer',
                      hourly_rate: 0, // Will be fetched in the dialog
                      rating: designer.designer_rating
                    }}
                  >
                    <Button 
                      variant="outline"
                      className="w-full hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300"
                      disabled={!designer.designer_table_id}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Session
                    </Button>
                  </BookingDialog>
                ) : (
                  <Button 
                    onClick={() => {
                      toast.info('Please sign in to book a session');
                      navigate('/auth');
                    }}
                    variant="outline"
                    className="w-full hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Session (Sign in required)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default FeaturedDesignersDisplay;
