import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Megaphone, 
  TrendingUp, 
  Target, 
  AlertCircle,
  ExternalLink,
  Clock,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Promotion {
  id: string;
  title: string;
  description?: string;
  promotion_type: string;
  discount_type?: string;
  discount_value?: number;
  discount_code?: string;
  banner_image_url?: string;
  banner_text_color: string;
  banner_background_color: string;
  cta_text: string;
  cta_url?: string;
  start_date: string;
  end_date?: string;
  target_audience: string;
  priority: number;
}

interface PromotionBannerProps {
  location?: string;
  className?: string;
}

export function PromotionBanner({ location = 'homepage', className = '' }: PromotionBannerProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchPromotions();
  }, [location, profile]);

  // Map user_type to target_audience format
  const mapUserTypeToTargetAudience = (userType?: string): string => {
    if (!userType) return 'all';
    
    switch (userType) {
      case 'client':
        return 'customers';
      case 'designer':
        return 'designers';
      case 'admin':
        return 'all'; // Admins see all promotions
      default:
        return 'all';
    }
  };

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const targetAudience = mapUserTypeToTargetAudience(profile?.user_type);
      const { data, error } = await (supabase as any).rpc('get_active_promotions', {
        p_location: location,
        p_user_type: targetAudience
      });

      if (error) throw error;
      setPromotions((data || []) as Promotion[]);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'discount': return <TrendingUp className="w-5 h-5" />;
      case 'offer': return <Target className="w-5 h-5" />;
      case 'announcement': return <Megaphone className="w-5 h-5" />;
      case 'banner': return <AlertCircle className="w-5 h-5" />;
      default: return <Megaphone className="w-5 h-5" />;
    }
  };

  const getPromotionBadgeColor = (type: string) => {
    switch (type) {
      case 'discount': return 'bg-green-100 text-green-800';
      case 'offer': return 'bg-blue-100 text-blue-800';
      case 'announcement': return 'bg-purple-100 text-purple-800';
      case 'banner': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDiscountValue = (promotion: Promotion) => {
    if (!promotion.discount_type || !promotion.discount_value) return '';
    
    switch (promotion.discount_type) {
      case 'percentage':
        return `${promotion.discount_value}% OFF`;
      case 'fixed_amount':
        return `₹${promotion.discount_value} OFF`;
      case 'free_service':
        return 'FREE SERVICE';
      default:
        return '';
    }
  };

  const isPromotionExpiring = (promotion: Promotion) => {
    if (!promotion.end_date) return false;
    const endDate = new Date(promotion.end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
  };

  const activePromotions = promotions
    .sort((a, b) => b.priority - a.priority);

  if (loading || activePromotions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {activePromotions.map((promotion) => (
        <Card 
          key={promotion.id} 
          className="relative overflow-hidden border-2"
          style={{
            backgroundColor: promotion.banner_background_color,
            borderColor: promotion.banner_text_color + '20'
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-full"
                  style={{ backgroundColor: promotion.banner_text_color + '20' }}
                >
                  {getPromotionIcon(promotion.promotion_type)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 
                      className="font-semibold text-lg"
                      style={{ color: promotion.banner_text_color }}
                    >
                      {promotion.title}
                    </h3>
                    <Badge className={getPromotionBadgeColor(promotion.promotion_type)}>
                      {promotion.promotion_type}
                    </Badge>
                    {promotion.discount_code && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Code: {promotion.discount_code}
                      </Badge>
                    )}
                    {isPromotionExpiring(promotion) && (
                      <Badge className="bg-red-100 text-red-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                  
                  {promotion.description && (
                    <p 
                      className="text-sm opacity-90"
                      style={{ color: promotion.banner_text_color }}
                    >
                      {promotion.description}
                    </p>
                  )}
                  
                  {formatDiscountValue(promotion) && (
                    <div className="mt-2">
                      <Badge 
                        className="bg-white text-black font-bold"
                        style={{ 
                          backgroundColor: promotion.banner_text_color + '20',
                          color: promotion.banner_text_color 
                        }}
                      >
                        {formatDiscountValue(promotion)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {promotion.cta_url && (
                <Button
                  size="sm"
                  className="font-medium"
                  style={{
                    backgroundColor: promotion.banner_text_color,
                    color: promotion.banner_background_color
                  }}
                  onClick={() => window.open(promotion.cta_url, '_blank')}
                >
                  {promotion.cta_text}
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Banner Image */}
            {promotion.banner_image_url && (
              <div className="mt-4 w-full flex justify-center">
                <img
                  src={promotion.banner_image_url}
                  alt={promotion.title}
                  className="max-w-full max-h-64 w-auto h-auto object-contain rounded-lg"
                />
              </div>
            )}

            {/* Expiry Warning */}
            {isPromotionExpiring(promotion) && (
              <div className="mt-3 p-2 bg-red-100 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800 font-medium">
                    This promotion expires on {new Date(promotion.end_date!).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default PromotionBanner;
