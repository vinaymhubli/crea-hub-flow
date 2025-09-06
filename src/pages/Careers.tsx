import React from 'react';
import { Briefcase, MapPin, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ComingSoonSection from '@/components/ComingSoonSection';

const Careers = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-4" variant="secondary">
            <Briefcase className="w-4 h-4 mr-2" />
            Join Our Team
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Build the Future of Design
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Join our mission to connect the world's best designers with amazing projects. 
            We're building something extraordinary and we want you to be part of it.
          </p>
        </div>
      </section>

      <ComingSoonSection 
        title="Career Opportunities Coming Soon"
        description="We're growing fast and will be posting exciting opportunities soon. Join our team and help shape the future of design collaboration."
        features={[
          "Remote-first culture",
          "Competitive compensation",
          "Equity opportunities",
          "Learning & development budget",
          "Flexible working hours",
          "Amazing team culture"
        ]}
      />
    </div>
  );
};

export default Careers;