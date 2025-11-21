
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDesignerAverageRatings } from '@/hooks/useDesignerAverageRatings';

const FeaturedDesigners = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [designers, setDesigners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get average ratings for all designers
  const designerRatings = useDesignerAverageRatings(designers);

  // Fetch featured designers from database
  useEffect(() => {
    const fetchFeaturedDesigners = async () => {
      try {
        setLoading(true);

        // Get featured designer IDs
        const { data: featuredData, error: featuredError } = await supabase
          .from('featured_designers')
          .select('designer_id, position')
          .eq('is_active', true)
          .order('position', { ascending: true })
          .limit(6); // Get top 6 featured designers

        if (featuredError) throw featuredError;

        if (!featuredData || featuredData.length === 0) {
          setDesigners([]);
          return;
        }

        const designerIds = featuredData.map((fd: any) => fd.designer_id);

        // Fetch designer details
        const { data: designersData, error: designersError } = await supabase
          .from('designers')
          .select(`
            *,
            user:profiles!user_id(blocked, user_type)
          `)
          .in('user_id', designerIds)
          .eq('user.blocked', false)
          .eq('user.user_type', 'designer')
          .eq('verification_status', 'approved');

        if (designersError) throw designersError;

        // Fetch profiles for each designer
        const designersWithProfiles = await Promise.all(
          (designersData || []).map(async (designer) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name, avatar_url, email')
              .eq('user_id', designer.user_id)
              .single();

            return {
              ...designer,
              profiles: profileData
            };
          })
        );

        // Sort by featured position
        const sortedDesigners = designersWithProfiles.sort((a, b) => {
          const aPos = featuredData.find((fd: any) => fd.designer_id === a.user_id)?.position || 999;
          const bPos = featuredData.find((fd: any) => fd.designer_id === b.user_id)?.position || 999;
          return aPos - bPos;
        });

        setDesigners(sortedDesigners);
      } catch (error) {
        console.error('Error fetching featured designers:', error);
        setDesigners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedDesigners();
  }, []);

  const slidesToShow = 2;
  const totalSlides = Math.max(1, Math.ceil(designers.length / slidesToShow));

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

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (designers.length === 0) {
    return null; // Don't show the section if no featured designers
  }

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
                      {designers.slice(slideIndex * slidesToShow, (slideIndex + 1) * slidesToShow).map((designer) => {
                        const avgRating = designerRatings[designer.id] ?? 0;
                        const designerName = designer.profiles?.first_name && designer.profiles?.last_name 
                          ? `${designer.profiles.first_name} ${designer.profiles.last_name}` 
                          : designer.profiles?.email?.split('@')[0] || 'Designer';
                        
                        return (
                        <div key={designer.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 group">
                          <div className="flex items-start space-x-4">
                            <div className="relative">
                              {designer.profiles?.avatar_url ? (
                                <img 
                                  src={designer.profiles.avatar_url} 
                                  alt={designerName}
                                  className="w-16 h-16 rounded-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold group-hover:scale-105 transition-transform duration-300">
                                  {designer.profiles?.first_name?.[0]?.toUpperCase() || 'D'}
                                  {designer.profiles?.last_name?.[0]?.toUpperCase() || 'E'}
                                </div>
                              )}
                              {designer.is_online && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{designerName}</h3>
                                {avgRating > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-sm font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-green-600 font-medium text-sm mb-2">{designer.specialty || 'Design Expert'}</p>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{designer.bio || 'Professional designer ready to bring your vision to life.'}</p>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {(designer.skills || []).slice(0, 3).map((skill: string, index: number) => (
                                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium hover:bg-green-100 hover:text-green-700 transition-colors">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-gray-900">
                                  ₹{designer.hourly_rate}<span className="text-sm font-normal text-gray-500">/min</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  designer.is_online 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {designer.is_online ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                      })}
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
