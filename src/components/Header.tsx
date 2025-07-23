
import React from 'react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-background shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-xl font-bold text-foreground">DesignHub</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`transition-colors ${
                isActive('/') ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/designers" 
              className={`transition-colors ${
                isActive('/designers') ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'
              }`}
            >
              Designers
            </Link>
            <Link 
              to="/ai-assistant" 
              className={`transition-colors ${
                isActive('/ai-assistant') ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'
              }`}
            >
              AI Assistant
            </Link>
            <Link 
              to="/about" 
              className={`transition-colors ${
                isActive('/about') ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'
              }`}
            >
              About
            </Link>
            <a href="/projects" className="text-muted-foreground hover:text-green-600 transition-colors">Projects</a>
            <a href="/contact" className="text-muted-foreground hover:text-green-600 transition-colors">Contact</a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <button className="text-muted-foreground hover:text-green-600 transition-colors">Login</button>
            <button className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors">
              Get Started
            </button>
          </div>

          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className={`transition-colors ${
                  isActive('/') ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/designers" 
                className={`transition-colors ${
                  isActive('/designers') ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'
                }`}
              >
                Designers
              </Link>
              <Link 
                to="/ai-assistant" 
                className={`transition-colors ${
                  isActive('/ai-assistant') ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'
                }`}
              >
                AI Assistant
              </Link>
              <Link 
                to="/about" 
                className={`transition-colors ${
                  isActive('/about') ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'
                }`}
              >
                About
              </Link>
              <a href="/projects" className="text-muted-foreground hover:text-green-600 transition-colors">Projects</a>
              <a href="/contact" className="text-muted-foreground hover:text-green-600 transition-colors">Contact</a>
              <div className="flex flex-col space-y-2 pt-4">
                <button className="text-muted-foreground hover:text-green-600 transition-colors text-left">Login</button>
                <button className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors">
                  Get Started
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
