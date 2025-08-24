import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookingDialog } from '@/components/BookingDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, MessageCircle, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DesignerProfile {
  id: string;
  user_id: string;
  specialty: string;
  hourly_rate: number;
  portfolio_images: string[];
  response_time: string;
  location: string;
  skills: string[];
  bio: string;
  is_online: boolean;
  completion_rate: number;
  reviews_count: number;
  rating: number;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  email?: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  cover_image_url: string;
  rating: number;
  reviews_count: number;
  delivery_time_days: number;
}

const DesignerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [designer, setDesigner] = useState<DesignerProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    if (id) {
      fetchDesignerDetails();
    }
  }, [id]);

  const fetchDesignerDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch designer data
      const { data: designerData, error: designerError } = await supabase
        .from('designers')
        .select('*')
        .eq('id', id)
        .single();

      if (designerError) throw designerError;

      // Fetch profile data separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, email')
        .eq('user_id', designerData.user_id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      // Combine designer and profile data
      const combinedData = {
        ...designerData,
        first_name: profileData?.first_name,
        last_name: profileData?.last_name,
        avatar_url: profileData?.avatar_url,
        email: profileData?.email
      };

      setDesigner(combinedData);

      // Fetch designer's services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('designer_id', id)
        .eq('is_active', true);

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

    } catch (error) {
      console.error('Error fetching designer details:', error);
      toast.error('Failed to load designer details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!designer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Designer not found</h1>
          <Link to="/designers" className="text-green-600 hover:underline">
            Back to designers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          onClick={() => {
            if (location.state?.fromProfile) {
              navigate('/designer-dashboard/profile');
            } else {
              navigate('/designers');
            }
          }}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {location.state?.fromProfile ? 'Back to Profile' : 'Back to Designers'}
        </Button>

        {/* Header Section */}
        <div className="bg-card rounded-3xl p-8 mb-8 shadow-lg border border-border">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left - Profile Info */}
            <div className="flex-1">
              <div className="flex items-start gap-6 mb-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={designer.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {(() => {
                        const firstName = designer.first_name || '';
                        const lastName = designer.last_name || '';
                        const email = designer.email || '';
                        
                        if (firstName && lastName) {
                          return `${firstName[0]}${lastName[0]}`.toUpperCase();
                        } else if (firstName) {
                          return firstName.slice(0, 2).toUpperCase();
                        } else if (email) {
                          return email.slice(0, 2).toUpperCase();
                        }
                        return 'D';
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  {designer.is_online && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                      <span className="text-xs text-white font-bold">●</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {(() => {
                      const firstName = designer.first_name || '';
                      const lastName = designer.last_name || '';
                      const email = designer.email || '';
                      
                      if (firstName && lastName) {
                        return `${firstName} ${lastName}`;
                      } else if (firstName) {
                        return firstName;
                      } else if (email) {
                        return email.split('@')[0];
                      }
                      return 'Designer';
                    })()}
                  </h1>
                  <p className="text-green-600 font-semibold text-lg mb-1">{designer.specialty}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {designer.email || 'Email not available'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{designer.rating}</span>
                      <span className="text-muted-foreground">({designer.reviews_count} reviews)</span>
                    </div>
                    
                    {designer.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{designer.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Responds in {designer.response_time}</span>
                    </div>
                    
                    <Badge variant={designer.is_online ? "default" : "secondary"}>
                      {designer.is_online ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {designer.skills?.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right - Actions */}
            <div className="lg:w-80">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-foreground mb-1">
                      ${designer.hourly_rate}
                      <span className="text-lg font-normal text-muted-foreground">/hour</span>
                    </div>
                    <p className="text-muted-foreground">Starting from</p>
                  </div>
                  
                  <div className="space-y-3">
                    <BookingDialog designer={designer}>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Session
                      </Button>
                    </BookingDialog>
                    
                    <Button variant="outline" className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                  
                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>{designer.completion_rate}% completion rate</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            {[
              { id: 'about', label: 'About' },
              { id: 'services', label: 'Services' },
              { id: 'portfolio', label: 'Portfolio' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <Card>
            <CardHeader>
              <CardTitle>About {(() => {
                const firstName = designer.first_name || '';
                const email = designer.email || '';
                
                if (firstName) {
                  return firstName;
                } else if (email) {
                  return email.split('@')[0];
                }
                return 'Designer';
              })()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {designer.bio || 'This designer has not added a bio yet.'}
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'services' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.length > 0 ? (
              services.map((service) => (
                <Card key={service.id} className="group hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    {service.cover_image_url ? (
                      <img
                        src={service.cover_image_url}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{service.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold">${service.price}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{service.rating}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Link
                        to={`/services/${service.id}`}
                        className="block w-full text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        View Service
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No services available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              {designer.portfolio_images && designer.portfolio_images.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {designer.portfolio_images.map((image, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No portfolio images available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DesignerDetails;