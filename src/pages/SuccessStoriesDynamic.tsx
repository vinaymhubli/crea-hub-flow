import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Award, TrendingUp, Users, Star, Search, Play, UserPlus, MessageCircle, User, Quote } from 'lucide-react';

interface SuccessStoriesContent {
  id: string;
  section_type: 'hero' | 'stats' | 'story' | 'testimonial' | 'cta';
  title: string;
  subtitle: string;
  description: string;
  content: string;
  category: string;
  duration: string;
  metrics: any;
  achievements: string[];
  testimonial_data: any;
  designer_data: any;
  stats_data: any;
  cta_data: any;
  image_url: string;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function SuccessStoriesDynamic() {
  const [content, setContent] = useState<SuccessStoriesContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('success_stories_content')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data as any || []);
    } catch (error) {
      console.error('Error fetching success stories content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const iconMap = {
      'Award': Award,
      'TrendingUp': TrendingUp,
      'Users': Users,
      'Star': Star,
    };
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Star;
    return <IconComponent className="h-6 w-6" />;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const heroContent = content.find(c => c.section_type === 'hero');
  const statsContent = content.filter(c => c.section_type === 'stats');
  const storyContent = content.filter(c => c.section_type === 'story');
  const ctaContent = content.filter(c => c.section_type === 'cta');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      {heroContent && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm mb-6">
              <Users className="h-4 w-4" />
              Success Stories
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {heroContent.title}
            </h1>
            <p className="text-xl text-gray-600">
              {heroContent.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Statistics Section */}
      {statsContent.map((stats, index) => (
        <div key={stats.id} className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.stats_data?.statistics?.map((stat: any, statIndex: number) => (
                <div key={statIndex} className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                    {getIcon(stat.icon)}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Transformative Partnerships Section */}
      {ctaContent.find(c => c.title === 'Transformative Partnerships') && (
        <div className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Transformative Partnerships</h2>
            <p className="text-xl text-gray-600 mb-12">
              See how our designers have helped businesses achieve extraordinary results
            </p>
          </div>
        </div>
      )}

      {/* Success Stories */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-16">
            {storyContent.map((story, index) => (
              <div key={story.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                {/* Story Card */}
                <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                    <div className="flex gap-2 mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {story.category}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        {story.duration}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">{story.title}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{story.metrics?.revenue}</div>
                        <div className="text-sm text-gray-600">Revenue</div>
                        <div className="flex items-center mt-1">
                          {renderStars(story.metrics?.rating || 5)}
                          <span className="ml-1 text-sm text-gray-600">Rating</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{story.metrics?.growth}</div>
                        <div className="text-sm text-gray-600">Growth</div>
                        <div className="flex items-center mt-1">
                          {renderStars(story.metrics?.rating || 5)}
                          <span className="ml-1 text-sm text-gray-600">Rating</span>
                        </div>
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {story.achievements?.map((achievement, achIndex) => (
                        <li key={achIndex} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-600">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                      Find Your Designer
                    </button>
                  </div>
                </div>

                {/* Testimonial */}
                <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <div className="relative">
                    <Quote className="h-16 w-16 text-blue-100 mb-6" />
                    <blockquote className="text-xl text-gray-700 mb-6 leading-relaxed">
                      "{story.testimonial_data?.quote}"
                    </blockquote>
                    <div className="mb-6">
                      <div className="font-semibold text-gray-900">{story.testimonial_data?.client_name}</div>
                      <div className="text-gray-600">{story.testimonial_data?.client_title}</div>
                      <div className="text-gray-500 text-sm">{story.testimonial_data?.company}</div>
                    </div>
                    <div className="border-t pt-6">
                      <div className="text-sm text-gray-600 mb-2">Designer</div>
                      <div className="font-semibold text-gray-900">{story.designer_data?.name}</div>
                      <div className="flex items-center gap-2 mt-2">
                        {renderStars(story.designer_data?.rating || 5)}
                        
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Sections */}
      {ctaContent.filter(c => c.title !== 'Transformative Partnerships').map((cta, index) => (
        <div key={cta.id} className={`py-16 ${index === 0 ? 'bg-gray-50' : 'bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 relative'}`}>
          {index === 1 && (
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          )}
          <div className="max-w-4xl mx-auto px-4 text-center relative">
            <h2 className={`text-3xl font-bold mb-4 ${index === 1 ? 'text-white' : 'text-gray-900'}`}>
              {cta.title}
            </h2>
            <p className={`text-xl mb-8 ${index === 1 ? 'text-white' : 'text-gray-600'}`}>
              {cta.subtitle}
            </p>
            
            {cta.cta_data?.buttons && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {cta.cta_data.buttons.map((button: any, btnIndex: number) => (
                  <button
                    key={btnIndex}
                    className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                      button.type === 'primary'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {button.text}
                  </button>
                ))}
              </div>
            )}

            {cta.cta_data?.cards && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                {cta.cta_data.cards.map((card: any, cardIndex: number) => (
                  <div key={cardIndex} className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
                      card.color === 'green' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {card.icon === 'UserPlus' ? (
                        <UserPlus className="h-8 w-8 text-green-600" />
                      ) : (
                        <MessageCircle className="h-8 w-8 text-blue-600" />
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{card.title}</h3>
                    <p className="text-white text-opacity-90 mb-6">{card.description}</p>
                    <button className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                      card.color === 'green'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}>
                      {card.button_text}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Final Statistics */}
      {statsContent.find(s => s.title === 'Platform Statistics') && (
        <div className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {statsContent.find(s => s.title === 'Platform Statistics')?.stats_data?.statistics?.map((stat: any, statIndex: number) => (
                <div key={statIndex} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
