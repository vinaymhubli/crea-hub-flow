
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowLeft, ArrowRight } from 'lucide-react';

const FeaturedDesigners = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const designers = [
    {
      id: 1,
      name: 'Sarah Chen',
      specialty: 'UI/UX Design',
      rating: 4.9,
      reviews: 127,
      pricePerMin: 2.1,
      bio: 'I specialize in creating intuitive user experiences and modern interfaces with over 5 years of experience working with startups and Fortune 500 companies.',
      image: 'https://readdy.ai/api/search-image?query=professional%20female%20asian%20designer%20working%20on%20laptop%20in%20modern%20office%2C%20creative%20workspace%20with%20design%20tools%2C%20smiling%20confident%20expression%2C%20contemporary%20style%2C%20bright%20lighting%2C%20minimalist%20background%20with%20plants%20and%20design%20elements&width=400&height=400&seq=featured-1&orientation=squarish',
      tools: ['Figma', 'Sketch', 'InVision'],
      projects: 89,
      isOnline: true,
      availability: 'Available'
    },
    {
      id: 2,
      name: 'Marcus Johnson',
      specialty: 'Brand Identity',
      rating: 4.8,
      reviews: 94,
      pricePerMin: 1.8,
      bio: 'I create memorable brands and logos with over 7 years of experience working with both startups and established businesses. My design philosophy focuses on clean, functional aesthetics.',
      image: 'https://readdy.ai/api/search-image?query=professional%20african%20american%20male%20graphic%20designer%20in%20creative%20studio%2C%20working%20on%20brand%20identity%20projects%2C%20focused%20expression%2C%20modern%20workspace%20with%20color%20swatches%20and%20design%20materials%2C%20natural%20lighting&width=400&height=400&seq=featured-2&orientation=squarish',
      tools: ['Illustrator', 'Photoshop', 'InDesign'],
      projects: 76,
      isOnline: false,
      availability: 'Available'
    },
    {
      id: 3,
      name: 'Elena Rodriguez',
      specialty: 'Web Design',
      rating: 5.0,
      reviews: 156,
      pricePerMin: 2.5,
      bio: 'Passionate about creating stunning websites that convert visitors into customers. I blend creativity with technical expertise to deliver exceptional web experiences.',
      image: 'https://readdy.ai/api/search-image?query=professional%20hispanic%20female%20web%20designer%20at%20computer%20workstation%2C%20multiple%20monitors%20showing%20website%20designs%2C%20creative%20office%20environment%2C%20confident%20pose%2C%20modern%20tech%20setup%20with%20design%20tools%20and%20references&width=400&height=400&seq=featured-3&orientation=squarish',
      tools: ['Webflow', 'WordPress', 'Figma'],
      projects: 112,
      isOnline: true,
      availability: 'Available'
    }
  ];

  const slidesToShow = 2;
  const totalSlides = Math.ceil(designers.length / slidesToShow);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);

    return () => clearInterval(interval);
  }, [totalSlides, isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Featured Designers
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet some of our top-rated designers who consistently deliver exceptional results for clients worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="relative bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl p-8 overflow-hidden">
              <img 
                src="https://readdy.ai/api/search-image?query=modern%20collaborative%20design%20workspace%20illustration%2C%20multiple%20designers%20working%20together%20on%20creative%20projects%2C%20digital%20collaboration%20tools%2C%20clean%20minimalist%20style%20with%20green%20and%20blue%20accents%2C%20professional%20teamwork%20environment%2C%20contemporary%20flat%20design%20aesthetic&width=600&height=500&seq=collab-illustration&orientation=landscape"
                alt="Design Collaboration"
                className="w-full h-full object-cover object-top rounded-2xl"
              />
              
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-green-500/20 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-blue-500/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Active Designers</div>
              </div>
              
              <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Live Now</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-1 gap-6">
                      {designers.slice(slideIndex * slidesToShow, (slideIndex + 1) * slidesToShow).map((designer) => (
                        <div key={designer.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 group">
                          <div className="flex items-start space-x-4">
                            <div className="relative">
                              <img 
                                src={designer.image} 
                                alt={designer.name}
                                className="w-16 h-16 rounded-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                              />
                              {designer.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{designer.name}</h3>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm font-semibold text-gray-700">{designer.rating}</span>
                                  {/* <span className="text-xs text-gray-500">({designer.reviews})</span>
                                </div> */}
                              </div>
                              
                              <p className="text-green-600 font-medium text-sm mb-2">{designer.specialty}</p>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{designer.bio}</p>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {designer.tools.slice(0, 3).map((tool, index) => (
                                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium hover:bg-green-100 hover:text-green-700 transition-colors">
                                    {tool}
                                  </span>
                                ))}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-gray-900">
                                  ${designer.pricePerMin}<span className="text-sm font-normal text-gray-500">/min</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  designer.availability === 'Available' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {designer.isOnline ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button 
                onClick={prevSlide}
                className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-green-300 hover:shadow-md transition-all duration-200 group"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
              </button>
              
              <div className="flex space-x-2">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      currentSlide === index 
                        ? 'bg-green-600 w-8' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              <button 
                onClick={nextSlide}
                className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-green-300 hover:shadow-md transition-all duration-200 group"
              >
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link 
            to="/designers" 
            className="bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-700 transition-colors whitespace-nowrap inline-flex items-center space-x-2 group"
          >
            <span>Browse All Designers</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDesigners;
