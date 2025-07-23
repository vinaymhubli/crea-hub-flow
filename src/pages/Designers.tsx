
import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DesignerGrid from '../components/DesignerGrid';
import FilterSidebar from '../components/FilterSidebar';

const Designers = () => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
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
                <button className="flex items-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
                  <span>🔍</span>
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <FilterSidebar />
            </div>
            <div className="lg:w-3/4">
              <DesignerGrid />
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Designers;
