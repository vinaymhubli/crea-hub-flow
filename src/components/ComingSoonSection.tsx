
import React, { useState } from 'react';

const ComingSoonSection = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribed(true);
    setEmail('');
  };

  const upcomingFeatures = [
    {
      icon: '🎨',
      title: 'Free Logo Generator',
      description: 'Create unlimited professional logos completely free with our advanced AI technology.',
      badge: 'Coming Soon',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '🖼️',
      title: 'Free Image Generator',
      description: 'Generate high-quality images, illustrations, and graphics at no cost using AI.',
      badge: 'Coming Soon',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '🎭',
      title: 'Brand Kit Creator',
      description: 'Build complete brand identity packages including logos, colors, and fonts.',
      badge: 'Beta',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: '📱',
      title: 'Social Media Templates',
      description: 'AI-generated templates for Instagram, Facebook, Twitter, and LinkedIn posts.',
      badge: 'Q2 2024',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-6">
            <span className="mr-2">⏰</span>
            Exciting Features Coming Soon
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            The Future of Design is Here
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            We're constantly working on new AI-powered features to make design more accessible and enjoyable for everyone. Here's what's coming next.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {upcomingFeatures.map((feature, index) => (
            <div key={index} className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  feature.badge === 'Coming Soon' ? 'bg-purple-100 text-purple-800' :
                  feature.badge === 'Beta' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {feature.badge}
                </span>
              </div>
              
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl">{feature.icon}</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
              
              {feature.title.includes('Free') && (
                <div className="mt-4 flex items-center text-green-600 font-medium">
                  <span className="mr-2">🎁</span>
                  100% Free Forever
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            Be the First to Know
          </h3>
          <p className="text-lg mb-8 opacity-90">
            Get notified when our free logo and image generators launch, plus exclusive early access to new features.
          </p>
          
          {!isSubscribed ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                required
              />
              <button
                type="submit"
                className="bg-white text-purple-600 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Notify Me
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-green-300">
              <span className="text-2xl">✓</span>
              <span className="text-lg font-medium">Thanks! We'll keep you updated.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ComingSoonSection;
