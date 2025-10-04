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
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
            <Users className="w-4 h-4 mr-2" />
            Designer Community
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Connect, Learn, Grow Together
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join our vibrant community of top designers sharing knowledge, collaborating on projects, 
            and building lasting professional relationships.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Community Hub Coming Soon</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            We're building an amazing space for designers to connect, share knowledge, and grow together. Stay tuned for updates!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            {[
              "Weekly design challenges",
              "Peer review sessions",
              "Skill-sharing workshops",
              "Networking events",
              "Mentorship programs", 
              "Resource library"
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

export default DesignerCommunity;