
import React, { useState } from 'react';

const CTASection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setEmail('');
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
    <section 
      className="relative py-20 overflow-hidden"
      style={{
        backgroundImage: `url('https://readdy.ai/api/search-image?query=futuristic%20AI%20technology%20background%20with%20neural%20networks%2C%20digital%20brain%20connections%2C%20glowing%20circuits%20and%20data%20streams%2C%20abstract%20technological%20patterns%20in%20purple%20and%20blue%20colors%2C%20modern%20artificial%20intelligence%20visualization%2C%20high-tech%20digital%20environment%20with%20floating%20geometric%20shapes%20and%20light%20effects&width=1920&height=800&seq=ai-cta-bg&orientation=landscape')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-blue-900/90"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              Ready to Transform
            </span>
            <br />
            <span className="text-white">Your Design Process?</span>
          </h2>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">
            Join thousands of designers and businesses already using our AI-powered tools. 
            Be the first to access our revolutionary design platform when it launches.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-white text-xl">⚡</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-300 text-sm">Generate designs in seconds, not hours</p>
          </div>
          
          <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-white text-xl">🧠</span>
            </div>
            <h3 className="text-white font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-300 text-sm">Smart algorithms that understand your vision</p>
          </div>
          
          <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-white text-xl">💝</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Free Forever</h3>
            <p className="text-gray-300 text-sm">Core features always free for everyone</p>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-6 py-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-full hover:from-green-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isSubmitted ? 'Thank You!' : 'Get Early Access'}
            </button>
          </form>
          
          {isSubmitted && (
            <div className="mt-4 p-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg">
              <p className="text-green-200 text-sm">
                <span className="mr-2">✓</span>
                You're on the list! We'll notify you when AI Assistant launches.
              </p>
            </div>
          )}
          
          <p className="text-gray-300 text-sm mt-4">
            No spam, unsubscribe anytime. Join 50,000+ designers already waiting.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
