import React, { useState } from 'react';
import { Search, MessageCircle, FileText, Video, Mail, Phone, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import ContactForm from '@/components/ContactForm';

const Support = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const supportChannels = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "24/7",
      responseTime: "< 2 minutes",
      action: "Start Chat"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message",
      availability: "24/7",
      responseTime: "< 4 hours",
      action: "Send Email"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our experts",
      availability: "Mon-Fri 9AM-6PM",
      responseTime: "Immediate",
      action: "Call Now"
    },
    {
      icon: Video,
      title: "Video Call",
      description: "Screen sharing for complex issues",
      availability: "By appointment",
      responseTime: "Same day",
      action: "Schedule Call"
    }
  ];

  const quickLinks = [
    { title: "Getting Started Guide", category: "Basics", icon: "📖" },
    { title: "Payment & Billing", category: "Billing", icon: "💳" },
    { title: "Designer Verification", category: "Designers", icon: "✅" },
    { title: "Project Management", category: "Projects", icon: "📋" },
    { title: "Quality Guarantee", category: "Policies", icon: "🛡️" },
    { title: "Platform Fees", category: "Billing", icon: "💰" }
  ];

  const faqs = [
    {
      question: "How do I get started as a client?",
      answer: "Simply sign up, browse our designer profiles, and send consultation requests. Our matching algorithm will help you find designers that fit your specific needs and budget."
    },
    {
      question: "What's included in the designer verification process?",
      answer: "Our verification includes portfolio review, skill assessment, background check, and reference verification. Only the top 5% of applicants are accepted."
    },
    {
      question: "How does the payment system work?",
      answer: "Payments are held in escrow until project milestones are completed. This protects both clients and designers. We support all major payment methods."
    },
    {
      question: "What happens if I'm not satisfied with the work?",
      answer: "We offer a 100% satisfaction guarantee. If you're not happy, we'll work with you and the designer to make it right, or provide a full refund."
    },
    {
      question: "Can I work with multiple designers on one project?",
      answer: "Yes! Many clients work with multiple designers for different aspects of their project. Our platform makes it easy to manage multiple collaborations."
    },
    {
      question: "How quickly can I find a designer?",
      answer: "Most clients receive their first responses within 24 hours. For urgent projects, we offer expedited matching with a response time of under 2 hours."
    }
  ];

  const systemStatus = [
    { service: "Platform", status: "Operational", uptime: "99.9%" },
    { service: "Payments", status: "Operational", uptime: "99.8%" },
    { service: "Video Calls", status: "Operational", uptime: "99.7%" },
    { service: "File Storage", status: "Operational", uptime: "99.9%" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            How can we help you?
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers, get support, and make the most of Meetmydesigners
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search for help articles, guides, or FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {quickLinks.map((link, index) => (
              <Badge key={index} className="bg-green-100 text-green-800 border-green-200 cursor-pointer hover:bg-green-200 transition-colors">
                {link.icon} {link.title}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Get Support Your Way</h2>
            <p className="text-gray-600">Choose the support channel that works best for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <CardTitle className="text-xl text-gray-900">{channel.title}</CardTitle>
                    <CardDescription className="text-gray-600">{channel.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Availability:</span>
                        <span className="text-sm font-medium text-gray-900">{channel.availability}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Response:</span>
                        <span className="text-sm font-medium text-gray-900">{channel.responseTime}</span>
                      </div>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700">{channel.action}</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support Resources */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs defaultValue="faq" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="guides">Guides</TabsTrigger>
              <TabsTrigger value="status">System Status</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="faq" className="mt-8">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">Frequently Asked Questions</h3>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </TabsContent>

            <TabsContent value="guides" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Getting Started as a Client", time: "5 min read", category: "Basics" },
                  { title: "How to Choose the Right Designer", time: "8 min read", category: "Tips" },
                  { title: "Designer Onboarding Guide", time: "10 min read", category: "Designers" },
                  { title: "Project Management Best Practices", time: "6 min read", category: "Projects" },
                  { title: "Understanding Platform Fees", time: "3 min read", category: "Billing" },
                  { title: "Quality Assurance Process", time: "7 min read", category: "Quality" }
                ].map((guide, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary">{guide.category}</Badge>
                        <span className="text-sm text-muted-foreground">{guide.time}</span>
                      </div>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" className="p-0 h-auto">
                        Read More <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="status" className="mt-8">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">System Status</h3>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-gray-900">All Systems Operational</CardTitle>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Healthy
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-600">Last updated: {new Date().toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {systemStatus.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            <span className="font-medium text-gray-900">{service.service}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Uptime: {service.uptime}</span>
                            <Badge className="bg-green-100 text-green-800">{service.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="mt-8">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">Contact Our Support Team</h3>
                <ContactForm />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="py-12 bg-green-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Clock className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-gray-900">Need Urgent Help?</h3>
          <p className="text-gray-600 mb-4">
            For critical issues affecting live projects or urgent technical problems
          </p>
          <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
            <Phone className="w-4 h-4 mr-2" />
            Emergency Support: +1 (555) 123-4567
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Support;