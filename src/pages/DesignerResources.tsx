import React from 'react';
import { BookOpen, Download, Video, Users, Star, ExternalLink, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import CTASection from '@/components/CTASection';

const DesignerResources = () => {
  const resourceCategories = [
    {
      title: "Design Tools & Assets",
      icon: Download,
      resources: [
        { name: "UI Kit Library", type: "Assets", format: "Figma", rating: 4.9, downloads: "12K+" },
        { name: "Icon Collection", type: "Assets", format: "SVG", rating: 4.8, downloads: "8K+" },
        { name: "Wireframe Templates", type: "Templates", format: "Sketch", rating: 4.7, downloads: "5K+" },
        { name: "Brand Guidelines Template", type: "Template", format: "PDF", rating: 4.9, downloads: "3K+" }
      ]
    },
    {
      title: "Learning & Development",
      icon: BookOpen,
      resources: [
        { name: "Advanced UX Research Methods", type: "Course", format: "Video", rating: 4.9, duration: "8h" },
        { name: "Client Communication Mastery", type: "Guide", format: "PDF", rating: 4.8, duration: "2h" },
        { name: "Design Systems Workshop", type: "Workshop", format: "Live", rating: 4.9, duration: "4h" },
        { name: "Freelance Business Setup", type: "Course", format: "Video", rating: 4.7, duration: "6h" }
      ]
    },
    {
      title: "Templates & Workflows",
      icon: Users,
      resources: [
        { name: "Project Proposal Template", type: "Template", format: "DOC", rating: 4.8, uses: "15K+" },
        { name: "Client Onboarding Checklist", type: "Checklist", format: "PDF", rating: 4.9, uses: "10K+" },
        { name: "Design Review Process", type: "Workflow", format: "Template", rating: 4.7, uses: "8K+" },
        { name: "Pricing Calculator", type: "Tool", format: "Excel", rating: 4.8, uses: "12K+" }
      ]
    },
    {
      title: "Video Tutorials",
      icon: Video,
      resources: [
        { name: "Platform Mastery Series", type: "Tutorial", format: "Video", rating: 4.9, views: "25K+" },
        { name: "Client Success Stories", type: "Case Study", format: "Video", rating: 4.8, views: "18K+" },
        { name: "Design Presentation Tips", type: "Tutorial", format: "Video", rating: 4.7, views: "22K+" },
        { name: "Portfolio Optimization", type: "Workshop", format: "Video", rating: 4.9, views: "30K+" }
      ]
    }
  ];

  const featuredResources = [
    {
      title: "2024 Design Trends Report",
      description: "Comprehensive analysis of design trends shaping the industry",
      type: "Report",
      format: "PDF",
      pages: "45 pages",
      image: "/placeholder.svg",
      featured: true
    },
    {
      title: "Client Pricing Strategies",
      description: "Master the art of pricing your design services for maximum profit",
      type: "Guide",
      format: "Interactive",
      pages: "25 modules",
      image: "/placeholder.svg",
      featured: true
    },
    {
      title: "Design System Masterclass",
      description: "Build scalable design systems that clients love",
      type: "Course",
      format: "Video",
      pages: "12 hours",
      image: "/placeholder.svg",
      featured: true
    }
  ];

  const communityStats = [
    { label: "Active Designers", value: "2,500+" },
    { label: "Resources Shared", value: "500+" },
    { label: "Monthly Downloads", value: "50K+" },
    { label: "Community Rating", value: "4.9/5" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-4" variant="secondary">
            <BookOpen className="w-4 h-4 mr-2" />
            Designer Resources
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Level Up Your Design Career
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Access exclusive tools, templates, courses, and resources created by top designers 
            for designers. Everything you need to succeed.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search resources..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {communityStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Featured Resources</h2>
            <p className="text-muted-foreground">Handpicked content from our top designers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredResources.map((resource, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                  <Badge className="absolute top-4 left-4" variant="secondary">
                    Featured
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{resource.type}</Badge>
                    <span className="text-sm text-muted-foreground">{resource.pages}</span>
                  </div>
                  <CardTitle className="text-xl">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Access Resource
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tools">Tools & Assets</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
            </TabsList>

            {resourceCategories.map((category, categoryIndex) => (
              <TabsContent key={categoryIndex} value={category.title.toLowerCase().split(' ')[0]} className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.resources.map((resource, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{resource.type}</Badge>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm">{resource.rating}</span>
                          </div>
                        </div>
                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          {resource.format} • {resource.downloads || resource.duration || resource.uses || resource.views}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button size="sm" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Join Our Designer Community</h2>
              <p className="text-muted-foreground mb-8">
                Connect with fellow designers, share resources, get feedback, and grow together. 
                Our community is where the magic happens.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-primary mr-3" />
                  <span>Weekly design challenges and contests</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-primary mr-3" />
                  <span>Peer reviews and feedback sessions</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-primary mr-3" />
                  <span>Exclusive workshops and masterclasses</span>
                </div>
                <div className="flex items-center">
                  <Video className="w-5 h-5 text-primary mr-3" />
                  <span>Monthly design showcases</span>
                </div>
              </div>
              <Button className="mt-8" size="lg" asChild>
                <Link to="/designer-community">Join Community</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">2,500+</div>
                  <div className="text-sm text-muted-foreground">Active Members</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-sm text-muted-foreground">Resources Shared</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Video className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">100+</div>
                  <div className="text-sm text-muted-foreground">Live Sessions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">4.9/5</div>
                  <div className="text-sm text-muted-foreground">Community Rating</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-8">
            Get weekly design resources, industry insights, and community highlights delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input placeholder="Enter your email" className="flex-1" />
            <Button>Subscribe</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Join 5,000+ designers already subscribed
          </p>
        </div>
      </section>

      <CTASection />
    </div>
  );
};

export default DesignerResources;