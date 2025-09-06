import React from 'react';
import { Users, MessageCircle, Calendar, Award, Star, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import ComingSoonSection from '@/components/ComingSoonSection';

const DesignerCommunity = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-4" variant="secondary">
            <Users className="w-4 h-4 mr-2" />
            Designer Community
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Connect, Learn, Grow Together
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Join our vibrant community of top designers sharing knowledge, collaborating on projects, 
            and building lasting professional relationships.
          </p>
        </div>
      </section>

      <ComingSoonSection 
        title="Community Hub Coming Soon"
        description="We're building an amazing space for designers to connect, share knowledge, and grow together. Stay tuned for updates!"
        features={[
          "Weekly design challenges",
          "Peer review sessions", 
          "Skill-sharing workshops",
          "Networking events",
          "Mentorship programs",
          "Resource library"
        ]}
      />
    </div>
  );
};

export default DesignerCommunity;