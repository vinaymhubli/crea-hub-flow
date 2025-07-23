
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
                src="https://static.readdy.ai/image/3a4949fefa4bf9bdbe2344171768d602/cc3a9e171a7150c527735282ce03e081.png" 
                alt="Meet My Designers" 
                className="h-8 w-auto"
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
              <li><a href="/how-it-works" className="text-gray-400 hover:text-green-400 transition-colors">How It Works</a></li>
              <li><a href="/pricing" className="text-gray-400 hover:text-green-400 transition-colors">Pricing</a></li>
              <li><a href="/success-stories" className="text-gray-400 hover:text-green-400 transition-colors">Success Stories</a></li>
              <li><a href="/support" className="text-gray-400 hover:text-green-400 transition-colors">Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">For Designers</h3>
            <ul className="space-y-4">
              <li><a href="/for-designers" className="text-gray-400 hover:text-green-400 transition-colors">Join as Designer</a></li>
              <li><a href="/designer-resources" className="text-gray-400 hover:text-green-400 transition-colors">Resources</a></li>
              <li><a href="/designer-community" className="text-gray-400 hover:text-green-400 transition-colors">Community</a></li>
              <li><a href="/designer-help" className="text-gray-400 hover:text-green-400 transition-colors">Help Center</a></li>
              <li><a href="/designer-blog" className="text-gray-400 hover:text-green-400 transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-gray-400 hover:text-green-400 transition-colors">About Us</Link></li>
              <li><a href="/careers" className="text-gray-400 hover:text-green-400 transition-colors">Careers</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-green-400 transition-colors">Contact</a></li>
              <li><a href="/privacy" className="text-gray-400 hover:text-green-400 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-green-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Meet My Designers. All rights reserved.
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
