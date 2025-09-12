import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Users, Rocket, Shield, Globe, Lightbulb, ExternalLink } from 'lucide-react';

interface AboutContent {
  id: string;
  section_type: 'hero' | 'mission' | 'story' | 'values' | 'team' | 'cta' | 'value_item' | 'team_member' | 'stats';
  title: string;
  subtitle: string;
  description: string;
  content: string;
  image_url: string;
  background_image_url: string;
  icon: string;
  color_scheme: string;
  image_position: 'left' | 'right' | 'center' | 'background';
  stats: any;
  team_member: any;
  value_item: any;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function AboutDynamic() {
  const [content, setContent] = useState<AboutContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('about_page_content')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching about content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Heart,
      Users,
      Rocket,
      Shield,
      Globe,
      Lightbulb
    };
    return icons[iconName] || Heart;
  };

  const getColorClasses = (colorScheme: string) => {
    const colorMap = {
      green: 'text-green-600 bg-green-50',
      blue: 'text-blue-600 bg-blue-50',
      purple: 'text-purple-600 bg-purple-50',
      red: 'text-red-600 bg-red-50',
      orange: 'text-orange-600 bg-orange-50',
      yellow: 'text-yellow-600 bg-yellow-50'
    };
    return colorMap[colorScheme as keyof typeof colorMap] || 'text-green-600 bg-green-50';
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
  const missionContent = content.find(c => c.section_type === 'mission');
  const storyContent = content.filter(c => c.section_type === 'story');
  const valuesContent = content.find(c => c.section_type === 'values');
  const valueItems = content.filter(c => c.section_type === 'value_item');
  const teamContent = content.find(c => c.section_type === 'team');
  const teamMembers = content.filter(c => c.section_type === 'team_member');
  const statsContent = content.filter(c => c.section_type === 'stats');
  const ctaContent = content.find(c => c.section_type === 'cta');

  return (
    <main>
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50"
        style={{
          backgroundImage: heroContent?.background_image_url ? `url('${heroContent.background_image_url}')` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-white/80"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {heroContent?.title || 'Revolutionizing Design'}
            <span className="block text-green-600">{heroContent?.subtitle || 'Collaboration'}</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            {heroContent?.description || 'We\'re building a revolutionary real-time design platform that connects visionary clients with world-class designers for seamless creative collaboration worldwide.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
              <span className="font-semibold">Trusted by 10,000+ Clients</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              </div>
              <span className="font-semibold">5,000+ Expert Designers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                {missionContent?.title || 'Our Mission is Simple:'}
                <span className="block text-green-600">{missionContent?.subtitle || 'Bridge Creative Gaps'}</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {missionContent?.description || 'We believe every business deserves access to exceptional design talent. Our platform eliminates geographical barriers and connects you with skilled designers who understand your vision and can bring it to life in real-time.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full mt-1">
                    <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Innovation First</h3>
                    <p className="text-gray-600 text-sm">Cutting-edge tools and processes</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mt-1">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Quality Focused</h3>
                    <p className="text-gray-600 text-sm">Premium design standards always</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              {missionContent?.image_url && (
                <img 
                  src={missionContent.image_url}
                  alt="Our Mission"
                  className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                />
              )}
              <div className="absolute -bottom-6 -right-6 bg-green-600 text-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold">99%</div>
                <div className="text-sm">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {storyContent.find(s => s.title === 'From a simple idea to a leading design collaboration platform')?.title || 'From a simple idea to a leading design collaboration platform'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {storyContent.find(s => s.title === 'From a simple idea to a leading design collaboration platform')?.subtitle || 'From a simple idea to a leading design collaboration platform'}
            </p>
          </div>

          {storyContent.filter(s => s.title !== 'From a simple idea to a leading design collaboration platform').map((story, index) => {
            const isImageLeft = story.image_position === 'left';
            const isImageRight = story.image_position === 'right';
            const isImageCenter = story.image_position === 'center';
            
            if (isImageCenter) {
              return (
                <div key={story.id} className={`${index > 0 ? 'mt-16' : ''}`}>
                  <div className="text-center mb-8">
                    <div className={`${story.color_scheme === 'green' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} px-4 py-2 rounded-full text-sm font-semibold inline-block mb-4`}>
                      {story.subtitle}
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-6">{story.title}</h3>
                    <p className="text-lg text-gray-600 leading-relaxed max-w-4xl mx-auto">
                      {story.description}
                    </p>
                  </div>
                  {story.image_url && (
                    <div className="flex justify-center">
                      <img 
                        src={story.image_url}
                        alt={story.title}
                        className="w-full max-w-2xl h-96 object-cover rounded-2xl shadow-xl"
                      />
                    </div>
                  )}
                  {index === 1 && statsContent.length > 0 && (
                    <div className="mt-8 grid grid-cols-3 gap-8">
                      {statsContent.map((stat, statIndex) => (
                        <div key={stat.id} className="text-center">
                          <div className={`text-3xl font-bold ${
                            stat.stats?.color === 'green' ? 'text-green-600' :
                            stat.stats?.color === 'blue' ? 'text-blue-600' :
                            'text-purple-600'
                          }`}>
                            {stat.stats?.value || '0'}
                          </div>
                          <div className="text-sm text-gray-600">{stat.title}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <div key={story.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${index > 0 ? 'mt-16' : ''}`}>
                <div className={isImageLeft ? 'order-1' : 'order-2'}>
                  {story.image_url && (
                    <img 
                      src={story.image_url}
                      alt={story.title}
                      className="w-full h-96 object-cover rounded-2xl shadow-xl"
                    />
                  )}
                </div>
                <div className={isImageLeft ? 'order-2' : 'order-1'}>
                  <div className={`${story.color_scheme === 'green' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} px-4 py-2 rounded-full text-sm font-semibold inline-block mb-4`}>
                    {story.subtitle}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{story.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {story.description}
                  </p>
                  {index === 1 && statsContent.length > 0 && (
                    <div className="mt-8 grid grid-cols-3 gap-8">
                      {statsContent.map((stat, statIndex) => (
                        <div key={stat.id} className="text-center">
                          <div className={`text-3xl font-bold ${
                            stat.stats?.color === 'green' ? 'text-green-600' :
                            stat.stats?.color === 'blue' ? 'text-blue-600' :
                            'text-purple-600'
                          }`}>
                            {stat.stats?.value || '0'}
                          </div>
                          <div className="text-sm text-gray-600">{stat.title}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {valuesContent?.title || 'Our Core Values'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {valuesContent?.subtitle || 'These principles guide everything we do and shape the culture of our platform'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {valueItems.map((value, index) => {
              const IconComponent = getIconComponent(value.icon);
              const colorClasses = getColorClasses(value.color_scheme);
              return (
                <div key={value.id} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
                  <div className={`w-16 h-16 flex items-center justify-center rounded-2xl mb-6 ${colorClasses}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          {ctaContent && (
            <div className="mt-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-center text-white">
              <h3 className="text-3xl font-bold mb-6">{ctaContent.title}</h3>
              <p className="text-xl mb-8 opacity-90">
                {ctaContent.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap">
                  Browse Designers
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-green-600 transition-colors cursor-pointer whitespace-nowrap">
                  Start Your Project
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {teamContent?.title || 'Meet Our Team'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {teamContent?.subtitle || 'Passionate individuals working together to revolutionize the design industry'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={member.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="relative mb-6">
                  {member.image_url && (
                    <img 
                      src={member.image_url}
                      alt={member.title}
                      className="w-32 h-32 object-cover rounded-full mx-auto mb-4 ring-4 ring-gray-100"
                    />
                  )}
                  <div className="absolute bottom-0 right-1/2 transform translate-x-16 translate-y-2">
                    <a 
                      href={member.team_member?.linkedin || '#'}
                      className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.title}</h3>
                  <p className="text-green-600 font-semibold mb-4">{member.subtitle}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Want to Join Our Team?</h3>
              <p className="text-gray-600 mb-6">
                We're always looking for talented individuals who share our passion for design and innovation.
              </p>
              <button className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap">
                View Open Positions
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
