
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Clock, RefreshCw, Check, ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookingDialog } from "@/components/BookingDialog";
import { toast } from "sonner";

interface ServicePackage {
  id: string;
  service_id: string;
  tier: 'basic' | 'standard' | 'premium';
  title: string;
  description: string;
  price: number;
  delivery_time_days: number;
  revisions: number;
  features: string[];
  created_at: string;
  updated_at: string;
}

interface ServiceFAQ {
  id: string;
  service_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at?: string; // Make this optional since it might not be returned
}

interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  delivery_time_days: number;
  revisions: number;
  is_active: boolean;
  rating: number;
  reviews_count: number;
  cover_image_url: string;
  gallery_urls: string[];
  designer_id: string;
  created_at: string;
  updated_at: string;
  packages: ServicePackage[];
  service_faqs: ServiceFAQ[];
  designer: {
    id: string;
    user_id: string;
    hourly_rate: number;
    bio: string;
    rating: number;
    completion_rate: number;
    response_time: string;
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
  };
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_packages (*),
          service_faqs (*),
          designer:designers (
            id,
            user_id,
            hourly_rate,
            bio,
            rating,
            completion_rate,
            response_time,
            profiles (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching service:', error);
        if (error.code === 'PGRST116') {
          // No rows returned - service not found
          toast.error('Service not found');
          navigate('/services');
          return;
        } else {
          // Other database error
          toast.error('Failed to load service details');
          navigate('/services');
          return;
        }
      }

      if (!data) {
        toast.error('Service not found');
        navigate('/services');
        return;
      }

      // Transform the data to match our interface
      const transformedService: ServiceDetail = {
        ...data,
        packages: data.service_packages?.map((pkg: any) => ({
          ...pkg,
          tier: pkg.tier as 'basic' | 'standard' | 'premium'
        })) || [],
        service_faqs: data.service_faqs?.map((faq: any) => ({
          ...faq,
          updated_at: faq.updated_at || faq.created_at // Fallback to created_at if updated_at is missing
        })) || [],
        designer: {
          ...data.designer,
          profiles: data.designer?.profiles || null
        }
      };

      setService(transformedService);
      // Set the first package as default
      if (transformedService.packages?.length > 0) {
        setSelectedPackage(transformedService.packages[0]);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error('Failed to load service');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
  };

  const handleContactDesigner = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      // Check for existing booking with this designer
      const { data: existingBooking, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('customer_id', user.id)
        .eq('designer_id', service?.designer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking for existing booking:', error);
        toast.error('Failed to check existing conversations');
        return;
      }

      if (existingBooking) {
        // Navigate to existing conversation
        navigate(`/customer-dashboard/messages?booking_id=${existingBooking.id}`);
      } else {
        // Prompt user to book first
        toast.error('Please book a session first to start messaging this designer');
        // Optionally scroll to booking section
        document.querySelector('[data-booking-section]')?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to initiate conversation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/services')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{service.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {service.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{service.rating}</span>
                    <span className="text-gray-500">({service.reviews_count})</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <Badge>{service.category}</Badge>
                  {service.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {/* Image Gallery with Carousel */}
                {(() => {
                  const allImages = [
                    ...(service.cover_image_url ? [service.cover_image_url] : []),
                    ...(service.gallery_urls || [])
                  ].filter(Boolean);

                  if (allImages.length === 0) {
                    return (
                      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">No images available</p>
                      </div>
                    );
                  }

                  if (allImages.length === 1) {
                    return (
                      <img
                        src={allImages[0]}
                        alt={service.title}
                        className="w-full h-64 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <Carousel className="w-full">
                        <CarouselContent>
                          {allImages.map((imageUrl, index) => (
                            <CarouselItem key={index}>
                              <div className="relative">
                                <img
                                  src={imageUrl}
                                  alt={`${service.title} - Image ${index + 1}`}
                                  className="w-full h-64 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                  }}
                                />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                      </Carousel>
                      
                      {/* Thumbnail navigation */}
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {allImages.map((imageUrl, index) => (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-md cursor-pointer border-2 border-transparent hover:border-primary transition-colors flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Service packages */}
            <Card>
              <CardHeader>
                <CardTitle>Service Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={service.packages?.[0]?.tier || 'basic'} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    {service.packages?.map((pkg) => (
                      <TabsTrigger key={pkg.tier} value={pkg.tier} className="capitalize">
                        {pkg.tier}
                      </TabsTrigger>
                    )) || []}
                  </TabsList>
                  {service.packages?.map((pkg) => (
                    <TabsContent key={pkg.tier} value={pkg.tier}>
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-semibold">{pkg.title}</h3>
                            <p className="text-gray-600">{pkg.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">${pkg.price}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {pkg.delivery_time_days} days delivery
                          </div>
                          <div className="flex items-center">
                            <RefreshCw className="w-4 h-4 mr-1" />
                            {pkg.revisions} revisions
                          </div>
                        </div>
                        <div className="space-y-2">
                          {pkg.features?.map((feature, index) => (
                            <div key={index} className="flex items-center">
                              <Check className="w-4 h-4 text-green-600 mr-2" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          )) || []}
                        </div>
                        <BookingDialog
                          designer={{
                            id: service.designer.id,
                            user_id: service.designer.user_id,
                            first_name: service.designer.profiles?.first_name || 'Unknown',
                            last_name: service.designer.profiles?.last_name || 'User',
                            hourly_rate: service.designer.hourly_rate,
                            specialization: service.category,
                            avatar_url: service.designer.profiles?.avatar_url
                          }}
                          service={{
                            id: service.id,
                            title: service.title,
                            price: service.price,
                            delivery_time_days: service.delivery_time_days,
                            packages: service.packages
                          }}
                        >
                          <Button className="w-full mt-4">
                            Select ${pkg.price}
                          </Button>
                        </BookingDialog>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            {service.service_faqs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {service.service_faqs.map((faq) => (
                    <div key={faq.id} className="border-b pb-4 last:border-b-0">
                      <h4 className="font-medium mb-2">{faq.question}</h4>
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Designer info */}
            <Card>
              <CardHeader>
                <CardTitle>About the Designer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar>
                    <AvatarImage src={service.designer.profiles?.avatar_url} />
                    <AvatarFallback>
                      {service.designer.profiles?.first_name?.[0] || 'U'}{service.designer.profiles?.last_name?.[0] || 'N'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {service.designer.profiles?.first_name || 'Unknown'} {service.designer.profiles?.last_name || 'User'}
                    </h4>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                      {service.designer.rating} • {service.designer.completion_rate}% completion rate
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{service.designer.bio || 'No bio available'}</p>
                <div className="space-y-2 text-sm">
                  <div>Response time: {service.designer.response_time}</div>
                  <div>Hourly rate: ${service.designer.hourly_rate}/hour</div>
                </div>
                <Separator className="my-4" />
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleContactDesigner}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Designer
                </Button>
              </CardContent>
            </Card>

            {/* Quick booking */}
            <Card data-booking-section>
              <CardHeader>
                <CardTitle>Quick Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Starting at</span>
                    <span className="font-semibold">${service.price}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Delivery time</span>
                    <span>{service.delivery_time_days} days</span>
                  </div>
                  <BookingDialog
                    designer={{
                      id: service.designer.id,
                      user_id: service.designer.user_id,
                      first_name: service.designer.profiles?.first_name || 'Unknown',
                      last_name: service.designer.profiles?.last_name || 'User',
                      hourly_rate: service.designer.hourly_rate,
                      specialization: service.category,
                      avatar_url: service.designer.profiles?.avatar_url
                    }}
                    service={{
                      id: service.id,
                      title: service.title,
                      price: service.price,
                      delivery_time_days: service.delivery_time_days,
                      packages: service.packages
                    }}
                  >
                    <Button className="w-full">
                      Book Now
                    </Button>
                  </BookingDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}
