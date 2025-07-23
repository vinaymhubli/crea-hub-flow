
import React from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageCircle, Shield, Award } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Browse & Discover',
      description: 'Explore our curated marketplace of talented designers. Filter by style, expertise, budget, and ratings to find your perfect match.',
      icon: Search,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-600'
    },
    {
      number: '02',
      title: 'Connect & Discuss',
      description: 'Message designers directly, share your vision, and get custom quotes. Our AI assistant helps match you with the right talent.',
      icon: MessageCircle,
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-600'
    },
    {
      number: '03',
      title: 'Secure & Collaborate',
      description: 'Start your project with secure payments held in escrow. Track progress, provide feedback, and communicate through our platform.',
      icon: Shield,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-600'
    },
    {
      number: '04',
      title: 'Deliver & Review',
      description: 'Receive your completed design, request revisions if needed, and release payment. Leave reviews to help our community grow.',
      icon: Award,
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-600'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span className="mr-2">✨</span>
            Simple & Secure Process
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How Our Platform Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with world-class designers in minutes. Our innovative platform makes hiring creative talent as easy as ordering your morning coffee.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 relative`}>
                  <step.icon className="w-8 h-8" />
                  <div className={`absolute -top-2 -right-2 w-8 h-8 ${step.bgColor} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                    {step.number}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 z-10">
                  <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-gray-200">
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl p-8 md:p-12 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Transform Your Ideas into Reality?
            </h3>
            <p className="text-lg opacity-90 mb-8">
              Join thousands of satisfied clients who've found their perfect designer match. Start your project today and see the magic happen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/designers" 
                className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                <span className="mr-2">🔍</span>
                Browse Designers
              </Link>
              <a 
                href="/post-project" 
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-600 transition-colors whitespace-nowrap"
              >
                <span className="mr-2">➕</span>
                Post a Project
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
