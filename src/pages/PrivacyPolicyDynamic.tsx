import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Users, Lock, Shield, FileText, Settings, Database, Globe } from 'lucide-react';

interface PrivacyPolicyContent {
  id: string;
  section_type: 'hero' | 'content' | 'card';
  title: string;
  subtitle: string;
  description: string;
  content: string;
  icon: string;
  card_items: string[];
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function PrivacyPolicyDynamic() {
  const [content, setContent] = useState<PrivacyPolicyContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('privacy_policy_content')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching privacy policy content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const iconMap = {
      'Eye': Eye,
      'Users': Users,
      'Lock': Lock,
      'Shield': Shield,
      'FileText': FileText,
      'Settings': Settings,
      'Database': Database,
      'Globe': Globe,
    };
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Shield;
    return <IconComponent className="h-6 w-6" />;
  };

  const heroContent = content.find(c => c.section_type === 'hero');
  const contentSections = content.filter(c => c.section_type === 'content');
  const cardSections = content.filter(c => c.section_type === 'card');

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
              <Lock className="h-4 w-4" />
              Privacy Policy
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Content Sections */}
          {contentSections.map((section, index) => (
            <div key={section.id} className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {section.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {section.description}
              </p>
            </div>
          ))}

          {/* Card Sections */}
          {cardSections.map((card, index) => (
            <div key={card.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  {getIcon(card.icon)}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {card.title}
                </h2>
              </div>
              <div className="pl-15">
                <ul className="space-y-3">
                  {card.card_items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
