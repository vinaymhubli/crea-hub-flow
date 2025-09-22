
import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <img 
                src="https://res.cloudinary.com/dknafpppp/image/upload/v1757697849/logo_final_2_x8c1wu.png" 
                alt="Meet My Designer" 
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-400 leading-relaxed mb-6">
              Connect with top designers worldwide. Build amazing products with our trusted marketplace of creative professionals.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-green-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-green-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-green-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-green-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
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
