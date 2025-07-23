
import React from 'react';
import { Search, Shield, MessageCircle, DollarSign, Star, Clock } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Search,
      title: 'Smart Matching',
      description: 'Our AI-powered system matches you with designers who perfectly fit your project requirements and budget.'
    },
    {
      icon: Shield,
      title: 'Verified Portfolios',
      description: 'All designer portfolios are verified and showcase real work with client testimonials and project details.'
    },
    {
      icon: MessageCircle,
      title: 'Seamless Communication',
      description: 'Built-in messaging, video calls, and project management tools keep everyone aligned throughout the process.'
    },
    {
      icon: DollarSign,
      title: 'Transparent Pricing',
      description: 'See upfront pricing, compare quotes, and pay securely with our escrow protection system.'
    },
    {
      icon: Star,
      title: 'Quality Assurance',
      description: 'Ratings, reviews, and our quality guarantee ensure you get exceptional results every time.'
    },
    {
      icon: Clock,
      title: 'Fast Delivery',
      description: 'Most projects are completed 40% faster with our streamlined workflow and milestone tracking.'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Choose Our Platform?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We've built the most trusted marketplace for design services, connecting talented designers with clients worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-8 rounded-2xl bg-gray-50 hover:bg-green-50 transition-colors group">
              <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-2xl mb-6 group-hover:bg-green-200 transition-colors">
                <feature.icon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
