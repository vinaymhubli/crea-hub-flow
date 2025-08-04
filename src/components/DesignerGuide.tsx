import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function DesignerGuide() {
  const [activeTab, setActiveTab] = useState('setup');

  const tabs = [
    { id: 'setup', label: 'Getting Started', icon: 'ri-rocket-line' },
    { id: 'profile', label: 'Profile Optimization', icon: 'ri-user-star-line' },
    { id: 'projects', label: 'Managing Projects', icon: 'ri-briefcase-line' },
    { id: 'growth', label: 'Growing Your Business', icon: 'ri-line-chart-line' }
  ];

  const content = {
    setup: {
      title: 'Getting Started as a Designer',
      subtitle: 'Set up your designer account and start attracting clients',
      steps: [
        {
          title: 'Create Your Designer Profile',
          description: 'Complete your professional profile with skills, experience, and portfolio',
          icon: 'ri-user-settings-line',
          details: ['Upload professional headshot', 'Add detailed bio and experience', 'Set your hourly rates and availability', 'Verify your identity and skills']
        },
        {
          title: 'Build Your Portfolio',
          description: 'Showcase your best work to attract potential clients',
          icon: 'ri-gallery-line',
          details: ['Upload high-quality project images', 'Write compelling project descriptions', 'Add case studies and process details', 'Organize work by categories and skills']
        },
        {
          title: 'Set Your Services',
          description: 'Define what you offer and your pricing structure',
          icon: 'ri-price-tag-3-line',
          details: ['List all your design services', 'Set competitive pricing', 'Create service packages', 'Define project timelines']
        }
      ],
      image: 'professional designer setting up online portfolio on laptop in modern creative workspace with design tools sketches and color palettes visible clean minimalist aesthetic bright natural lighting creative studio environment'
    },
    profile: {
      title: 'Optimize Your Profile for Success',
      subtitle: 'Make your profile stand out and attract high-quality clients',
      steps: [
        {
          title: 'Professional Photography',
          description: 'Use high-quality photos that represent your brand',
          icon: 'ri-camera-line',
          details: ['Professional headshot with good lighting', 'Workspace photos showing your environment', 'Behind-the-scenes creative process shots', 'Consistent visual branding across images']
        },
        {
          title: 'Compelling Descriptions',
          description: 'Write descriptions that convert visitors into clients',
          icon: 'ri-quill-pen-line',
          details: ['Clear value proposition', 'Highlight unique skills and experience', 'Include client testimonials', 'Use keywords clients search for']
        },
        {
          title: 'Social Proof',
          description: 'Build trust with reviews, ratings, and testimonials',
          icon: 'ri-star-line',
          details: ['Encourage client reviews', 'Display certifications and awards', 'Show client logos and testimonials', 'Maintain high rating and response time']
        }
      ],
      image: 'designer optimizing professional online profile with multiple screens showing portfolio website creative workspace with awards certificates and client testimonials visible professional branding setup modern aesthetic'
    },
    projects: {
      title: 'Managing Client Projects',
      subtitle: 'Deliver exceptional results and build lasting relationships',
      steps: [
        {
          title: 'Project Communication',
          description: 'Maintain clear, professional communication throughout',
          icon: 'ri-chat-4-line',
          details: ['Respond quickly to client messages', 'Set clear expectations and timelines', 'Provide regular progress updates', 'Use professional language and tone']
        },
        {
          title: 'Delivery & Revisions',
          description: 'Deliver high-quality work and handle feedback professionally',
          icon: 'ri-file-check-line',
          details: ['Meet all project deadlines', 'Deliver work in requested formats', 'Handle revisions gracefully', 'Provide clear revision guidelines']
        },
        {
          title: 'Client Satisfaction',
          description: 'Ensure every client has an amazing experience',
          icon: 'ri-customer-service-2-line',
          details: ['Go above and beyond expectations', 'Ask for feedback throughout process', 'Resolve issues quickly and professionally', 'Follow up after project completion']
        }
      ],
      image: 'designer managing multiple client projects on computer screens with project management tools timeline charts and client communication interfaces visible organized creative workspace collaborative environment'
    },
    growth: {
      title: 'Growing Your Design Business',
      subtitle: 'Scale your success and build a thriving design practice',
      steps: [
        {
          title: 'Build Your Reputation',
          description: 'Establish yourself as a go-to designer in your niche',
          icon: 'ri-trophy-line',
          details: ['Specialize in specific design areas', 'Consistently deliver quality work', 'Build long-term client relationships', 'Get featured in our designer spotlights']
        },
        {
          title: 'Expand Your Services',
          description: 'Grow your offerings to increase your earning potential',
          icon: 'ri-add-circle-line',
          details: ['Add complementary services', 'Create premium service packages', 'Offer maintenance and ongoing support', 'Partner with other designers for bigger projects']
        },
        {
          title: 'Optimize Your Earnings',
          description: 'Maximize your income through strategic pricing and efficiency',
          icon: 'ri-money-dollar-circle-line',
          details: ['Gradually increase your rates', 'Create efficient workflows', 'Focus on high-value clients', 'Develop passive income streams']
        }
      ],
      image: 'successful designer celebrating business growth with charts showing increasing revenue client testimonials and awards displayed modern office setup with multiple monitors showing thriving design business metrics'
    }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <i className="ri-palette-fill mr-2"></i>
            For Designers
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Build Your Design Empire
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know to succeed as a designer on our platform and grow your creative business.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={`https://readdy.ai/api/search-image?query=${content[activeTab as keyof typeof content].image}&width=600&height=400&seq=designer-guide-${activeTab}&orientation=landscape`}
                alt={content[activeTab as keyof typeof content].title}
                className="w-full h-[400px] object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>

          {/* Steps */}
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {content[activeTab as keyof typeof content].title}
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                {content[activeTab as keyof typeof content].subtitle}
              </p>
            </div>

            <div className="space-y-6">
              {content[activeTab as keyof typeof content].steps.map((step, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className={`${step.icon} text-xl text-blue-600`}></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h4>
                      <p className="text-gray-600 mb-4">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                            <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <i className="ri-check-line text-blue-600 text-xs"></i>
                            </div>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <Link to="/designers" className="bg-blue-500 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap inline-flex items-center">
                <i className="ri-user-add-line mr-2"></i>
                Join as Designer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}