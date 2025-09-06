import React from 'react';
import { HelpCircle, Book, Video, MessageCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ComingSoonSection from '@/components/ComingSoonSection';

const DesignerHelp = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-4" variant="secondary">
            <HelpCircle className="w-4 h-4 mr-2" />
            Designer Help Center
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Get the Help You Need
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Comprehensive support and resources specifically designed for designers to succeed on our platform.
          </p>
        </div>
      </section>

      <ComingSoonSection 
        title="Designer Help Center Coming Soon"
        description="We're creating a comprehensive help center tailored specifically for designers. Get ready for detailed guides, tutorials, and support resources."
        features={[
          "Getting started guides",
          "Portfolio optimization tips",
          "Client communication best practices",
          "Pricing and proposals help",
          "Technical troubleshooting",
          "Success stories and case studies"
        ]}
      />
    </div>
  );
};

export default DesignerHelp;