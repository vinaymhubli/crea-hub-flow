
import React, { useState } from 'react';

const FilterSidebar = () => {
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const categories = [
    { name: 'UI/UX Design', count: 45 },
    { name: 'Web Design', count: 38 },
    { name: 'Mobile App Design', count: 32 },
    { name: 'Brand Identity', count: 28 },
    { name: 'Graphic Design', count: 41 },
    { name: 'Product Design', count: 25 },
    { name: 'Illustration', count: 19 },
    { name: 'Animation', count: 15 }
  ];

  const skills = [
    'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 
    'InDesign', 'Webflow', 'Framer', 'After Effects', 'Prototyping'
  ];

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const clearAllFilters = () => {
    setPriceRange([0, 200]);
    setSelectedSkills([]);
    setSelectedCategories([]);
    setSelectedRating(null);
  };

  const hasActiveFilters = selectedSkills.length > 0 || selectedCategories.length > 0 || selectedRating !== null || priceRange[1] < 200;

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
              {selectedSkills.length + selectedCategories.length + (selectedRating ? 1 : 0)} active filters
            </span>
            <button
              onClick={clearAllFilters}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
      
      <div className={`${isCollapsed ? 'hidden' : 'block'} lg:block`}>
        <div className="p-6 space-y-8">
          <div>
            <h4 className="font-medium text-foreground mb-4 flex items-center space-x-2">
              <span>💰</span>
              <span>Price Range (per hour)</span>
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-muted px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-foreground">${priceRange[0]}</span>
                </div>
                <div className="bg-muted px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-foreground">${priceRange[1]}+</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

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
                      checked={selectedCategories.includes(category.name)}
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
                    selectedSkills.includes(skill)
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : 'bg-background border-border text-foreground hover:border-green-200 hover:bg-green-50'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

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
                    checked={selectedRating === rating}
                    onChange={() => setSelectedRating(rating)}
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
                    <span className="text-sm text-foreground">& up ({rating === 5 ? '12' : rating === 4 ? '28' : '45'} designers)</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-4 flex items-center space-x-2">
              <span>🟢</span>
              <span>Availability</span>
            </h4>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer group hover:bg-accent -mx-2 px-2 py-2 rounded-lg transition-colors">
                <input type="checkbox" className="w-4 h-4 text-green-600 border-border rounded focus:ring-green-500" />
                <div className="ml-3 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-foreground">Available now</span>
                </div>
              </label>
              <label className="flex items-center cursor-pointer group hover:bg-accent -mx-2 px-2 py-2 rounded-lg transition-colors">
                <input type="checkbox" className="w-4 h-4 text-green-600 border-border rounded focus:ring-green-500" />
                <span className="ml-3 text-sm text-foreground">Online now</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-muted">
          <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm">
            Apply Filters
          </button>
          {hasActiveFilters && (
            <button 
              onClick={clearAllFilters}
              className="w-full mt-3 text-muted-foreground py-2 font-medium hover:text-foreground transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
