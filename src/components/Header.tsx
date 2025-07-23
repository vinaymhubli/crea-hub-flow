
import React from 'react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-xl font-bold text-gray-900">DesignHub</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-gray-600 hover:text-green-600 transition-colors">Home</a>
            <a href="/about" className="text-gray-600 hover:text-green-600 transition-colors">About</a>
            <a href="/designers" className="text-gray-600 hover:text-green-600 transition-colors">Designers</a>
            <a href="/projects" className="text-gray-600 hover:text-green-600 transition-colors">Projects</a>
            <a href="/contact" className="text-gray-600 hover:text-green-600 transition-colors">Contact</a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-600 hover:text-green-600 transition-colors">Login</button>
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
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <a href="/" className="text-gray-600 hover:text-green-600 transition-colors">Home</a>
              <a href="/about" className="text-gray-600 hover:text-green-600 transition-colors">About</a>
              <a href="/designers" className="text-gray-600 hover:text-green-600 transition-colors">Designers</a>
              <a href="/projects" className="text-gray-600 hover:text-green-600 transition-colors">Projects</a>
              <a href="/contact" className="text-gray-600 hover:text-green-600 transition-colors">Contact</a>
              <div className="flex flex-col space-y-2 pt-4">
                <button className="text-gray-600 hover:text-green-600 transition-colors text-left">Login</button>
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
