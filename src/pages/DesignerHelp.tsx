import React from 'react';
import { HelpCircle, Book, Video, MessageCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ComingSoonSection from '@/components/ComingSoonSection';

const DesignerHelp = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
            <HelpCircle className="w-4 h-4 mr-2" />
            Designer Help Center
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Get the Help You Need
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive support and resources specifically designed for designers to succeed on our platform.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Designer Help Center Coming Soon</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            We're creating a comprehensive help center tailored specifically for designers. Get ready for detailed guides, tutorials, and support resources.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            {[
              "Getting started guides",
              "Portfolio optimization tips",
              "Client communication best practices",
              "Pricing and proposals help",
              "Technical troubleshooting",
              "Success stories and case studies"
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

export default DesignerHelp;