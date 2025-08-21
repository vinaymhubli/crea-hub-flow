
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookingDialog } from '@/components/BookingDialog';
import { 
  Search, 
  Filter, 
  Star, 
  DollarSign, 
  Clock, 
  User,
  Tag,
  Grid,
  List,
  Image as ImageIcon
} from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  currency: string;
  delivery_time_days: number;
  rating: number;
  reviews_count: number;
  cover_image_url: string;
  designer: {
    id: string;
    user_id: string;
    hourly_rate: number;
    bio: string;
    rating: number;
    completion_rate: number;
    profile?: {
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
  };
}

// Rich dummy data for marketplace
const dummyServices: Service[] = [
  {
    id: 'demo-1',
    title: 'I will create a professional logo design for your business',
    description: 'Get a stunning, memorable logo that represents your brand perfectly. Includes multiple concepts, unlimited revisions, and source files.',
    category: 'Logo Design',
    tags: ['logo', 'branding', 'business', 'professional'],
    price: 25,
    currency: 'USD',
    delivery_time_days: 3,
    rating: 4.9,
    reviews_count: 127,
    cover_image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600',
    designer: {
      id: 'demo-designer-1',
      user_id: 'demo-user-1',
      hourly_rate: 45,
      bio: 'Professional graphic designer with 8+ years experience',
      rating: 4.9,
      completion_rate: 98,
      profile: {
        first_name: 'Sarah',
        last_name: 'Johnson',
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
      }
    }
  },
  {
    id: 'demo-2',
    title: 'I will design a modern website UI with figma prototypes',
    description: 'Complete website design with modern UI/UX, responsive layouts, interactive prototypes, and design system documentation.',
    category: 'Web Design',
    tags: ['website', 'ui/ux', 'figma', 'responsive', 'modern'],
    price: 150,
    currency: 'USD',
    delivery_time_days: 7,
    rating: 4.8,
    reviews_count: 89,
    cover_image_url: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600',
    designer: {
      id: 'demo-designer-2',
      user_id: 'demo-user-2',
      hourly_rate: 60,
      bio: 'UI/UX Designer specializing in modern web experiences',
      rating: 4.8,
      completion_rate: 95,
      profile: {
        first_name: 'Michael',
        last_name: 'Chen',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
      }
    }
  },
  {
    id: 'demo-3',
    title: 'I will create mobile app UI design with user experience focus',
    description: 'Professional mobile app design including wireframes, UI screens, user flows, and interactive prototype ready for development.',
    category: 'Mobile App Design',
    tags: ['mobile', 'app', 'ui/ux', 'ios', 'android'],
    price: 200,
    currency: 'USD',
    delivery_time_days: 10,
    rating: 5.0,
    reviews_count: 45,
    cover_image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600',
    designer: {
      id: 'demo-designer-3',
      user_id: 'demo-user-3',
      hourly_rate: 75,
      bio: 'Mobile app designer with 100+ successful apps launched',
      rating: 5.0,
      completion_rate: 100,
      profile: {
        first_name: 'Emma',
        last_name: 'Rodriguez',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
      }
    }
  },
  {
    id: 'demo-4',
    title: 'I will design complete brand identity package with guidelines',
    description: 'Full branding package including logo variations, color palette, typography, business cards, letterhead, and brand guidelines.',
    category: 'Branding',
    tags: ['branding', 'identity', 'guidelines', 'package', 'business'],
    price: 350,
    currency: 'USD',
    delivery_time_days: 14,
    rating: 4.7,
    reviews_count: 67,
    cover_image_url: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=600',
    designer: {
      id: 'demo-designer-4',
      user_id: 'demo-user-4',
      hourly_rate: 55,
      bio: 'Brand strategist and visual identity designer',
      rating: 4.7,
      completion_rate: 92,
      profile: {
        first_name: 'David',
        last_name: 'Kim',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      }
    }
  }
];

const categories = [
  'All Categories',
  'Logo Design', 
  'Web Design', 
  'UI/UX Design', 
  'Mobile App Design', 
  'Branding', 
  'Print Design', 
  'Illustration'
];

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data: servicesData, error } = await supabase
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
            profiles!inner(
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      
      // Transform the data structure for easier consumption
      const transformedServices = servicesData?.map(service => ({
        ...service,
        designer: {
          ...service.designers,
          profile: service.designers.profiles
        }
      })) || [];

      setServices(transformedServices.length > 0 ? transformedServices : dummyServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Fallback to dummy data for rich UI experience
      setServices(dummyServices);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All Categories' || service.category === selectedCategory;
    
    const matchesPrice = priceRange === 'all' ||
                        (priceRange === 'under50' && service.price < 50) ||
                        (priceRange === '50to150' && service.price >= 50 && service.price <= 150) ||
                        (priceRange === 'over150' && service.price > 150);

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'newest': return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      default: return b.rating * b.reviews_count - a.rating * a.reviews_count; // popularity
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-white rounded-lg overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find the Perfect Design Service
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              Browse thousands of talented designers ready to bring your vision to life
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search for any design service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-white text-gray-900 border-0 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under50">Under $50</SelectItem>
                <SelectItem value="50to150">$50 - $150</SelectItem>
                <SelectItem value="over150">$150+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex ml-auto space-x-2">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {sortedServices.length} service{sortedServices.length !== 1 ? 's' : ''}
            {selectedCategory !== 'All Categories' && ` in ${selectedCategory}`}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Services Grid */}
        {sortedServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No services found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or browse all categories</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "space-y-6"
          }>
            {sortedServices.map((service) => (
              <Card 
                key={service.id} 
                className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
                onClick={() => navigate(`/services/${service.id}`)}
              >
                <div className={viewMode === 'list' ? 'w-64 flex-shrink-0' : 'relative'}>
                  <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${
                    viewMode === 'list' ? 'h-full' : 'h-48'
                  }`}>
                    {service.cover_image_url ? (
                      <img 
                        src={service.cover_image_url} 
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  {service.id.startsWith('demo-') && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-600 text-white">
                        Demo Service
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="text-xs">
                      {service.category}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{service.rating}</span>
                      <span className="text-xs text-gray-500">({service.reviews_count})</span>
                    </div>
                  </div>

                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                    {service.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  {/* Designer Info */}
                  <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      {service.designer.profile?.avatar_url ? (
                        <img 
                          src={service.designer.profile.avatar_url}
                          alt={`${service.designer.profile.first_name} ${service.designer.profile.last_name}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {service.designer.profile?.first_name} {service.designer.profile?.last_name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{service.designer.completion_rate}% completion</span>
                        <span>•</span>
                        <span>${service.designer.hourly_rate}/hr</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {service.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Price and Delivery */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-600 text-lg">${service.price}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{service.delivery_time_days}d delivery</span>
                    </div>
                  </div>

                  {/* Book Now Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <BookingDialog designer={service.designer}>
                      <Button 
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Book Now
                      </Button>
                    </BookingDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
