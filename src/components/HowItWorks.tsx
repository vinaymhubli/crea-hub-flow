
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageCircle, Shield, Award, Play, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HowItWorksContent {
  id: string;
  section_type: string;
  title: string;
  subtitle: string;
  description: string;
  youtube_url: string;
  thumbnail_url?: string;
  is_published: boolean;
}

const HowItWorks = () => {
  const [mainContent, setMainContent] = useState<HowItWorksContent | null>(null);
  const [videoContent, setVideoContent] = useState<HowItWorksContent | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching How It Works content...');
      
      // Fetch main section content
      const { data: mainData, error: mainError } = await supabase
        .from('how_it_works_content' as any)
        .select('*')
        .eq('section_type', 'how_it_works')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      console.log('📝 Main content result:', { mainData, mainError });

      if (mainError && mainError.code !== 'PGRST116') {
        console.error('❌ Error fetching main content:', mainError);
      } else if (mainData) {
        console.log('✅ Main content loaded:', mainData);
        setMainContent(mainData as unknown as HowItWorksContent);
      }

      // Fetch video content
      const { data: videoData, error: videoError } = await supabase
        .from('how_it_works_content' as any)
        .select('*')
        .eq('section_type', 'video')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      console.log('🎥 Video content result:', { videoData, videoError });

      if (videoError && videoError.code !== 'PGRST116') {
        console.error('❌ Error fetching video content:', videoError);
      } else if (videoData) {
        console.log('✅ Video content loaded:', videoData);
        setVideoContent(videoData as unknown as HowItWorksContent);
      }
    } catch (error) {
      console.error('💥 Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnailUrl = (youtubeUrl: string) => {
    const videoId = extractVideoId(youtubeUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  const getEmbedUrl = (youtubeUrl: string) => {
    const videoId = extractVideoId(youtubeUrl);
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1` : null;
  };

  const steps = [
    {
      number: '01',
      title: 'Browse & Discover',
      description: 'Explore our curated marketplace of talented designers. Filter by style, expertise, budget, and ratings to find your perfect match.',
      icon: Search,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-600'
    },
    {
      number: '02',
      title: 'Connect & Discuss',
      description: 'Message designers directly, share your vision, and get custom quotes. Our AI assistant helps match you with the right talent.',
      icon: MessageCircle,
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-600'
    },
    {
      number: '03',
      title: 'Secure & Collaborate',
      description: 'Start your project with secure payments held in escrow. Track progress, provide feedback, and communicate through our platform.',
      icon: Shield,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-600'
    },
    {
      number: '04',
      title: 'Deliver & Review',
      description: 'Receive your completed design, request revisions if needed, and release payment. Leave reviews to help our community grow.',
      icon: Award,
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-600'
    }
  ];

  // Debug logging
  console.log('🎬 HowItWorks render state:', {
    loading,
    mainContent,
    videoContent,
    hasVideo: videoContent && videoContent.youtube_url
  });

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-12 bg-gray-200 rounded w-96 mx-auto mb-6"></div>
              <div className="h-6 bg-gray-200 rounded w-full max-w-3xl mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span className="mr-2">✨</span>
            {mainContent?.description || 'Simple & Secure Process'}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {mainContent?.title || 'How Our Platform Works'}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {mainContent?.subtitle || 'Connect with world-class designers in minutes. Our innovative platform makes hiring creative talent as easy as ordering your morning coffee.'}
          </p>
        </div>

        {/* Video Section - Show BEFORE the 4 cards if video exists */}
        {videoContent && videoContent.youtube_url && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Play className="w-4 h-4 mr-2" />
                Watch & Learn
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {videoContent.title || 'See How It Works'}
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {videoContent.subtitle || 'Watch our complete platform walkthrough'}
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                {!showVideo ? (
                  <div className="relative aspect-video">
                    {getThumbnailUrl(videoContent.youtube_url) && (
                      <img
                        src={getThumbnailUrl(videoContent.youtube_url)}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <button
                        onClick={() => setShowVideo(true)}
                        className="group bg-white/90 hover:bg-white text-gray-900 rounded-full p-6 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl"
                      >
                        <Play className="w-12 h-12 ml-1 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        YouTube
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video">
                    {getEmbedUrl(videoContent.youtube_url) && (
                      <iframe
                        src={getEmbedUrl(videoContent.youtube_url)}
                        title="Platform Walkthrough Video"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                )}
              </div>

              {!showVideo && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setShowVideo(true)}
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Complete Walkthrough
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 relative`}>
                  <step.icon className="w-8 h-8" />
                  <div className={`absolute -top-2 -right-2 w-8 h-8 ${step.bgColor} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                    {step.number}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 z-10">
                  <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-gray-200">
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl p-8 md:p-12 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Transform Your Ideas into Reality?
            </h3>
            <p className="text-lg opacity-90 mb-8">
              Join thousands of satisfied clients who've found their perfect designer match. Start your project today and see the magic happen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/designers" 
                className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                <span className="mr-2">🔍</span>
                Browse Designers
              </Link>
              <a 
                href="/post-project" 
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-600 transition-colors whitespace-nowrap"
              >
                <span className="mr-2">➕</span>
                Post a Project
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
