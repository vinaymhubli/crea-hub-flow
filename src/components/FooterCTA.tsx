import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, MessageCircle, Search, User } from 'lucide-react';

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

export default function FooterCTA() {
  const [content, setContent] = useState<ForDesignersContent | null>(null);
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
        .eq('section_type', 'footer_cta')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setContent(data);
    } catch (error) {
      console.error('Error fetching footer CTA content:', error);
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
    };
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || UserPlus;
    return <IconComponent className="h-8 w-8" />;
  };

  if (loading || !content) {
    return null;
  }

  return (
    <div className="relative py-20 bg-gradient-to-r from-green-500 via-blue-500 to-purple-600">
      {content.background_image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${content.background_image_url})` }}
        ></div>
      )}
      <div className="relative max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          {content.title}
        </h2>
        <p className="text-xl text-white text-opacity-90 mb-12 max-w-3xl mx-auto">
          {content.subtitle}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {content.cta_cards?.cards?.map((card: any, index: number) => (
            <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
                card.card_color === 'green' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                <div className={`${
                  card.card_color === 'green' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {getIcon(card.card_icon)}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{card.title}</h3>
              <p className="text-white text-opacity-90 mb-6">{card.description}</p>
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
  );
}
