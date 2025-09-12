import { useState, useEffect } from 'react';
import ContactForm from '../components/ContactForm';
import MapSection from '../components/MapSection';
import { supabase } from '@/integrations/supabase/client';

interface ContactContent {
  id: string;
  section_type: 'hero' | 'contact_method';
  title: string;
  description: string;
  content: string;
  icon: string;
  contact_info: string;
  action_text: string;
  color_scheme: string;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function ContactDynamic() {
  const [content, setContent] = useState<ContactContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_page_content')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching contact content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (colorScheme: string) => {
    const colorMap = {
      green: {
        bgColor: 'bg-green-50',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        buttonBg: 'bg-green-600 hover:bg-green-700'
      },
      blue: {
        bgColor: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        buttonBg: 'bg-blue-600 hover:bg-blue-700'
      },
      purple: {
        bgColor: 'bg-purple-50',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        buttonBg: 'bg-purple-600 hover:bg-purple-700'
      },
      orange: {
        bgColor: 'bg-orange-50',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        buttonBg: 'bg-orange-600 hover:bg-orange-700'
      }
    };
    return colorMap[colorScheme as keyof typeof colorMap] || colorMap.green;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const heroContent = content.find(c => c.section_type === 'hero');
  const contactMethods = content.filter(c => c.section_type === 'contact_method');

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 to-blue-50 py-24">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20office%20space%20with%20glass%20walls%2C%20natural%20lighting%2C%20comfortable%20seating%20areas%2C%20plants%2C%20and%20a%20welcoming%20reception%20desk.%20Clean%2C%20professional%20environment%20with%20soft%20colors%2C%20and%20contemporary%20furniture.%20Bright%20and%20inviting%20workspace%20atmosphere&width=1200&height=600&seq=contact-hero-bg&orientation=landscape')`
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {heroContent?.title || 'Get in Touch'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {heroContent?.description || 'Have questions about our platform? Need help finding the perfect designer? Our team is here to help you succeed. Reach out to us anytime!'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
              <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full">
                <i className="ri-time-line text-green-600"></i>
              </div>
              <span className="text-gray-700 font-medium">24/7 Support</span>
            </div>
            
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full">
                <i className="ri-chat-smile-2-line text-blue-600"></i>
              </div>
              <span className="text-gray-700 font-medium">Live Chat Available</span>
            </div>
            
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
              <div className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-full">
                <i className="ri-phone-line text-purple-600"></i>
              </div>
              <span className="text-gray-700 font-medium">Quick Response</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Multiple Ways to Reach Us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the contact method that works best for you. We're committed to providing 
              exceptional support through every channel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactMethods.map((method, index) => {
              const colors = getColorClasses(method.color_scheme);
              return (
                <div key={method.id} className={`${colors.bgColor} rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                  <div className={`w-16 h-16 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <i className={`${method.icon} text-2xl ${colors.iconColor}`}></i>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {method.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {method.description}
                  </p>
                  
                  <p className="font-medium text-gray-800 mb-6">
                    {method.contact_info}
                  </p>
                  
                  <button className={`${colors.buttonBg} text-white px-6 py-3 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap hover:shadow-md`}>
                    {method.action_text}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <ContactForm />
      
      {/* Map Section */}
      <MapSection />
    </main>
  );
}
