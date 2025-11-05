import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function CustomerGuide() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: '01',
      title: 'Create Your Account',
      description: 'Sign up in seconds and complete your profile to help designers understand your needs better.',
      details: [
        'Quick registration with email or social media',
        'Complete your business profile',
        'Set your preferences and budget range',
        'Upload your brand assets if available'
      ],
      icon: 'ri-user-add-line',
      color: 'green'
    },
    {
      number: '02',
      title: 'Browse & Search Designers',
      description: 'Explore our curated marketplace of verified designers using powerful filters and search options.',
      details: [
        'Filter by skills, experience, and budget',
        'View portfolios and client reviews',
        'Check designer availability and response time',
        'Save your favorite designers for later'
      ],
      icon: 'ri-search-2-line',
      color: 'blue'
    },
    {
      number: '03',
      title: 'Connect & Discuss',
      description: 'Message designers directly to discuss your project requirements and get custom quotes.',
      details: [
        'Send detailed project briefs',
        'Chat in real-time with designers',
        'Share files and inspiration',
        'Get personalized quotes and timelines'
      ],
      icon: 'ri-chat-3-line',
      color: 'purple'
    },
    {
      number: '04',
      title: 'Start Your Project',
      description: 'Choose your designer, make secure payments, and begin your creative collaboration journey.',
      details: [
        'Review and accept project proposals',
        'Make secure payments with escrow protection',
        'Set project milestones and deadlines',
        'Access real-time project dashboard'
      ],
      icon: 'ri-rocket-line',
      color: 'orange'
    },
    {
      number: '05',
      title: 'Collaborate & Review',
      description: 'Work closely with your designer, provide feedback, and track progress throughout the project.',
      details: [
        'Real-time collaboration tools',
        'Easy feedback and revision system',
        'Progress tracking and notifications',
        'Direct communication channel'
      ],
      icon: 'ri-team-line',
      color: 'pink'
    },
    {
      number: '06',
      title: 'Receive & Rate',
      description: 'Get your completed design, request final revisions, and help our community by leaving reviews.',
      details: [
        'Download high-quality final files',
        'Request unlimited revisions within scope',
        'Release payment when satisfied',
        'Leave reviews to help other customers'
      ],
      icon: 'ri-award-line',
      color: 'emerald'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-600 border-green-200',
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      orange: 'bg-orange-100 text-orange-600 border-orange-200',
      pink: 'bg-pink-100 text-pink-600 border-pink-200',
      emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200'
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <i className="ri-user-heart-fill mr-2"></i>
            For Customers
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your Journey to Amazing Design
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Follow these simple steps to connect with talented designers and bring your creative vision to life.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Steps Navigation */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-white shadow-xl border-green-200 transform scale-105'
                    : 'bg-gray-50 border-gray-200 hover:bg-white hover:shadow-lg'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getColorClasses(step.color)}`}>
                    <i className={`${step.icon} text-xl`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-bold text-gray-400">{step.number}</span>
                      <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    activeStep === index ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <i className="ri-check-line text-white text-sm"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Step Details */}
          <div className="sticky top-8">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${getColorClasses(steps[activeStep].color)}`}>
                <i className={`${steps[activeStep].icon} text-2xl`}></i>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {steps[activeStep].title}
              </h3>
              
              <p className="text-gray-600 mb-8 text-lg">
                {steps[activeStep].description}
              </p>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-lg">What you'll do:</h4>
                <ul className="space-y-3">
                  {steps[activeStep].details.map((detail, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className="ri-check-line text-green-600 text-sm"></i>
                      </div>
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link to="/signup" className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap inline-flex items-center">
                  <i className="ri-arrow-right-line mr-2"></i>
                  Get Started Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}