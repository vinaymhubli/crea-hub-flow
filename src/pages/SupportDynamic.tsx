import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, BookOpen, HelpCircle, Monitor, MessageSquare, Clock, Phone, ChevronDown } from 'lucide-react';

interface SupportContent {
  id: string;
  section_type: 'hero' | 'tabs' | 'faq' | 'guides' | 'system_status' | 'contact' | 'urgent_help';
  title: string;
  subtitle: string;
  description: string;
  content: string;
  tab_name: string;
  card_data: any;
  form_fields: any;
  status_data: any;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function SupportDynamic() {
  const [content, setContent] = useState<SupportContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('FAQ');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_page_content')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching support content:', error);
    } finally {
      setLoading(false);
    }
  };

  const heroContent = content.find(c => c.section_type === 'hero');
  const faqContent = content.filter(c => c.section_type === 'faq');
  const guidesContent = content.filter(c => c.section_type === 'guides');
  const systemStatusContent = content.find(c => c.section_type === 'system_status');
  const contactContent = content.find(c => c.section_type === 'contact');
  const urgentHelpContent = content.find(c => c.section_type === 'urgent_help');

  const tabs = ['FAQ', 'Guides', 'System Status', 'Contact'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'FAQ':
        return (
          <div className="space-y-4">
            {faqContent.map((faq) => (
              <div key={faq.id} className="border rounded-lg">
                <button
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                >
                  <span className="font-medium">{faq.title}</span>
                  <ChevronDown 
                    className={`h-5 w-5 transition-transform ${
                      expandedFAQ === faq.id ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-4 pb-4 text-gray-600">
                    {faq.card_data?.content || faq.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      
      case 'Guides':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guidesContent.map((guide) => (
              <div key={guide.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{guide.title}</h3>
                  {guide.card_data?.badge && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {guide.card_data.badge}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  {guide.card_data?.content || guide.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{guide.card_data?.read_time}</span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Read More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'System Status':
        return (
          <div className="space-y-6">
            {systemStatusContent && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold">System Status</h2>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {systemStatusContent.status_data?.overall_status || 'Healthy'}
                  </span>
                </div>
                <p className="text-gray-600 mb-6">
                  Last updated: {systemStatusContent.status_data?.last_updated || 'Recently'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {systemStatusContent.status_data?.services?.map((service: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">Uptime: {service.uptime}</p>
                      <p className="text-sm text-green-600">{service.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'Contact':
        return (
          <div className="max-w-2xl mx-auto">
            {contactContent && (
              <div>
                <h2 className="text-2xl font-bold mb-2">{contactContent.title}</h2>
                <h3 className="text-lg font-semibold mb-2">{contactContent.form_fields?.form_title}</h3>
                <p className="text-gray-600 mb-6">{contactContent.form_fields?.form_description}</p>
                
                <form className="space-y-4">
                  {contactContent.form_fields?.fields?.map((field: any, index: number) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={field.placeholder}
                          rows={4}
                          maxLength={field.max_length}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">{field.placeholder}</option>
                          {field.options?.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={field.placeholder}
                          required={field.required}
                        />
                      )}
                      {field.max_length && (
                        <p className="text-sm text-gray-500 mt-1">0/{field.max_length} characters</p>
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {heroContent.title}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {heroContent.subtitle}
            </p>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for help articles, guides, or FAQs..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>

      {/* Urgent Help Section */}
      {urgentHelpContent && (
        <div className="bg-red-50 border-t border-red-200 py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Clock className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {urgentHelpContent.title}
            </h2>
            <p className="text-gray-600 mb-6">
              {urgentHelpContent.subtitle}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Phone className="h-5 w-5 text-red-600" />
              <span className="text-lg font-semibold text-red-600">
                {urgentHelpContent.description}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
