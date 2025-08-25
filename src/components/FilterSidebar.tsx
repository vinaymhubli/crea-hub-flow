
import React, { useState, useEffect } from 'react';
import { FilterState } from '../pages/Designers';

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: Array<{ name: string; count: number }>;
  skills: string[];
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onFiltersChange, categories, skills }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSkill = (skill: string) => {
    const newSkills = filters.selectedSkills.includes(skill)
      ? filters.selectedSkills.filter(s => s !== skill)
      : [...filters.selectedSkills, skill];
    onFiltersChange({ ...filters, selectedSkills: newSkills });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.selectedCategories.includes(category)
      ? filters.selectedCategories.filter(c => c !== category)
      : [...filters.selectedCategories, category];
    onFiltersChange({ ...filters, selectedCategories: newCategories });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      priceRange: [0, 200],
      selectedSkills: [],
      selectedCategories: [],
      selectedRating: null,
      isOnlineOnly: false,
      isAvailableNow: false,
    });
  };

  const hasActiveFilters = filters.selectedSkills.length > 0 || 
                          filters.selectedCategories.length > 0 || 
                          filters.selectedRating !== null || 
                          filters.priceRange[1] < 200 ||
                          filters.isOnlineOnly ||
                          filters.isAvailableNow;

  const handlePriceRangeChange = (value: number) => {
    onFiltersChange({ ...filters, priceRange: [filters.priceRange[0], value] });
  };

  const handleRatingChange = (rating: number) => {
    const newRating = filters.selectedRating === rating ? null : rating;
    onFiltersChange({ ...filters, selectedRating: newRating });
  };

  const handleAvailabilityChange = (type: 'isOnlineOnly' | 'isAvailableNow', checked: boolean) => {
    onFiltersChange({ ...filters, [type]: checked });
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border sticky top-6 overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <span>🔍</span>
            <span>Filters</span>
          </h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-green-600 font-medium">
              {filters.selectedSkills.length + filters.selectedCategories.length + (filters.selectedRating ? 1 : 0)} active filters
            </span>
            <button
              onClick={clearAllFilters}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
      
      <div className={`${isCollapsed ? 'hidden' : 'block'} lg:block`}>
        <div className="p-6 space-y-8">
          {/* Price Range */}
          <div>
            <h4 className="font-medium text-foreground mb-4 flex items-center space-x-2">
              <span>💰</span>
              <span>Price Range (per hour)</span>
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-muted px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-foreground">${filters.priceRange[0]}</span>
                </div>
                <div className="bg-muted px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-foreground">${filters.priceRange[1]}+</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceRangeChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(filters.priceRange[1] / 200) * 100}%, #e5e7eb ${(filters.priceRange[1] / 200) * 100}%, #e5e7eb 100%)`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-medium text-foreground mb-4 flex items-center space-x-2">
              <span>📂</span>
              <span>Categories</span>
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {categories.map((category) => (
                <label key={category.name} className="flex items-center justify-between cursor-pointer group hover:bg-accent -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={filters.selectedCategories.includes(category.name)}
                      onChange={() => toggleCategory(category.name)}
                      className="w-4 h-4 text-green-600 border-border rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-foreground">{category.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="font-medium text-foreground mb-4 flex items-center space-x-2">
              <span>🛠️</span>
              <span>Skills</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-2 text-sm rounded-xl border transition-all duration-200 ${
                    filters.selectedSkills.includes(skill)
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : 'bg-background border-border text-foreground hover:border-green-200 hover:bg-green-50'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h4 className="font-medium text-foreground mb-4 flex items-center space-x-2">
              <span>⭐</span>
              <span>Rating</span>
            </h4>
            <div className="space-y-3">
              {[5, 4, 3].map((rating) => (
                <label key={rating} className="flex items-center cursor-pointer group hover:bg-accent -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <input
                    type="radio"
                    name="rating"
                    value={rating}
                    checked={filters.selectedRating === rating}
                    onChange={() => handleRatingChange(rating)}
                    className="w-4 h-4 text-green-600 border-border focus:ring-green-500"
                  />
                  <div className="ml-3 flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < rating ? 'text-yellow-400' : 'text-muted-foreground'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-foreground">& up</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h4 className="font-medium text-foreground mb-4 flex items-center space-x-2">
              <span>🟢</span>
              <span>Availability</span>
            </h4>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer group hover:bg-accent -mx-2 px-2 py-2 rounded-lg transition-colors">
                <input 
                  type="checkbox" 
                  checked={filters.isAvailableNow}
                  onChange={(e) => handleAvailabilityChange('isAvailableNow', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-border rounded focus:ring-green-500" 
                />
                <div className="ml-3 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-foreground">Available now</span>
                </div>
              </label>
              <label className="flex items-center cursor-pointer group hover:bg-accent -mx-2 px-2 py-2 rounded-lg transition-colors">
                <input 
                  type="checkbox" 
                  checked={filters.isOnlineOnly}
                  onChange={(e) => handleAvailabilityChange('isOnlineOnly', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-border rounded focus:ring-green-500" 
                />
                <span className="ml-3 text-sm text-foreground">Online now</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
