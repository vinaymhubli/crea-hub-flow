import React from 'react';
import { FileText, TrendingUp, Users, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ComingSoonSection from '@/components/ComingSoonSection';

const Blog = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-4" variant="secondary">
            <FileText className="w-4 h-4 mr-2" />
            Design Blog
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Insights & Inspiration
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Discover the latest design trends, industry insights, and success stories from our community of talented designers.
          </p>
        </div>
      </section>

      <ComingSoonSection 
        title="Design Blog Coming Soon"
        description="We're preparing amazing content from industry experts and our community. Get ready for insights that will transform your design career."
        features={[
          "Weekly design trend reports",
          "Designer success stories",
          "Industry expert interviews",
          "Tool reviews and tutorials",
          "Business tips for freelancers",
          "Client case studies"
        ]}
      />
    </div>
  );
};

export default Blog;