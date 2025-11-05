import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Plus, Edit, Trash2, Eye, EyeOff, Move, GripVertical } from 'lucide-react';

interface WebsiteSection {
  id: string;
  page: string;
  section_name: string;
  section_type: 'hero' | 'content' | 'features' | 'testimonials' | 'cta' | 'footer';
  title: string;
  subtitle?: string;
  content: string;
  background_color?: string;
  text_color?: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const PAGE_SECTIONS = {
  'about': [
    { name: 'AboutHero', type: 'hero', title: 'Revolutionizing Design Collaboration' },
    { name: 'MissionSection', type: 'content', title: 'Our Mission is Simple: Bridge Creative Gaps' },
    { name: 'StorySection', type: 'content', title: 'Our Story' },
    { name: 'ValuesSection', type: 'features', title: 'Our Values' },
    { name: 'TeamSection', type: 'content', title: 'Meet Our Team' }
  ],
  'contact': [
    { name: 'ContactHero', type: 'hero', title: 'Get in Touch' },
    { name: 'ContactMethods', type: 'features', title: 'Contact Methods' },
    { name: 'ContactForm', type: 'content', title: 'Send us a Message' },
    { name: 'MapSection', type: 'content', title: 'Find Us' }
  ],
  // 'support': [
  //   { name: 'SupportHero', type: 'hero', title: 'How can we help you?' },
  //   { name: 'SupportChannels', type: 'features', title: 'Get Support Your Way' },
  //   { name: 'FAQSection', type: 'content', title: 'Frequently Asked Questions' },
  //   { name: 'SupportResources', type: 'content', title: 'Support Resources' }
  // ],
  'refund-policy': [
    { name: 'RefundHero', type: 'hero', title: 'Refund & Cancellation Policy' },
    { name: 'OverviewSection', type: 'content', title: 'Overview' },
    { name: 'GeneralRefundPolicy', type: 'content', title: 'General Refund Policy' },
    { name: 'SessionCancellationPolicy', type: 'content', title: 'Session Cancellation Policy' },
    { name: 'CancellationTimeframes', type: 'features', title: 'Cancellation Timeframes' },
    { name: 'DesignProjectRefunds', type: 'content', title: 'Design Project Refunds' },
    { name: 'ProjectRefundStructure', type: 'features', title: 'Project Refund Structure' },
    { name: 'SubscriptionRefunds', type: 'content', title: 'Subscription and Membership Refunds' },
    { name: 'SubscriptionTerms', type: 'features', title: 'Subscription Terms' },
    { name: 'RefundRequestProcess', type: 'content', title: 'Refund Request Process' },
    { name: 'HowToRequestRefund', type: 'features', title: 'How to Request a Refund' },
    { name: 'NonRefundableItems', type: 'content', title: 'Non-Refundable Items' },
    { name: 'Exclusions', type: 'features', title: 'Exclusions' },
    { name: 'DisputeResolution', type: 'content', title: 'Dispute Resolution' },
    { name: 'ContactInformation', type: 'content', title: 'Contact Information' },
    { name: 'PolicyUpdates', type: 'content', title: 'Policy Updates' }
  ]
};

export default function WebsiteSectionManager() {
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPage, setSelectedPage] = useState('about');
  const [editingSection, setEditingSection] = useState<WebsiteSection | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSections();
  }, [selectedPage]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data that matches the existing website structure
      const mockSections: WebsiteSection[] = PAGE_SECTIONS[selectedPage as keyof typeof PAGE_SECTIONS].map((section, index) => ({
        id: `${selectedPage}-${section.name.toLowerCase()}`,
        page: selectedPage,
        section_name: section.name,
        section_type: section.type as any,
        title: section.title,
        subtitle: '',
        content: getDefaultContent(section.name, section.type),
        background_color: getDefaultBackground(section.type),
        text_color: '#000000',
        is_published: true,
        sort_order: index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      setSections(mockSections);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: "Error",
        description: "Failed to load website sections.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = (sectionName: string, type: string) => {
    const contentMap: { [key: string]: string } = {
      'AboutHero': `# Revolutionizing Design Collaboration

We're building a revolutionary real-time design platform that connects visionary clients with world-class designers for seamless creative collaboration worldwide.

**Trusted by 10,000+ Clients**`,
      'MissionSection': `# Our Mission is Simple: Bridge Creative Gaps

We believe every business deserves access to exceptional design talent. Our platform eliminates geographical barriers and connects you with skilled designers who understand your vision and can bring it to life in real-time.

## Key Features:
- **Innovation First**: Cutting-edge tools and processes
- **Quality Assured**: Only verified designers
- **Global Reach**: Worldwide collaboration`,
      'ContactHero': `# Get in Touch

Ready to start your next design project? We're here to help you connect with the perfect designer for your needs.`,
      'SupportHero': `# How can we help you?

Find answers, get support, and make the most of Meetmydesigners.`,
      'RefundHero': `# Refund & Cancellation Policy

Last updated: January 1, 2024`,
      'OverviewSection': `At Meetmydesigners, we strive to provide excellent service and ensure customer satisfaction. This policy outlines our refund and cancellation procedures for all services and transactions.`,
      'GeneralRefundPolicy': `• Refunds are processed within 5-10 business days
• Refunds will be issued to the original payment method
• Processing fees may apply to certain refunds
• Partial refunds may be issued based on work completed
• All refund requests must be submitted through our support system`,
      'SessionCancellationPolicy': `You may cancel or reschedule your design session under the following conditions:`,
      'CancellationTimeframes': `**24+ Hours Before Session**: Full refund or free rescheduling
**2-24 Hours Before Session**: 50% refund or rescheduling with fee
**Less than 2 Hours Before Session**: No refund, rescheduling with full fee`,
      'DesignProjectRefunds': `For ongoing design projects, refunds are calculated based on work completed and project milestones.`,
      'ProjectRefundStructure': `• **0-25% Complete**: 90% refund (10% processing fee)
• **26-50% Complete**: 60% refund
• **51-75% Complete**: 30% refund
• **76-100% Complete**: No refund (work delivered)
• **Quality Issues**: Full refund if work doesn't meet agreed standards`,
      'SubscriptionRefunds': `Monthly and annual subscriptions can be cancelled at any time with the following terms:`,
      'SubscriptionTerms': `• Monthly subscriptions: Cancellation effective next billing cycle
• Annual subscriptions: Prorated refund for unused months
• Premium features: Access continues until end of billing period
• No refunds for partially used months`,
      'RefundRequestProcess': `To request a refund, please follow these steps:`,
      'HowToRequestRefund': `1. Contact our support team at support@meetmydesigner.com
2. Provide your order number and reason for refund
3. Include any relevant documentation or screenshots
4. Our team will review your request within 2 business days
5. You'll receive confirmation and timeline for processing`,
      'NonRefundableItems': `The following items are generally not eligible for refunds:`,
      'Exclusions': `• Completed and delivered design work
• Digital products and templates
• Services used beyond agreed scope
• Refunds requested after 30 days of service completion
• Third-party fees and processing charges`,
      'DisputeResolution': `If you're not satisfied with our refund decision, you can escalate your case through our dispute resolution process. We're committed to fair and transparent resolution of all issues.`,
      'ContactInformation': `For questions about refunds or cancellations, please contact us at:
• Email: support@meetmydesigner.com
• Phone: +1 (555) 123-4567
• Live Chat: Available on our website`,
      'PolicyUpdates': `We reserve the right to update this refund and cancellation policy at any time. Changes will be posted on this page with an updated revision date. Continued use of our services after changes constitutes acceptance of the updated policy.`
    };
    return contentMap[sectionName] || 'Content for this section...';
  };

  const getDefaultBackground = (type: string) => {
    const backgroundMap: { [key: string]: string } = {
      'hero': 'bg-gradient-to-br from-green-50 to-blue-50',
      'content': 'bg-white',
      'features': 'bg-gray-50',
      'testimonials': 'bg-blue-50',
      'cta': 'bg-green-600',
      'footer': 'bg-gray-900'
    };
    return backgroundMap[type] || 'bg-white';
  };

  const saveSection = async (section: WebsiteSection) => {
    try {
      setSaving(true);
      
      const sectionData = {
        page: section.page,
        section_name: section.section_name,
        section_type: section.section_type,
        title: section.title,
        subtitle: section.subtitle,
        content: section.content,
        background_color: section.background_color,
        text_color: section.text_color,
        is_published: section.is_published,
        sort_order: section.sort_order,
        updated_at: new Date().toISOString()
      };

      // Update the section in the state
      setSections(prev => prev.map(s => s.id === section.id ? { ...s, ...sectionData } : s));
      
      toast({
        title: "Success",
        description: "Section updated successfully.",
      });

      setEditingSection(null);
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: "Error",
        description: "Failed to save section.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      await saveSection({ ...section, is_published: !section.is_published });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Website Section Manager</h1>
          <p className="text-muted-foreground">
            Manage website sections with the same UI structure as your live site
          </p>
        </div>
      </div>

      <Tabs value={selectedPage} onValueChange={setSelectedPage} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="about">About Page</TabsTrigger>
          <TabsTrigger value="contact">Contact Page</TabsTrigger>
          <TabsTrigger value="support">Support Page</TabsTrigger>
          <TabsTrigger value="refund-policy">Refund Policy</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPage} className="space-y-4">
          <div className="grid gap-4">
            {sections.map((section) => (
              <Card key={section.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{section.section_name}</CardTitle>
                        <CardDescription>
                          {section.title}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={section.section_type === 'hero' ? 'default' : 'secondary'}>
                        {section.section_type}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor={`publish-${section.id}`} className="text-sm">
                          {section.is_published ? 'Published' : 'Draft'}
                        </Label>
                        <Switch
                          id={`publish-${section.id}`}
                          checked={section.is_published}
                          onCheckedChange={() => togglePublish(section.id)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSection(section)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className={`p-4 rounded-lg ${section.background_color} border`}>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{section.title}</h3>
                      {section.subtitle && (
                        <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                      )}
                      <div className="text-sm whitespace-pre-wrap max-h-32 overflow-hidden">
                        {section.content}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Section Dialog */}
      {editingSection && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <CardTitle>Edit Section: {editingSection.section_name}</CardTitle>
            <CardDescription>
              Update the content and styling for this website section
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                <Input
                  id="subtitle"
                  value={editingSection.subtitle || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editingSection.content}
                onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                rows={10}
                className="min-h-[200px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="background">Background Color</Label>
                <Input
                  id="background"
                  value={editingSection.background_color || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, background_color: e.target.value })}
                  placeholder="bg-white, bg-gray-50, etc."
                />
              </div>
              <div>
                <Label htmlFor="textColor">Text Color</Label>
                <Input
                  id="textColor"
                  type="color"
                  value={editingSection.text_color || '#000000'}
                  onChange={(e) => setEditingSection({ ...editingSection, text_color: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={editingSection.is_published}
                onCheckedChange={(checked) => setEditingSection({ ...editingSection, is_published: checked })}
              />
              <Label htmlFor="published">Published</Label>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingSection(null)}>
                Cancel
              </Button>
              <Button onClick={() => saveSection(editingSection)} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
