
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Clock, Search, Filter, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Service {
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
  designer?: {
    id: string;
    user_id: string;
    profiles?: {
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
  };
}

// Mock data for demonstration when no services exist
const mockServices: Service[] = [
  {
    id: '1',
    title: 'Logo Design & Branding',
    description: 'Professional logo design and complete brand identity package including business cards, letterheads, and style guide.',
    category: 'Branding',
    tags: ['Logo', 'Branding', 'Identity'],
    price: 299,
    delivery_time_days: 7,
    revisions: 3,
    is_active: true,
    rating: 4.8,
    reviews_count: 24,
    cover_image_url: '/src/assets/portfolio-logos.jpg',
    gallery_urls: [],
    designer_id: 'designer-1',
    designer: {
      id: 'designer-1',
      user_id: 'user-1',
      profiles: {
        first_name: 'Sarah',
        last_name: 'Chen',
        avatar_url: '/placeholder.svg'
      }
    }
  },
  {
    id: '2',
    title: 'Website Design & Development',
    description: 'Modern, responsive website design with full development including e-commerce functionality and SEO optimization.',
    category: 'Web Design',
    tags: ['Website', 'Development', 'E-commerce'],
    price: 899,
    delivery_time_days: 14,
    revisions: 5,
    is_active: true,
    rating: 4.9,
    reviews_count: 18,
    cover_image_url: '/src/assets/portfolio-corporate.jpg',
    gallery_urls: [],
    designer_id: 'designer-2',
    designer: {
      id: 'designer-2',
      user_id: 'user-2',
      profiles: {
        first_name: 'Alex',
        last_name: 'Rodriguez',
        avatar_url: '/placeholder.svg'
      }
    }
  },
  {
    id: '3',
    title: 'Mobile App UI/UX Design',
    description: 'Complete mobile app design with user experience research, wireframes, and high-fidelity mockups.',
    category: 'Mobile Design',
    tags: ['Mobile', 'UI/UX', 'App Design'],
    price: 599,
    delivery_time_days: 10,
    revisions: 4,
    is_active: true,
    rating: 4.7,
    reviews_count: 15,
    cover_image_url: '/src/assets/portfolio-mobile-app.jpg',
    gallery_urls: [],
    designer_id: 'designer-3',
    designer: {
      id: 'designer-3',
      user_id: 'user-3',
      profiles: {
        first_name: 'Priya',
        last_name: 'Patel',
        avatar_url: '/placeholder.svg'
      }
    }
  },
  {
    id: '4',
    title: 'Illustration & Graphics',
    description: 'Custom illustrations, icons, and graphics for websites, apps, and marketing materials.',
    category: 'Illustration',
    tags: ['Illustration', 'Graphics', 'Icons'],
    price: 199,
    delivery_time_days: 5,
    revisions: 2,
    is_active: true,
    rating: 4.6,
    reviews_count: 31,
    cover_image_url: '/src/assets/portfolio-illustration.jpg',
    gallery_urls: [],
    designer_id: 'designer-4',
    designer: {
      id: 'designer-4',
      user_id: 'user-4',
      profiles: {
        first_name: 'Marcus',
        last_name: 'Johnson',
        avatar_url: '/placeholder.svg'
      }
    }
  }
];

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('services')
        .select(`
          *,
          designer:designers (
            id,
            user_id,
            profiles (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('Error fetching services:', supabaseError);
        // If there's an error, fall back to mock data
        setServices(mockServices);
        setUseMockData(true);
        setError('Using sample data - real services will appear here once designers create them.');
      } else if (data && data.length > 0) {
        setServices(data);
        setUseMockData(false);
      } else {
        // No services found, use mock data
        setServices(mockServices);
        setUseMockData(true);
        setError('No services found yet. Showing sample services for demonstration.');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      // Fall back to mock data on any error
      setServices(mockServices);
      setUseMockData(true);
      setError('Unable to load services. Showing sample services for demonstration.');
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic categories from services
  const categories = [...new Set(services.map(service => service.category))].filter(Boolean);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === '' || selectedCategory === 'all' || 
                           service.category?.toLowerCase() === selectedCategory?.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
      default:
        return 0; // Keep original order
    }
  });

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    // Scroll to top when filter is applied
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    // Scroll to top when filters are cleared
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>

          {/* Filters Skeleton */}
          <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Services Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
                      <div className="h-2 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Services</h1>
          <p className="text-gray-600">Find the perfect design service for your project</p>
          
          {/* Error/Info Banner */}
          {error && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-blue-800 text-sm">{error}</p>
                  {useMockData && (
                    <p className="text-blue-600 text-xs mt-1">
                      These are sample services to demonstrate the platform. Real services will appear here once designers create them.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={handleCategorySelect}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedServices.map((service) => (
            <Card 
              key={service.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-white group"
              onClick={() => navigate(`/services/${service.id}`)}
            >
              <CardHeader className="p-0 relative overflow-hidden">
                <div className="relative">
                  <img
                    src={service.cover_image_url || "/placeholder.svg"}
                    alt={service.title}
                    className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-white/90 text-gray-700">
                      {service.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                    <img
                      src={service.designer?.profiles?.avatar_url || "/placeholder.svg"}
                      alt={`${service.designer?.profiles?.first_name || 'Designer'} ${service.designer?.profiles?.last_name || ''}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {service.designer?.profiles?.first_name || 'Designer'} {service.designer?.profiles?.last_name || ''}
                    </p>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-600">{service.rating}</span>
                      <span className="text-xs text-gray-500">({service.reviews_count})</span>
                    </div>
                  </div>
                </div>
                
                <CardTitle className="text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                  {service.title}
                </CardTitle>
                
                <CardDescription className="line-clamp-2 mb-4 text-gray-600">
                  {service.description}
                </CardDescription>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.delivery_time_days} days
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    From ${service.price}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {service.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs bg-gray-50">
                      {tag}
                    </Badge>
                  ))}
                  {service.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      +{service.tags.length - 3} more
                    </Badge>
                  )}
                </div>
                
                <div className="pt-3 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/services/${service.id}`);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedServices.length === 0 && (
          <div className="text-center py-12">
            {searchTerm || selectedCategory ? (
              <>
                <div className="mb-6">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Services Found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria or browse all categories.</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleClearFilters}
                  className="mr-4"
                >
                  Clear Filters
                </Button>
                <Button 
                  onClick={() => navigate('/designers')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Browse Designers
                </Button>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Services Available Yet</h3>
                  <p className="text-gray-500">Be the first to create amazing design services on our platform!</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    Join as Designer
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/designers')}
                  >
                    Browse Designers
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Call to Action */}
        {useMockData && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Get Started?</h3>
              <p className="text-gray-600 mb-6">
                Join our platform as a designer to create your first service, or browse our featured designers to find the perfect match for your project.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/designers')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Browse Designers
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/signup?role=designer')}
                >
                  Join as Designer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Featured Categories Section */}
        {useMockData && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Popular Service Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Branding', 'Web Design', 'Mobile Design', 'Illustration'].map((category) => (
                <div 
                  key={category}
                  className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleCategorySelect(category)}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-semibold text-lg">
                      {category.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900">{category}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {mockServices.filter(s => s.category === category).length} services
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
