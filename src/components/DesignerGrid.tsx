
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookingDialog } from './BookingDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FilterState } from '../pages/Designers';

interface DesignerGridProps {
  filters: FilterState;
}

const DesignerGrid: React.FC<DesignerGridProps> = ({ filters }) => {
  const location = useLocation();
  const [sortBy, setSortBy] = useState('rating');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'hourly_rate', label: 'Price: Low to High' },
    { value: 'hourly_rate_desc', label: 'Price: High to Low' },
    { value: 'created_at', label: 'Newest' }
  ];

  // Debounced filter function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  };

  const fetchDesigners = useCallback(async () => {
    try {
      console.log('Fetching designers with filters:', filters);
      setLoading(true);
      
      // If categories are selected, first get designers who have services in those categories
      let designerIds: string[] = [];
      if (filters.selectedCategories.length > 0) {
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('designer_id')
          .in('category', filters.selectedCategories)
          .eq('is_active', true);

        if (servicesError) throw servicesError;
        designerIds = [...new Set(services?.map(s => s.designer_id) || [])];
        
        // If no services found in selected categories, return empty results
        if (designerIds.length === 0) {
          setDesigners([]);
          return;
        }
      }

      let query = supabase
        .from('designers')
        .select('*');

      // Filter by designers who have services in selected categories
      if (designerIds.length > 0) {
        query = query.in('id', designerIds);
      }

      // Apply price filter
      if (filters.priceRange[1] < 200) {
        query = query.lte('hourly_rate', filters.priceRange[1]);
      }
      query = query.gte('hourly_rate', filters.priceRange[0]);

      // Apply online filter
      if (filters.isOnlineOnly) {
        query = query.eq('is_online', true);
      }

      // Apply rating filter
      if (filters.selectedRating) {
        query = query.gte('rating', filters.selectedRating);
      }

      // Apply sorting
      if (sortBy === 'hourly_rate') {
        query = query.order('hourly_rate', { ascending: true });
      } else if (sortBy === 'hourly_rate_desc') {
        query = query.order('hourly_rate', { ascending: false });
      } else if (sortBy === 'created_at') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('rating', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      console.log('Fetched designers:', data?.length || 0);
      
      // Fetch profiles for each designer
      const designersWithProfiles = await Promise.all(
        (data || []).map(async (designer) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, email')
            .eq('user_id', designer.user_id)
            .single();
          
          return {
            ...designer,
            profiles: profile
          };
        })
      );
      
      // Apply client-side filters
      let filteredData = designersWithProfiles;
      
      // Apply search filter client-side with improved matching
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter(designer => {
          const fullName = `${designer.profiles?.first_name || ''} ${designer.profiles?.last_name || ''}`.toLowerCase();
          return (
            designer.specialty?.toLowerCase().includes(searchLower) ||
            designer.bio?.toLowerCase().includes(searchLower) ||
            fullName.includes(searchLower) ||
            designer.profiles?.email?.toLowerCase().includes(searchLower) ||
            designer.skills?.some(skill => skill.toLowerCase().includes(searchLower))
          );
        });
      }
      
      // Apply skills filter
      if (filters.selectedSkills.length > 0) {
        filteredData = filteredData.filter(designer => 
          designer.skills && filters.selectedSkills.some(skill => 
            designer.skills.includes(skill)
          )
        );
      }

      console.log('Filtered designers:', filteredData.length);
      setDesigners(filteredData);
    } catch (error) {
      console.error('Error fetching designers:', error);
      toast.error('Failed to load designers');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy]);

  // Debounced version of fetchDesigners
  const debouncedFetchDesigners = useCallback(
    debounce(fetchDesigners, 300),
    [fetchDesigners]
  );

  // Initial load
  useEffect(() => {
    fetchDesigners();
  }, []);

  // Debounced updates for filter changes
  useEffect(() => {
    if (filters.searchTerm !== '') {
      debouncedFetchDesigners();
    } else {
      fetchDesigners();
    }
  }, [filters, debouncedFetchDesigners, fetchDesigners]);

  // Real-time updates
  useEffect(() => {
    console.log('Setting up real-time subscriptions...');
    
    const designersChannel = supabase
      .channel('designers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'designers'
        },
        (payload) => {
          console.log('Designers table changed:', payload);
          fetchDesigners();
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('Services table changed:', payload);
          fetchDesigners();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(designersChannel);
      supabase.removeChannel(servicesChannel);
    };
  }, [fetchDesigners]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (designers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No designers found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <p className="text-muted-foreground font-medium">{designers.length} designers found</p>
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">
              {designers.filter(d => d.is_online).length} online now
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="relative">
            <button 
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center space-x-2 bg-background border border-border px-4 py-2 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 min-w-[160px]"
            >
              <span className="text-sm font-medium">
                {sortOptions.find(option => option.value === sortBy)?.label}
              </span>
              <div className={`transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`}>
                ⌄
              </div>
            </button>
            
            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-lg z-10 py-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors ${
                      sortBy === option.value ? 'text-green-600 font-medium bg-green-50' : 'text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Designer Cards */}
      <div className="space-y-6">
        {designers.map((designer) => (
          <div key={designer.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300 group">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Left Side - Profile Image */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-xl group-hover:scale-105 transition-transform duration-300 shadow-lg">
                    {designer.profiles?.avatar_url ? (
                      <img 
                        src={designer.profiles.avatar_url} 
                        alt={`${designer.profiles?.first_name} ${designer.profiles?.last_name}`}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <span>
                        {designer.profiles?.first_name?.[0]?.toUpperCase() || 'D'}
                        {designer.profiles?.last_name?.[0]?.toUpperCase() || 'E'}
                      </span>
                    )}
                  </div>
                  {designer.is_online && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-white font-bold">●</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle - Designer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-green-600 transition-colors duration-200 mb-1">
                      {designer.profiles?.first_name && designer.profiles?.last_name 
                        ? `${designer.profiles.first_name} ${designer.profiles.last_name}` 
                        : designer.profiles?.email?.split('@')[0] || 'Designer'}
                    </h3>
                    <p className="text-green-600 font-medium text-sm mb-1">{designer.specialty}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {designer.profiles?.email || 'Email not available'}
                    </p>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-lg font-semibold text-foreground ml-1">{designer.rating || 4.8}</span>
                        <span className="text-sm text-muted-foreground ml-1">({designer.reviews_count || 0})</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        designer.is_online 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {designer.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    {/* Bio */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{designer.bio || 'Passionate designer ready to help you bring your vision to life.'}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2">
                      {(designer.skills || []).map((skill, index) => (
                        <span key={index} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium hover:bg-green-100 hover:text-green-700 transition-colors duration-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Side - Price and Actions */}
                  <div className="flex-shrink-0 lg:text-right">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      ${designer.hourly_rate}<span className="text-base font-normal text-muted-foreground">/hr</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Usually responds in {designer.response_time || '1 hour'}</p>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 lg:w-48">
                      <Link 
                        to={`/designer/${designer.id}`} 
                        state={{ 
                          hideGlobalChrome: location.pathname.includes('/customer-dashboard'),
                          fromPath: location.pathname 
                        }}
                        className="bg-green-600 text-white py-2 px-4 rounded-xl text-sm font-medium hover:bg-green-700 transition-all duration-200 text-center"
                      >
                        View Profile
                      </Link>
                      <button className="bg-background border border-green-600 text-green-600 py-2 px-4 rounded-xl text-sm font-medium hover:bg-green-50 transition-all duration-200">
                        Chat
                      </button>
                      <BookingDialog designer={designer}>
                        <Button className="bg-background border border-blue-600 text-blue-600 py-2 px-4 rounded-xl text-sm font-medium hover:bg-blue-50 transition-all duration-200 w-full">
                          Book Session
                        </Button>
                      </BookingDialog>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-16 flex justify-center">
        <nav className="flex items-center space-x-2 bg-background rounded-2xl p-2 shadow-sm border border-border">
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200">
            ←
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium min-w-[40px]">1</button>
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 min-w-[40px]">2</button>
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 min-w-[40px]">3</button>
          <span className="px-2 text-muted-foreground">...</span>
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 min-w-[40px]">12</button>
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200">
            →
          </button>
        </nav>
      </div>
    </div>
  );
};

export default DesignerGrid;
