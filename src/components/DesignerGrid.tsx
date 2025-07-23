
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DesignerGrid = () => {
  const [sortBy, setSortBy] = useState('rating');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest' }
  ];

  const designers = [
    {
      id: 1,
      name: 'Rajiv Kumar',
      specialty: 'Logo Design, Branding, Print Design',
      rating: 4.8,
      reviews: 124,
      pricePerMin: 2.0,
      bio: 'I specialize in creating memorable brands and logos with over 7 years of experience working with both startups and established businesses. My design philosophy focuses on clean, functional aesthetics that communicate your brand\'s values effectively.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      skills: ['Logo Design', 'Branding', 'Print Design', 'Illustrator'],
      completedProjects: 89,
      availability: 'Available',
      location: 'Mumbai, India',
      isOnline: true,
      responseTime: '1 hour'
    },
    {
      id: 2,
      name: 'Sarah Chen',
      specialty: 'UI/UX Design, Mobile App Design',
      rating: 4.9,
      reviews: 187,
      pricePerMin: 2.3,
      bio: 'I create intuitive user experiences and beautiful interfaces for mobile and web applications. With 6+ years in the industry, I focus on user-centered design that drives engagement and conversions.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b332c693?w=400&h=400&fit=crop&crop=face',
      skills: ['UI/UX Design', 'Figma', 'Prototyping', 'User Research'],
      completedProjects: 127,
      availability: 'Available',
      location: 'San Francisco, CA',
      isOnline: true,
      responseTime: '30 mins'
    },
    {
      id: 3,
      name: 'Marcus Johnson',
      specialty: 'Brand Identity, Visual Identity',
      rating: 4.7,
      reviews: 95,
      pricePerMin: 1.8,
      bio: 'Brand strategist and visual designer helping businesses build strong identities. I work with companies of all sizes to create cohesive brand experiences that resonate with their target audience.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      skills: ['Brand Strategy', 'Visual Identity', 'Illustrator', 'Photoshop'],
      completedProjects: 76,
      availability: 'Available',
      location: 'New York, NY',
      isOnline: false,
      responseTime: '2 hours'
    },
    {
      id: 4,
      name: 'Elena Rodriguez',
      specialty: 'Web Design, E-commerce Design',
      rating: 5.0,
      reviews: 156,
      pricePerMin: 2.5,
      bio: 'Passionate about creating stunning websites that convert visitors into customers. I specialize in responsive web design and e-commerce solutions that blend creativity with technical expertise.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      skills: ['Web Design', 'Webflow', 'CSS', 'E-commerce'],
      completedProjects: 134,
      availability: 'Busy',
      location: 'Los Angeles, CA',
      isOnline: true,
      responseTime: '1 hour'
    },
    {
      id: 5,
      name: 'David Kim',
      specialty: 'Mobile App Design, Product Design',
      rating: 4.8,
      reviews: 112,
      pricePerMin: 2.1,
      bio: 'Product designer specializing in mobile applications and digital products. I help startups and established companies create user-friendly apps that solve real problems and delight users.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
      skills: ['Mobile UI', 'Product Design', 'Prototyping', 'User Testing'],
      completedProjects: 98,
      availability: 'Available',
      location: 'Seattle, WA',
      isOnline: true,
      responseTime: '45 mins'
    },
    {
      id: 6,
      name: 'Isabella Torres',
      specialty: 'Graphic Design, Print Design',
      rating: 4.6,
      reviews: 89,
      pricePerMin: 1.6,
      bio: 'Creative graphic designer with expertise in print and digital media. I love bringing ideas to life through compelling visual communications that make brands stand out in crowded markets.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
      skills: ['Graphic Design', 'InDesign', 'Print Design', 'Typography'],
      completedProjects: 67,
      availability: 'Available',
      location: 'Miami, FL',
      isOnline: false,
      responseTime: '3 hours'
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <p className="text-muted-foreground font-medium">{designers.length} designers found</p>
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">
              {designers.filter(d => d.isOnline).length} online now
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
                  <img 
                    src={designer.image} 
                    alt={designer.name}
                    className="w-20 h-20 rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {designer.isOnline && (
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
                      {designer.name}
                    </h3>
                    <p className="text-green-600 font-medium text-sm mb-2">{designer.specialty}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-lg font-semibold text-foreground ml-1">{designer.rating}</span>
                        <span className="text-sm text-muted-foreground ml-1">({designer.reviews})</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        designer.isOnline 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {designer.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    {/* Bio */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{designer.bio}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2">
                      {designer.skills.map((skill, index) => (
                        <span key={index} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium hover:bg-green-100 hover:text-green-700 transition-colors duration-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Side - Price and Actions */}
                  <div className="flex-shrink-0 lg:text-right">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      ${designer.pricePerMin}<span className="text-base font-normal text-muted-foreground">/min</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Usually responds in {designer.responseTime}</p>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 lg:w-48">
                      <Link to={`/designer/${designer.id}`} className="bg-green-600 text-white py-2 px-4 rounded-xl text-sm font-medium hover:bg-green-700 transition-all duration-200 text-center">
                        View Profile
                      </Link>
                      <button className="bg-background border border-green-600 text-green-600 py-2 px-4 rounded-xl text-sm font-medium hover:bg-green-50 transition-all duration-200">
                        Chat
                      </button>
                      <button className="bg-background border border-blue-600 text-blue-600 py-2 px-4 rounded-xl text-sm font-medium hover:bg-blue-50 transition-all duration-200">
                        Book
                      </button>
                      <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200">
                        Design Session
                      </button>
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
