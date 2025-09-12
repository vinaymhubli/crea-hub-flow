import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, MessageCircle, Search, User, Users, BarChart3 } from 'lucide-react';

interface ForDesignersContent {
  id: string;
  section_type: 'hero' | 'cta_cards' | 'stats' | 'footer_cta';
  title: string;
  subtitle: string;
  description: string;
  content: string;
  hero_data: any;
  cta_cards: any;
  stats_data: any;
  background_image_url: string;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function ForDesignersDynamic() {
  const [content, setContent] = useState<ForDesignersContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('for_designers_content')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching for designers content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const iconMap = {
      'UserPlus': UserPlus,
      'MessageCircle': MessageCircle,
      'Search': Search,
      'User': User,
      'Users': Users,
      'BarChart3': BarChart3,
    };
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || UserPlus;
    return <IconComponent className="h-8 w-8" />;
  };

  const heroContent = content.find(c => c.section_type === 'hero');
  const ctaCardsContent = content.find(c => c.section_type === 'cta_cards');
  const statsContent = content.find(c => c.section_type === 'stats');

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
        <div className={`relative py-20 bg-gradient-to-r ${heroContent.hero_data?.background_gradient || 'from-green-500 via-blue-500 to-purple-600'}`}>
          {heroContent.background_image_url && (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
              style={{ backgroundImage: `url(${heroContent.background_image_url})` }}
            ></div>
          )}
          <div className="relative max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              {heroContent.title.split(heroContent.hero_data?.highlight_text || 'Creative Journey?').map((part, index, array) => (
                <span key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <span className="text-yellow-300">{heroContent.hero_data?.highlight_text || 'Creative Journey?'}</span>
                  )}
                </span>
              ))}
            </h1>
            <p className="text-xl text-white text-opacity-90 mb-12 max-w-3xl mx-auto">
              {heroContent.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* CTA Cards Section */}
      {ctaCardsContent && (
        <div className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {ctaCardsContent.cta_cards?.cards?.map((card: any, index: number) => (
                <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
                  <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
                    card.card_color === 'green' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <div className={`${
                      card.card_color === 'green' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {getIcon(card.card_icon)}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">{card.title}</h3>
                  <p className="text-gray-600 mb-6 text-center">{card.description}</p>
                  <button className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    card.button_color === 'green'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}>
                    {card.button_text}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Section */}
      {statsContent && (
        <div className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {statsContent.stats_data?.statistics?.map((stat: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
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
