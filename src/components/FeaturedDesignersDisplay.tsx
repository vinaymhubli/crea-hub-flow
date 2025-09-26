import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Crown, 
  CheckCircle, 
  Users, 
  Award,
  MapPin,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface FeaturedDesigner {
  id: string;
  designer_id: string;
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
  className = '' 
}: FeaturedDesignersDisplayProps) {
  const [featuredDesigners, setFeaturedDesigners] = useState<FeaturedDesigner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedDesigners();
  }, []);

  const fetchFeaturedDesigners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_featured_designers');
      if (error) throw error;
      setFeaturedDesigners((data || []).slice(0, limit));
    } catch (error) {
      console.error('Error fetching featured designers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (position <= 3) return <Award className="w-5 h-5 text-orange-500" />;
    return <Star className="w-5 h-5 text-blue-500" />;
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (position <= 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: limit }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (featuredDesigners.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Featured Designers</h3>
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
        <div className="flex items-center space-x-2">
          <Crown className="w-6 h-6 text-yellow-600" />
          <h2 className="text-2xl font-bold">Featured Designers</h2>
        </div>
        <Link to="/designers">
          <Button variant="outline" size="sm">
            View All Designers
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredDesigners.map((designer) => (
          <Card 
            key={designer.id} 
            className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500 hover:border-l-yellow-600"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={designer.designer_avatar || '/placeholder-avatar.png'}
                    alt={designer.designer_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-yellow-600 transition-colors">
                      {designer.designer_name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium ml-1">
                          {designer.designer_rating.toFixed(1)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
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
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {designer.designer_specialties.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {designer.designer_specialties.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{designer.designer_specialties.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Verification Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {designer.designer_verified ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600">
                      Unverified
                    </Badge>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Featured since {new Date(designer.featured_since).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Link to={`/designer/${designer.designer_id}`} className="flex-1">
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                    View Profile
                  </Button>
                </Link>
                <Link to={`/book-session/${designer.designer_id}`}>
                  <Button variant="outline" size="sm">
                    Book Session
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Designers Stats */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {featuredDesigners.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Featured Designers
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {featuredDesigners.filter(d => d.designer_verified).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Verified Designers
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {featuredDesigners.reduce((sum, d) => sum + d.designer_experience, 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Experience (years)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FeaturedDesignersDisplay;
