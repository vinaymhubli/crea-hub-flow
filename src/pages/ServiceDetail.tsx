
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingDialog } from '@/components/BookingDialog';
import { 
  Star, 
  DollarSign, 
  Clock, 
  User, 
  ArrowLeft,
  CheckCircle,
  MessageSquare,
  Shield,
  Award,
  Image as ImageIcon,
  Heart,
  Share2
} from 'lucide-react';

interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  currency: string;
  delivery_time_days: number;
  revisions: number;
  rating: number;
  reviews_count: number;
  cover_image_url: string;
  gallery_urls: string[];
  designer: {
    id: string;
    user_id: string;
    hourly_rate: number;
    bio: string;
    rating: number;
    completion_rate: number;
    response_time: string;
    profile?: {
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
  };
  packages?: ServicePackage[];
  faqs?: ServiceFAQ[];
}

interface ServicePackage {
  id: string;
  tier: 'basic' | 'standard' | 'premium';
  title: string;
  description: string;
  price: number;
  delivery_time_days: number;
  revisions: number;
  features: string[];
}

interface ServiceFAQ {
  id: string;
  question: string;
  answer: string;
}

export default function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [loading, setLoading] = useState(true);

  // Dummy service for demo
  const dummyService: ServiceDetail = {
    id: id || 'demo-1',
    title: 'I will create a professional logo design for your business',
    description: `Get a stunning, memorable logo that represents your brand perfectly. I specialize in creating unique, professional logos that help businesses stand out from the competition.

What you'll get:
• Professional logo design tailored to your brand
• Multiple initial concepts to choose from
• Unlimited revisions until you're 100% satisfied
• High-resolution files in multiple formats (PNG, JPG, SVG, PDF)
• Source files (AI, PSD)
• Commercial usage rights
• Fast turnaround time
• Professional communication throughout the process

My design process:
1. Brand research and concept development
2. Initial design concepts presentation
3. Revisions and refinements based on your feedback
4. Final logo delivery with all file formats

Why choose me:
✓ 8+ years of professional design experience
✓ 500+ satisfied clients worldwide
✓ Fast response time (usually within 2 hours)
✓ 100% original designs, no templates
✓ Money-back guarantee if not satisfied

I'm passionate about helping businesses create a strong brand identity. Let's work together to create a logo that you'll be proud to represent your business!`,
    category: 'Logo Design',
    tags: ['logo', 'branding', 'business', 'professional', 'identity', 'corporate'],
    price: 25,
    currency: 'USD',
    delivery_time_days: 3,
    revisions: -1, // unlimited
    rating: 4.9,
    reviews_count: 127,
    cover_image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
    gallery_urls: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      'https://images.unsplash.com/photo-1558655146-364adaf734b7?w=800',
      'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800'
    ],
    designer: {
      id: 'demo-designer-1',
      user_id: 'demo-user-1',
      hourly_rate: 45,
      bio: 'Professional graphic designer with 8+ years experience in brand identity and logo design. I\'ve worked with startups, SMBs, and Fortune 500 companies to create memorable brand experiences.',
      rating: 4.9,
      completion_rate: 98,
      response_time: '2 hours',
      profile: {
        first_name: 'Sarah',
        last_name: 'Johnson',
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
      }
    },
    packages: [
      {
        id: 'basic',
        tier: 'basic',
        title: 'Basic Logo',
        description: 'Simple logo design with essential files',
        price: 25,
        delivery_time_days: 3,
        revisions: 3,
        features: [
          '1 logo concept',
          '3 revisions included',
          'High-resolution PNG & JPG',
          'Commercial use',
          '3 days delivery'
        ]
      },
      {
        id: 'standard',
        tier: 'standard',
        title: 'Professional Logo',
        description: 'Professional package with multiple concepts',
        price: 75,
        delivery_time_days: 5,
        revisions: 5,
        features: [
          '3 logo concepts',
          '5 revisions included',
          'High-resolution PNG, JPG, SVG',
          'Source files (AI, PSD)',
          'Commercial use',
          'Color & monochrome versions',
          '5 days delivery'
        ]
      },
      {
        id: 'premium',
        tier: 'premium',
        title: 'Complete Brand Package',
        description: 'Full brand identity with logo variations',
        price: 150,
        delivery_time_days: 7,
        revisions: -1, // unlimited
        features: [
          '5 logo concepts',
          'Unlimited revisions',
          'All file formats (PNG, JPG, SVG, PDF, EPS)',
          'Source files (AI, PSD)',
          'Logo variations & submarks',
          'Brand guidelines document',
          'Business card design',
          'Social media kit',
          'Commercial use',
          'Priority support',
          '7 days delivery'
        ]
      }
    ],
    faqs: [
      {
        id: '1',
        question: 'What file formats will I receive?',
        answer: 'You\'ll receive high-resolution PNG, JPG files in the Basic package. Standard and Premium include SVG, and Premium includes all formats (EPS, PDF) plus source files.'
      },
      {
        id: '2',
        question: 'How many revisions are included?',
        answer: 'Basic includes 3 revisions, Standard includes 5 revisions, and Premium includes unlimited revisions until you\'re completely satisfied.'
      },
      {
        id: '3',
        question: 'Do I own the rights to the logo?',
        answer: 'Yes, you will have full commercial rights to use the logo once the project is completed and payment is made.'
      },
      {
        id: '4',
        question: 'How long does it take to complete?',
        answer: 'Delivery time varies by package: Basic (3 days), Standard (5 days), Premium (7 days). Rush delivery is available for an additional fee.'
      },
      {
        id: '5',
        question: 'What information do you need to get started?',
        answer: 'I\'ll need your business name, industry, target audience, preferred colors, style preferences, and any specific requirements you have.'
      }
    ]
  };

  useEffect(() => {
    fetchServiceDetail();
  }, [id]);

  const fetchServiceDetail = async () => {
    if (!id) return;

    try {
      const { data: serviceData, error } = await supabase
        .from('services')
        .select(`
          *,
          designers!inner(
            id,
            user_id,
            hourly_rate,
            bio,
            rating,
            completion_rate,
            response_time,
            profiles!inner(
              first_name,
              last_name,
              avatar_url
            )
          ),
          service_packages(*),
          service_faqs(*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !serviceData) {
        // Fallback to dummy data for demo
        setService(dummyService);
      } else {
        const transformedService = {
          ...serviceData,
          designer: {
            ...serviceData.designers,
            profile: serviceData.designers.profiles
          },
          packages: serviceData.service_packages,
          faqs: serviceData.service_faqs
        };
        setService(transformedService);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      setService(dummyService);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">Service not found</h2>
          <Link to="/services" className="text-green-600 hover:text-green-700">
            ← Back to Services
          </Link>
        </div>
      </div>
    );
  }

  const currentPackage = service.packages?.find(p => p.tier === selectedPackage) || service.packages?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link 
          to="/services" 
          className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                {service.cover_image_url ? (
                  <img 
                    src={service.cover_image_url} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-24 h-24 text-gray-400" />
                )}
              </div>
              {service.gallery_urls && service.gallery_urls.length > 1 && (
                <CardContent className="p-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {service.gallery_urls.map((url, idx) => (
                      <div key={idx} className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Service Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="outline">{service.category}</Badge>
                      {service.id.startsWith('demo-') && (
                        <Badge className="bg-green-600 text-white">Demo Service</Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl mb-4">{service.title}</CardTitle>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{service.rating}</span>
                        <span className="text-gray-600">({service.reviews_count} reviews)</span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-gray-600">{service.reviews_count} orders in queue</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                    {service.description}
                  </pre>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-6">
                  {service.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Packages */}
            {service.packages && service.packages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Package</CardTitle>
                  <CardDescription>Select the package that best fits your needs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedPackage} onValueChange={(value) => setSelectedPackage(value as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      {service.packages.map((pkg) => (
                        <TabsTrigger key={pkg.tier} value={pkg.tier} className="capitalize">
                          {pkg.tier}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {service.packages.map((pkg) => (
                      <TabsContent key={pkg.tier} value={pkg.tier} className="mt-6">
                        <div className="border rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-semibold mb-2">{pkg.title}</h3>
                              <p className="text-gray-600 mb-4">{pkg.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-green-600">${pkg.price}</div>
                              <div className="text-sm text-gray-600">{pkg.delivery_time_days} days delivery</div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {pkg.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* FAQs */}
            {service.faqs && service.faqs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {service.faqs.map((faq) => (
                    <div key={faq.id}>
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ${currentPackage?.price || service.price}
                  </div>
                  <div className="text-gray-600">
                    {currentPackage?.delivery_time_days || service.delivery_time_days} days delivery
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {currentPackage?.revisions === -1 ? 'Unlimited' : currentPackage?.revisions || service.revisions} revisions
                  </div>
                </div>

                <BookingDialog designer={service.designer} service={service}>
                  <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 mb-4">
                    Continue (${currentPackage?.price || service.price})
                  </Button>
                </BookingDialog>

                <Button variant="outline" className="w-full mb-6">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Seller
                </Button>

                <div className="space-y-4 text-sm">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{currentPackage?.delivery_time_days || service.delivery_time_days} days delivery</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <span>{currentPackage?.revisions === -1 ? 'Unlimited' : currentPackage?.revisions || service.revisions} revisions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="w-4 h-4 text-gray-500" />
                    <span>Money-back guarantee</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Designer Card */}
            <Card>
              <CardHeader>
                <CardTitle>About the Seller</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    {service.designer.profile?.avatar_url ? (
                      <img 
                        src={service.designer.profile.avatar_url}
                        alt={`${service.designer.profile.first_name} ${service.designer.profile.last_name}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {service.designer.profile?.first_name} {service.designer.profile?.last_name}
                    </h3>
                    <div className="flex items-center space-x-1 mb-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{service.designer.rating}</span>
                      <span className="text-gray-500 text-sm">({service.reviews_count})</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{service.designer.bio}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">From</span>
                    <p className="font-medium">United States</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg response</span>
                    <p className="font-medium">{service.designer.response_time}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Orders completed</span>
                    <p className="font-medium">{service.reviews_count}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Completion rate</span>
                    <p className="font-medium">{service.designer.completion_rate}%</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Me
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
