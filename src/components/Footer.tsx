
import React, { useState, useEffect } from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Logo {
  id: string;
  logo_type: string;
  logo_url: string;
  alt_text: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

const PLATFORM_ICONS = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  default: Globe
};

const Footer = () => {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSocialLinks();
    fetchLogos();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSocialLinks(data || []);
    } catch (error) {
      console.error('Error fetching social media links:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogos = async () => {
    try {
      const { data, error } = await supabase
        .from('logo_management')
        .select('*')
        .eq('is_active', true)
        .order('logo_type', { ascending: true });

      if (error) throw error;
      setLogos(data || []);
    } catch (error) {
      console.error('Error fetching logos:', error);
    }
  };

  const getPlatformIcon = (icon: string | null) => {
    const iconKey = icon || 'default';
    const IconComponent = PLATFORM_ICONS[iconKey as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.default;
    return <IconComponent className="w-5 h-5" />;
  };

  const getFooterLogo = () => {
    const footerLogo = logos.find(logo => logo.logo_type === 'footer_logo');
    return footerLogo?.logo_url || 'https://res.cloudinary.com/dknafpppp/image/upload/v1757697849/logo_final_2_x8c1wu.png';
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <img 
                src={getFooterLogo()} 
                alt="Meet My Designer" 
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-400 leading-relaxed mb-6">
              Connect with top designers worldwide. Build amazing products with our trusted marketplace of creative professionals.
            </p>
            <div className="flex space-x-4">
              {loading ? (
                // Show loading state with default icons
                <>
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full animate-pulse">
                    <Twitter className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full animate-pulse">
                    <Linkedin className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full animate-pulse">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full animate-pulse">
                    <Facebook className="w-5 h-5" />
                  </div>
                </>
              ) : (
                // Show dynamic social media links
                socialLinks.map((link) => (
                  <a 
                    key={link.id}
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-green-600 transition-colors"
                    title={link.platform}
                  >
                    {getPlatformIcon(link.icon)}
                  </a>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">For Clients</h3>
            <ul className="space-y-4">
              <li><Link to="/designers" className="text-gray-400 hover:text-green-400 transition-colors">Browse Designers</Link></li>
              <li><Link to="/how-to-use" className="text-gray-400 hover:text-green-400 transition-colors">How It Works</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-green-400 transition-colors">Pricing</Link></li>
              <li><Link to="/success-stories" className="text-gray-400 hover:text-green-400 transition-colors">Success Stories</Link></li>
              <li><Link to="/support" className="text-gray-400 hover:text-green-400 transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">For Designers</h3>
            <ul className="space-y-4">
              <li><Link to="/for-designers" className="text-gray-400 hover:text-green-400 transition-colors">Join as Designer</Link></li>
              <li><Link to="/designer-resources" className="text-gray-400 hover:text-green-400 transition-colors">Resources</Link></li>
              <li><Link to="/designer-community" className="text-gray-400 hover:text-green-400 transition-colors">Community</Link></li>
              <li><Link to="/designer-help" className="text-gray-400 hover:text-green-400 transition-colors">Help Center</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-green-400 transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-gray-400 hover:text-green-400 transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="text-gray-400 hover:text-green-400 transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-green-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-green-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-green-400 transition-colors">Terms and Conditions</Link></li>
              <li><Link to="/refund-policy" className="text-gray-400 hover:text-green-400 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Meet My Designers All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <span className="text-gray-400 text-sm">Made with</span>
            <span className="text-green-500">❤️</span>
            <span className="text-gray-400 text-sm">for designers worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
