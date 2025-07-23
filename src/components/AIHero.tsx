
import React from 'react';
import { Link } from 'react-router-dom';

const AIHero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20AI%20technology%20workspace%20with%20holographic%20interfaces%2C%20digital%20brain%20networks%2C%20and%20futuristic%20design%20elements%2C%20clean%20minimalist%20background%20with%20soft%20purple%20and%20blue%20gradients%2C%20professional%20tech%20atmosphere%2C%20ultra-modern%20aesthetic%20with%20floating%20digital%20elements%20and%20neural%20network%20patterns&width=1920&height=1080&seq=ai-hero-bg&orientation=landscape')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 via-blue-900/50 to-transparent"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                <span className="mr-2">✨</span>
                AI-Powered Design Assistant
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Create Stunning Designs with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> AI Magic</span>
              </h1>
              
              <p className="text-xl text-gray-200 leading-relaxed max-w-2xl">
                Revolutionize your design process with our intelligent AI assistant. Generate logos, images, and design elements in seconds with the power of artificial intelligence.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-center shadow-lg">
                Get Early Access
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-full font-medium hover:bg-white hover:text-gray-900 transition-all duration-300">
                Watch Demo
              </button>
            </div>
            
            <div className="flex items-center space-x-6 text-gray-300">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>Free to use</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>No design experience needed</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>Instant results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIHero;
