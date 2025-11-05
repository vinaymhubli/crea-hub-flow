import React from 'react';
import { Star, Quote, ArrowRight, Award, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import CTASection from '@/components/CTASection';

const SuccessStories = () => {
  const stories = [
    {
      title: "From Startup to ₹10M in Revenue",
      company: "TechFlow Solutions",
      industry: "SaaS",
      designer: "Sarah Chen",
      image: "/placeholder.svg",
      revenue: "₹10M+",
      growth: "300%",
      timeline: "18 months",
      quote: "Working with Sarah through Meet My Designer transformed our entire brand. Her strategic approach to UX design increased our conversion rate by 300% and helped us secure Series A funding.",
      clientName: "Mark Rodriguez",
      clientTitle: "CEO, TechFlow Solutions",
      results: [
        "300% increase in conversion rate",
        "50% reduction in user acquisition cost",
        "Secured ₹5M Series A funding",
        "Award-winning design system"
      ]
    },
    {
      title: "E-commerce Revolution",
      company: "Artisan Marketplace",
      industry: "E-commerce",
      designer: "Alex Kumar",
      image: "/placeholder.svg",
      revenue: "₹2M+",
      growth: "450%",
      timeline: "12 months",
      quote: "Alex completely reimagined our user experience. The new design not only looks amazing but increased our sales by 450% in just one year.",
      clientName: "Emily Watson",
      clientTitle: "Founder, Artisan Marketplace",
      results: [
        "450% increase in sales",
        "60% improvement in mobile experience",
        "Featured in Design Awards 2024",
        "Expanded to 3 new markets"
      ]
    },
    {
      title: "Healthcare App Innovation",
      company: "HealthConnect",
      industry: "Healthcare",
      designer: "Maria Garcia",
      image: "/placeholder.svg",
      revenue: "₹5M+",
      growth: "200%",
      timeline: "24 months",
      quote: "Maria's expertise in healthcare UX was exactly what we needed. She helped us create an app that's both compliant and user-friendly, leading to rapid adoption.",
      clientName: "Dr. James Park",
      clientTitle: "CTO, HealthConnect",
      results: [
        "200% increase in user engagement",
        "HIPAA-compliant design system",
        "1M+ active users",
        "Partnership with major health systems"
      ]
    }
  ];

  const stats = [
    { label: "Success Rate", value: "98%", icon: Award },
    { label: "Average ROI", value: "350%", icon: TrendingUp },
    { label: "Happy Clients", value: "10,000+", icon: Users },
    { label: "Projects Completed", value: "25,000+", icon: Star }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
            <Award className="w-4 h-4 mr-2" />
            Success Stories
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Real Results, Real Impact
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover how businesses like yours have transformed their growth with 
            the help of our talented designers.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold mb-2 text-gray-900">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Transformative Partnerships</h2>
            <p className="text-gray-600">
              See how our designers have helped businesses achieve extraordinary results
            </p>
          </div>

          <div className="space-y-16">
            {stories.map((story, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                    <div className={`bg-gradient-to-br from-green-50 to-blue-50 p-8 lg:p-12 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-green-100 text-green-800 border-green-200">{story.industry}</Badge>
                        <Badge variant="outline">{story.timeline}</Badge>
                      </div>
                      
                      <h3 className="text-2xl lg:text-3xl font-bold mb-4 text-gray-900">{story.title}</h3>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{story.revenue}</div>
                          <div className="text-sm text-gray-600">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{story.growth}</div>
                          <div className="text-sm text-gray-600">Growth</div>
                        </div>
                        <div className="text-center">
                          <div className="flex justify-center mb-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-green-500 text-green-500" />
                            ))}
                          </div>
                          <div className="text-sm text-gray-600">Rating</div>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {story.results.map((result, resultIndex) => (
                          <li key={resultIndex} className="flex items-center text-sm text-gray-700">
                            <ArrowRight className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                            {result}
                          </li>
                        ))}
                      </ul>

                      <Button asChild>
                        <Link to="/designers">Find Your Designer</Link>
                      </Button>
                    </div>

                    <div className={`p-8 lg:p-12 flex flex-col justify-center ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                      <Quote className="w-12 h-12 text-green-600 mb-6" />
                      
                      <blockquote className="text-lg italic mb-6 text-gray-700">
                        "{story.quote}"
                      </blockquote>
                      
                      <div className="border-l-4 border-green-500 pl-4">
                        <div className="font-semibold text-gray-900">{story.clientName}</div>
                        <div className="text-gray-600 text-sm">{story.clientTitle}</div>
                        <div className="text-gray-600 text-sm">{story.company}</div>
                      </div>

                      <div className="mt-6 pt-6 border-t">
                        <div className="text-sm text-gray-600 mb-1">Designer</div>
                        <div className="font-semibold text-gray-900">{story.designer}</div>
                        <div className="flex items-center mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-green-500 text-green-500 mr-1" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Ready to Write Your Success Story?</h2>
          <p className="text-gray-600 mb-8">
            Join thousands of businesses that have transformed their growth with our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
              <Link to="/designers">Browse Designers</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" asChild>
              <Link to="/auth">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  );
};

export default SuccessStories;