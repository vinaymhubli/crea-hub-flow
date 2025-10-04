import React, { useState, useEffect } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VideoContent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  youtube_url: string;
  thumbnail_url?: string;
  is_published: boolean;
}

const HomepageVideoSection = () => {
  const [videoContent, setVideoContent] = useState<VideoContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    fetchVideoContent();
  }, []);

  const fetchVideoContent = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_video_content')
        .select('*')
        .eq('section_type', 'video')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching video content:', error);
      } else if (data) {
        setVideoContent(data);
      }
    } catch (error) {
      console.error('Error fetching video content:', error);
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

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!videoContent || !videoContent.youtube_url) {
    return null;
  }

  const thumbnailUrl = videoContent.thumbnail_url || getThumbnailUrl(videoContent.youtube_url);
  const embedUrl = getEmbedUrl(videoContent.youtube_url);

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Play className="w-4 h-4 mr-2" />
            Watch & Learn
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {videoContent.title || 'See How It Works'}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            {videoContent.subtitle || 'Watch our complete platform walkthrough'}
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {videoContent.description || 'Discover how easy it is to find the perfect designer and get your project started in just a few simple steps.'}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
            {!showVideo ? (
              <div className="relative aspect-video">
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
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
                {embedUrl && (
                  <iframe
                    src={embedUrl}
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
    </section>
  );
};

export default HomepageVideoSection;
