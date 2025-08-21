
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Clock, Search, Filter } from "lucide-react";
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
  designer: {
    id: string;
    user_id: string;
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
  };
}

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Mock data for demonstration
  const mockServices: Service[] = [
    {
      id: '1',
      title: 'Professional Logo Design',
      description: 'I will create a unique and memorable logo for your business',
      category: 'Logo Design',
      tags: ['logo', 'branding', 'design'],
      price: 50,
      delivery_time_days: 3,
      revisions: 3,
      is_active: true,
      rating: 4.9,
      reviews_count: 127,
      cover_image_url: '/placeholder.svg',
      gallery_urls: [],
      designer_id: '1',
      designer: {
        id: '1',
        user_id: '1',
        profiles: {
          first_name: 'Sarah',
          last_name: 'Johnson',
          avatar_url: '/placeholder.svg'
        }
      }
    },
    {
      id: '2',
      title: 'Modern Website Design',
      description: 'Complete website design with modern UI/UX principles',
      category: 'Web Design',
      tags: ['website', 'ui', 'ux'],
      price: 200,
      delivery_time_days: 7,
      revisions: 5,
      is_active: true,
      rating: 4.8,
      reviews_count: 89,
      cover_image_url: '/placeholder.svg',
      gallery_urls: [],
      designer_id: '2',
      designer: {
        id: '2',
        user_id: '2',
        profiles: {
          first_name: 'Michael',
          last_name: 'Chen',
          avatar_url: '/placeholder.svg'
        }
      }
    }
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching services:', error);
        // Use mock data if there's an error or no data
        setServices(mockServices);
        return;
      }

      // Use real data if available, otherwise fall back to mock data
      setServices(data.length > 0 ? data : mockServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices(mockServices);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Logo Design', 'Web Design', 'Branding', 'Print Design', 'Mobile App', 'Illustration'];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
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
        return 0; // Keep original order for mock data
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
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
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/services/${service.id}`)}
            >
              <CardHeader className="p-0">
                <img
                  src={service.cover_image_url || "/placeholder.svg"}
                  alt={service.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <img
                    src={service.designer.profiles.avatar_url || "/placeholder.svg"}
                    alt={`${service.designer.profiles.first_name} ${service.designer.profiles.last_name}`}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-gray-600">
                    {service.designer.profiles.first_name} {service.designer.profiles.last_name}
                  </span>
                </div>
                <CardTitle className="text-lg mb-2 line-clamp-2">{service.title}</CardTitle>
                <CardDescription className="line-clamp-2 mb-3">
                  {service.description}
                </CardDescription>
                <div className="flex items-center space-x-2 mb-3">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{service.rating}</span>
                  <span className="text-sm text-gray-500">({service.reviews_count})</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.delivery_time_days} days
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    From ${service.price}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary">{service.category}</Badge>
                  {service.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No services found matching your criteria.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
