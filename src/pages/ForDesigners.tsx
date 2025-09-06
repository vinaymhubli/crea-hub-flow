import React from 'react';
import { Star, Users, DollarSign, Shield, Award, TrendingUp, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import CTASection from '@/components/CTASection';

const ForDesigners = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: "Higher Earnings",
      description: "Earn 20-40% more than traditional freelance platforms with our premium client base",
      stats: "Average $85/hour"
    },
    {
      icon: Users,
      title: "Quality Clients",
      description: "Work with vetted businesses and startups serious about design investment",
      stats: "98% client satisfaction"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Get paid on time with our escrow system and automated invoicing",
      stats: "100% payment protection"
    },
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description: "Access tools and resources to scale your design practice",
      stats: "3x business growth"
    }
  ];

  const features = [
    "Smart client matching algorithm",
    "Integrated project management tools",
    "Automated contract generation",
    "Real-time collaboration features",
    "Portfolio showcase with analytics",
    "Professional development resources",
    "Community of top designers",
    "Priority support"
  ];

  const steps = [
    {
      number: "1",
      title: "Apply & Get Verified",
      description: "Submit your portfolio and complete our verification process. We accept only the top 5% of applicants."
    },
    {
      number: "2",
      title: "Set Up Your Profile",
      description: "Create a compelling profile showcasing your skills, experience, and portfolio pieces."
    },
    {
      number: "3",
      title: "Connect with Clients",
      description: "Receive project invitations from pre-qualified clients that match your expertise."
    },
    {
      number: "4",
      title: "Deliver & Get Paid",
      description: "Complete projects using our integrated tools and get paid automatically upon delivery."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "UI/UX Designer",
      image: "/placeholder.svg",
      rating: 5,
      earnings: "$150K+",
      quote: "Meet My Designer transformed my freelance career. I've tripled my income and work with amazing clients who truly value design."
    },
    {
      name: "Alex Rodriguez",
      role: "Brand Designer",
      image: "/placeholder.svg",
      rating: 5,
      earnings: "$120K+",
      quote: "The quality of clients here is unmatched. Every project is a learning opportunity with businesses that invest in great design."
    },
    {
      name: "Maria Kumar",
      role: "Product Designer",
      image: "/placeholder.svg",
      rating: 5,
      earnings: "$180K+",
      quote: "From startup MVP to enterprise solutions - I've worked on incredible projects that have shaped my career."
    }
  ];

  const stats = [
    { label: "Active Designers", value: "2,500+" },
    { label: "Projects Completed", value: "25,000+" },
    { label: "Total Earnings", value: "$50M+" },
    { label: "Average Rating", value: "4.9/5" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="secondary">
                <Award className="w-4 h-4 mr-2" />
                For Top Designers
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Your Design Career, Elevated
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Join an exclusive community of top designers working with premium clients 
                on projects that matter. Earn more, work better, grow faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link to="/auth">Apply Now</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/designers">View Designer Profiles</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Meet My Designer?</h2>
            <p className="text-muted-foreground">
              Join thousands of designers who've elevated their careers with us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="text-sm">
                      {benefit.stats}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Get started in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-muted-foreground mx-auto mt-4 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Everything You Need to Succeed</h2>
              <p className="text-muted-foreground mb-8">
                Our platform provides all the tools and resources you need to build 
                a thriving design business.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Fast Track Your Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our AI-powered matching connects you with ideal clients faster than ever.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Showcase Your Best Work
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Beautiful portfolio galleries that convert browsers into paying clients.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Protected Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Secure escrow system ensures you get paid for every project milestone.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-muted-foreground">
              Hear from designers who've transformed their careers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                      <span className="text-lg font-bold text-primary">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <Badge variant="secondary">{testimonial.earnings} earned</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join the Elite?</h2>
          <p className="text-muted-foreground mb-8">
            Applications are reviewed weekly. Only the most talented designers are accepted.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">Apply Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Questions? Contact Us</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Application review takes 2-3 business days • No application fee
          </p>
        </div>
      </section>

      <CTASection />
    </div>
  );
};

export default ForDesigners;