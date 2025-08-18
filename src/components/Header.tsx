
import React from 'react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="https://static.readdy.ai/image/3a4949fefa4bf9bdbe2344171768d602/cc3a9e171a7150c527735282ce03e081.png" 
              alt="Meet My Designers" 
              className="h-8 w-auto"
            />
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`font-medium transition-colors ${
                isActive('/') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className={`font-medium transition-colors ${
                isActive('/about') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              About Us
            </Link>
            <Link 
              to="/designers" 
              className={`font-medium transition-colors ${
                isActive('/designers') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Designers
            </Link>
            <Link 
              to="/ai-assistant" 
              className={`font-medium transition-colors ${
                isActive('/ai-assistant') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              AI Assistant
            </Link>
            <Link 
              to="/how-to-use" 
              className={`font-medium transition-colors ${
                isActive('/how-to-use') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              How to Use
            </Link>
            <Link 
              to="/contact" 
              className={`font-medium transition-colors ${
                isActive('/contact') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Contact Us
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {profile?.user_type === 'designer' && (
                  <Link 
                    to="/designer-dashboard" 
                    className="font-medium text-gray-700 hover:text-green-600 transition-colors"
                  >
                    Designer Dashboard
                  </Link>
                )}
                {profile?.user_type === 'client' && (
                  <Link 
                    to="/customer-dashboard" 
                    className="font-medium text-gray-700 hover:text-green-600 transition-colors"
                  >
                    Customer Dashboard
                  </Link>
                )}
                {profile?.is_admin && (
                  <Link 
                    to="/admin-dashboard" 
                    className="font-medium text-gray-700 hover:text-green-600 transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button 
                  onClick={signOut}
                  className="font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/auth" 
                  className={`font-medium transition-colors ${
                    isActive('/auth') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  Sign In
                </Link>
                <Link 
                  to="/auth" 
                  className="bg-green-600 text-white px-6 py-2 rounded-full font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="text-xl" /> : <Menu className="text-xl" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className={`font-medium transition-colors ${
                  isActive('/') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/about" 
                className={`font-medium transition-colors ${
                  isActive('/about') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                About Us
              </Link>
              <Link 
                to="/designers" 
                className={`font-medium transition-colors ${
                  isActive('/designers') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Designers
              </Link>
              <Link 
                to="/ai-assistant" 
                className={`font-medium transition-colors ${
                  isActive('/ai-assistant') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                AI Assistant
              </Link>
              <Link 
                to="/how-to-use" 
                className={`font-medium transition-colors ${
                  isActive('/how-to-use') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                How to Use
              </Link>
              <Link 
                to="/contact" 
                className={`font-medium transition-colors ${
                  isActive('/contact') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Contact Us
              </Link>
              <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
                <Link 
                  to="/auth" 
                  className={`font-medium transition-colors ${
                    isActive('/auth') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  Sign In
                </Link>
                <Link 
                  to="/auth" 
                  className="bg-green-600 text-white px-6 py-2 rounded-full font-medium hover:bg-green-700 transition-colors text-center whitespace-nowrap"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
