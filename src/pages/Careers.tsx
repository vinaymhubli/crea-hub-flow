import React from 'react';
import { Briefcase, MapPin, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ComingSoonSection from '@/components/ComingSoonSection';

const Careers = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
            <Briefcase className="w-4 h-4 mr-2" />
            Join Our Team
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Build the Future of Design
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join our mission to connect the world's best designers with amazing projects. 
            We're building something extraordinary and we want you to be part of it.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Career Opportunities Coming Soon</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            We're growing fast and will be posting exciting opportunities soon. Join our team and help shape the future of design collaboration.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            {[
              "Remote-first culture",
              "Competitive compensation",
              "Equity opportunities", 
              "Learning & development budget",
              "Flexible working hours",
              "Amazing team culture"
            ].map((feature, index) => (
              <div key={index} className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers;