
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DesignerGrid from '../components/DesignerGrid';
import FilterSidebar from '../components/FilterSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FilterState {
  searchTerm: string;
  priceRange: [number, number];
  selectedSkills: string[];
  selectedCategories: string[];
  selectedRating: number | null;
  isOnlineOnly: boolean;
  isAvailableNow: boolean;
}

const Designers = () => {
  const { user, profile, loading } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    priceRange: [0, 200],
    selectedSkills: [],
    selectedCategories: [],
    selectedRating: null,
    isOnlineOnly: false,
    isAvailableNow: false,
  });
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [skills, setSkills] = useState<string[]>([]);

  // Redirect clients to dashboard version
  if (!loading && user && profile?.user_type === 'client') {
    return <Navigate to="/customer-dashboard/designers" replace />;
  }

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchFiltersData = async () => {
    try {
      // Fetch categories from services table
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('category')
        .eq('is_active', true);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        return;
      }

      // Fetch skills from designers table
      const { data: designers, error: designersError } = await supabase
        .from('designers')
        .select('skills');

      if (designersError) {
        console.error('Error fetching designers:', designersError);
        return;
      }

      // Extract categories with counts
      const categoryMap = new Map<string, number>();
      services?.forEach(service => {
        if (service.category) {
          const current = categoryMap.get(service.category) || 0;
          categoryMap.set(service.category, current + 1);
        }
      });

      // Extract unique skills
      const allSkills = new Set<string>();
      designers?.forEach(designer => {
        if (designer.skills && Array.isArray(designer.skills)) {
          designer.skills.forEach(skill => allSkills.add(skill));
        }
      });

      setCategories(Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count })));
      setSkills(Array.from(allSkills));
    } catch (error) {
      console.error('Error fetching filters data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-blue-600/5 pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span>🔥</span>
              <span>247 Designers Available</span>
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
              Find Your Perfect
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Designer</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connect with talented designers from around the world. Browse portfolios, compare rates, and hire the perfect match for your project.
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg">🔍</span>
                  <input
                    type="text"
                    placeholder="Search designers by name, skill, or specialty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-background"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center space-x-2 px-6 py-4 bg-muted text-foreground rounded-xl hover:bg-accent transition-colors"
                >
                  <span>🔍</span>
                  <span>Filters</span>
                </button>
                <button 
                  onClick={() => {
                    setFilters(prev => ({ ...prev, searchTerm }));
                  }}
                  className="flex items-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  <span>🔍</span>
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <FilterSidebar 
                filters={filters} 
                onFiltersChange={setFilters}
                categories={categories}
                skills={skills}
              />
            </div>
            <div className="lg:w-3/4">
              <DesignerGrid filters={filters} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Designers;
