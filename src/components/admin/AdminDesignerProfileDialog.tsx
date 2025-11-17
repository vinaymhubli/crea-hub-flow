import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MapPin, Clock, Mail, Phone, Briefcase, Award, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolio } from '@/hooks/usePortfolio';

interface DesignerWithProfile {
  id: string;
  user_id: string;
  specialty: string;
  hourly_rate: number;
  bio: string;
  location: string;
  skills: string[];
  portfolio_images: string[];
  verification_status: string;
  experience_years: number;
  response_time: string;
  is_online: boolean;
  rating: number;
  reviews_count: number;
  completion_rate: number;
  display_hourly_rate: boolean;
  available_for_urgent: boolean;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    phone?: string;
    blocked?: boolean;
  };
}

interface AdminDesignerProfileDialogProps {
  designer: DesignerWithProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminDesignerProfileDialog({
  designer,
  open,
  onOpenChange,
}: AdminDesignerProfileDialogProps) {
  const [services, setServices] = useState<any[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const { fetchPublicPortfolioItems } = usePortfolio();

  useEffect(() => {
    if (open && designer) {
      fetchDesignerData();
    }
  }, [open, designer]);

  const fetchDesignerData = async () => {
    if (!designer) return;

    try {
      setLoading(true);

      // Fetch designer's services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('designer_id', designer.id)
        .eq('is_active', true);

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Fetch designer's portfolio items
      const portfolioData = await fetchPublicPortfolioItems(designer.id);
      setPortfolioItems(portfolioData);
    } catch (error) {
      console.error('Error fetching designer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!designer) return null;

  const designerName = `${designer.user.first_name} ${designer.user.last_name}`.trim() || designer.user.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Full Designer Profile</DialogTitle>
          <DialogDescription>
            Complete profile details for {designerName}
          </DialogDescription>
        </DialogHeader>

        {/* Header Section */}
        <div className="bg-card rounded-lg p-6 mb-4 border">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left - Profile Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={designer.user.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {designer.user.first_name?.[0]}{designer.user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{designerName}</h2>
                  <p className="text-green-600 font-semibold mb-2">{designer.specialty}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    {designer.rating && designer.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{designer.rating}</span>
                        <span className="text-muted-foreground text-sm">
                          ({designer.reviews_count || 0} reviews)
                        </span>
                      </div>
                    )}
                    
                    {designer.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{designer.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{designer.response_time}</span>
                    </div>
                    
                    <Badge variant={designer.is_online ? "default" : "secondary"}>
                      {designer.is_online ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {designer.skills?.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right - Key Info */}
            <div className="md:w-64">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Per Minute Rate</p>
                      <p className="text-2xl font-bold">
                        ₹{designer.hourly_rate}
                        <span className="text-base font-normal text-muted-foreground">/min</span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Experience</p>
                      <p className="font-semibold">{designer.experience_years || 0} years</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                      <p className="font-semibold">{designer.completion_rate || 0}%</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge 
                        variant={
                          designer.verification_status === 'approved' ? 'default' :
                          designer.verification_status === 'pending' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {designer.verification_status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{designer.user.email}</p>
              </div>
              {designer.user.phone && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium">{designer.user.phone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="about">About</TabsTrigger>
            {/* Services tab commented out */}
            {/* <TabsTrigger value="services">Services ({services.length})</TabsTrigger> */}
            <TabsTrigger value="portfolio">Portfolio ({portfolioItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  About {designer.user.first_name || 'Designer'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {designer.bio || 'This designer has not added a bio yet.'}
                </p>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Specialty</p>
                    <p className="font-medium">{designer.specialty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="font-medium">{designer.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Experience</p>
                    <p className="font-medium">{designer.experience_years || 0} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Response Time</p>
                    <p className="font-medium">{designer.response_time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Available for Urgent Work</p>
                    <p className="font-medium">{designer.available_for_urgent ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Display Hourly Rate</p>
                    <p className="font-medium">{designer.display_hourly_rate ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services tab content commented out */}
          {/* <TabsContent value="services" className="mt-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      {service.cover_image_url ? (
                        <img
                          src={service.cover_image_url}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">{service.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold">₹{service.price}</div>
                        {service.rating && service.rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{service.rating}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No services available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent> */}

          <TabsContent value="portfolio" className="mt-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : portfolioItems && portfolioItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolioItems.map((item, index) => (
                  <div key={item.id || index} className="group relative aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title || `Portfolio ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="absolute bottom-2 left-2 right-2">
                        <h4 className="text-white font-semibold mb-1 text-sm truncate">{item.title}</h4>
                        {item.category && (
                          <span className="text-white/80 text-xs bg-white/20 px-2 py-1 rounded">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : designer.portfolio_images && designer.portfolio_images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {designer.portfolio_images.map((image, index) => (
                  <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No portfolio items available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

