import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Edit, Plus, Trash2, GripVertical, Scale, CheckCircle, Clock, CreditCard, Shield, FileText, AlertTriangle } from 'lucide-react';

interface RefundPolicySection {
  id: string;
  name?: string;
  section_name?: string;
  type?: 'hero' | 'content' | 'features' | 'card';
  section_type?: 'hero' | 'content' | 'features' | 'card';
  title: string;
  content: string;
  icon?: string;
  background_color?: string;
  text_color?: string;
  is_published: boolean;
  sort_order: number;
}

const REFUND_POLICY_SECTIONS: RefundPolicySection[] = [
  {
    id: 'refund-hero',
    name: 'RefundHero',
    type: 'hero',
    title: 'Refund & Cancellation Policy',
    content: 'Last updated: January 1, 2024',
    icon: 'Scale',
    background_color: 'bg-gradient-to-br from-primary/10 via-background to-secondary/10',
    is_published: true,
    sort_order: 1
  },
  {
    id: 'overview-section',
    name: 'OverviewSection',
    type: 'content',
    title: 'Overview',
    content: 'At Meet My Designer, we strive to provide excellent service and ensure customer satisfaction. This policy outlines our refund and cancellation procedures for all services and transactions.',
    is_published: true,
    sort_order: 2
  },
  {
    id: 'general-refund-policy',
    name: 'GeneralRefundPolicy',
    type: 'card',
    title: 'General Refund Policy',
    content: '• Refunds are processed within 5-10 business days\n• Refunds will be issued to the original payment method\n• Processing fees may apply to certain refunds\n• Partial refunds may be issued based on work completed\n• All refund requests must be submitted through our support system',
    icon: 'CheckCircle',
    is_published: true,
    sort_order: 3
  },
  {
    id: 'session-cancellation-policy',
    name: 'SessionCancellationPolicy',
    type: 'content',
    title: 'Session Cancellation Policy',
    content: 'You may cancel or reschedule your design session under the following conditions:',
    is_published: true,
    sort_order: 4
  },
  {
    id: 'cancellation-timeframes',
    name: 'CancellationTimeframes',
    type: 'card',
    title: 'Cancellation Timeframes',
    content: '**24+ Hours Before Session**: Full refund or free rescheduling\n**2-24 Hours Before Session**: 50% refund or rescheduling with fee\n**Less than 2 Hours Before Session**: No refund, rescheduling with full fee',
    icon: 'Clock',
    is_published: true,
    sort_order: 5
  },
  {
    id: 'design-project-refunds',
    name: 'DesignProjectRefunds',
    type: 'content',
    title: 'Design Project Refunds',
    content: 'For ongoing design projects, refunds are calculated based on work completed and project milestones.',
    is_published: true,
    sort_order: 6
  },
  {
    id: 'project-refund-structure',
    name: 'ProjectRefundStructure',
    type: 'card',
    title: 'Project Refund Structure',
    content: '• **0-25% Complete**: 90% refund (10% processing fee)\n• **26-50% Complete**: 60% refund\n• **51-75% Complete**: 30% refund\n• **76-100% Complete**: No refund (work delivered)\n• **Quality Issues**: Full refund if work doesn\'t meet agreed standards',
    icon: 'CreditCard',
    is_published: true,
    sort_order: 7
  },
  {
    id: 'subscription-refunds',
    name: 'SubscriptionRefunds',
    type: 'content',
    title: 'Subscription and Membership Refunds',
    content: 'Monthly and annual subscriptions can be cancelled at any time with the following terms:',
    is_published: true,
    sort_order: 8
  },
  {
    id: 'subscription-terms',
    name: 'SubscriptionTerms',
    type: 'card',
    title: 'Subscription Terms',
    content: '• Monthly subscriptions: Cancellation effective next billing cycle\n• Annual subscriptions: Prorated refund for unused months\n• Premium features: Access continues until end of billing period\n• No refunds for partially used months',
    icon: 'Shield',
    is_published: true,
    sort_order: 9
  },
  {
    id: 'refund-request-process',
    name: 'RefundRequestProcess',
    type: 'content',
    title: 'Refund Request Process',
    content: 'To request a refund, please follow these steps:',
    is_published: true,
    sort_order: 10
  },
  {
    id: 'how-to-request-refund',
    name: 'HowToRequestRefund',
    type: 'card',
    title: 'How to Request a Refund',
    content: '1. Contact our support team at support@meetmydesigner.com\n2. Provide your order number and reason for refund\n3. Include any relevant documentation or screenshots\n4. Our team will review your request within 2 business days\n5. You\'ll receive confirmation and timeline for processing',
    icon: 'FileText',
    is_published: true,
    sort_order: 11
  },
  {
    id: 'non-refundable-items',
    name: 'NonRefundableItems',
    type: 'content',
    title: 'Non-Refundable Items',
    content: 'The following items are generally not eligible for refunds:',
    is_published: true,
    sort_order: 12
  },
  {
    id: 'exclusions',
    name: 'Exclusions',
    type: 'card',
    title: 'Exclusions',
    content: '• Completed and delivered design work\n• Digital products and templates\n• Services used beyond agreed scope\n• Refunds requested after 30 days of service completion\n• Third-party fees and processing charges',
    icon: 'AlertTriangle',
    is_published: true,
    sort_order: 13
  },
  {
    id: 'dispute-resolution',
    name: 'DisputeResolution',
    type: 'content',
    title: 'Dispute Resolution',
    content: 'If you\'re not satisfied with our refund decision, you can escalate your case through our dispute resolution process. We\'re committed to fair and transparent resolution of all issues.',
    is_published: true,
    sort_order: 14
  },
  {
    id: 'contact-information',
    name: 'ContactInformation',
    type: 'content',
    title: 'Contact Information',
    content: 'For questions about refunds or cancellations, please contact us at:\n• Email: support@meetmydesigner.com\n• Phone: +1 (555) 123-4567\n• Live Chat: Available on our website',
    is_published: true,
    sort_order: 15
  },
  {
    id: 'policy-updates',
    name: 'PolicyUpdates',
    type: 'content',
    title: 'Policy Updates',
    content: 'We reserve the right to update this refund and cancellation policy at any time. Changes will be posted on this page with an updated revision date. Continued use of our services after changes constitutes acceptance of the updated policy.',
    is_published: true,
    sort_order: 16
  }
];

export default function RefundPolicyManagement() {
  const [sections, setSections] = useState<RefundPolicySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<RefundPolicySection | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('website_sections')
        .select('*')
        .eq('page', 'refund-policy')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching sections:', error);
        // If table doesn't exist or other error, use default sections
        setSections(REFUND_POLICY_SECTIONS);
        toast({
          title: "Info",
          description: "Using default sections. Please run the database migration to enable live editing.",
        });
        return;
      }

      if (data && data.length > 0) {
        setSections(data);
      } else {
        // If no data exists, use the default sections
        setSections(REFUND_POLICY_SECTIONS);
        toast({
          title: "Info",
          description: "No sections found in database. Using default sections.",
        });
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      // Fallback to default sections
      setSections(REFUND_POLICY_SECTIONS);
      toast({
        title: "Info",
        description: "Using default sections. Please run the database migration to enable live editing.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName?: string) => {
    const iconMap: { [key: string]: any } = {
      'Scale': Scale,
      'CheckCircle': CheckCircle,
      'Clock': Clock,
      'CreditCard': CreditCard,
      'Shield': Shield,
      'FileText': FileText,
      'AlertTriangle': AlertTriangle
    };
    return iconMap[iconName || ''] || null;
  };

  const saveSection = async (section: RefundPolicySection) => {
    try {
      setSaving(true);
      
      const sectionData = {
        page: 'refund-policy',
        section_name: section.name || section.section_name || 'NewSection',
        section_type: section.type || section.section_type || 'content',
        title: section.title,
        content: section.content,
        icon: section.icon,
        // background_color: section.background_color, // Commented out - using fixed styling
        text_color: section.text_color || '#000000',
        is_published: section.is_published,
        sort_order: section.sort_order,
        updated_at: new Date().toISOString()
      };

      if (section.id && section.id.startsWith('refund-')) {
        // Update existing section
        const { error } = await supabase
          .from('website_sections')
          .update(sectionData)
          .eq('id', section.id);

        if (error) {
          console.error('Error updating section:', error);
          toast({
            title: "Error",
            description: "Failed to save section. Please run the database migration first.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Insert new section - use upsert to handle duplicates
        const { error } = await supabase
          .from('website_sections')
          .upsert(sectionData, { 
            onConflict: 'page,section_name',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('Error inserting section:', error);
          toast({
            title: "Error",
            description: "Failed to save section. Please run the database migration first.",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Refresh sections from database
      await fetchSections();
      
      toast({
        title: "Success",
        description: "Section updated successfully.",
      });

      setEditingSection(null);
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: "Error",
        description: "Failed to save section. Please run the database migration first.",
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

  const addNewSection = () => {
    const newSection: RefundPolicySection = {
      id: `new-section-${Date.now()}`,
      name: `NewSection${Date.now()}`, // Make it unique
      type: 'content',
      title: 'New Section',
      content: 'Add your content here...',
      is_published: false,
      sort_order: sections.length + 1
    };
    setEditingSection(newSection);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Refund Policy Sections</h1>
          <p className="text-muted-foreground">
            Manage refund policy sections with the same UI structure as your live website
          </p>
        </div>
        <Button onClick={addNewSection}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Section
        </Button>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => {
          const IconComponent = getIconComponent(section.icon);
          
          return (
            <Card key={section.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{section.name || section.section_name}</CardTitle>
                      <CardDescription>
                        {section.title}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={(section.type || section.section_type) === 'hero' ? 'default' : (section.type || section.section_type) === 'card' ? 'secondary' : 'outline'}>
                      {section.type || section.section_type}
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
                <div className="p-4 rounded-lg bg-white border">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
                      <h3 className="font-semibold text-lg">{section.title}</h3>
                    </div>
                    <div className="text-sm max-h-32 overflow-hidden">
                      <div dangerouslySetInnerHTML={{
                        __html: (() => {
                          // If content already contains HTML tags, use it directly
                          if (section.content.includes('<strong>') || section.content.includes('<em>') || section.content.includes('<ul>') || section.content.includes('<ol>')) {
                            return section.content;
                          }
                          
                          // Convert markdown-style formatting to HTML for backward compatibility
                          let formattedContent = section.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/^• (.*$)/gm, '<li>$1</li>')
                            .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
                            .replace(/\n/g, '<br>')
                            .replace(/(<li>.*<\/li>)(<br><li>.*<\/li>)*/g, (match) => {
                              const listItems = match.replace(/<br>/g, '').replace(/<li>/g, '<li>').replace(/<\/li>/g, '</li>');
                              return `<ul>${listItems}</ul>`;
                            });
                          return formattedContent;
                        })()
                      }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Section Dialog */}
      {editingSection && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <CardTitle>Edit Section: {editingSection.name}</CardTitle>
            <CardDescription>
              Update the content and styling for this refund policy section
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Section Name</Label>
                <Input
                  id="name"
                  value={editingSection.name || editingSection.section_name || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type">Section Type</Label>
                <select
                  id="type"
                  value={editingSection.type || editingSection.section_type || 'content'}
                  onChange={(e) => setEditingSection({ ...editingSection, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="hero">Hero</option>
                  <option value="content">Content</option>
                  <option value="card">Card</option>
                  <option value="features">Features</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editingSection.title}
                onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editor = document.getElementById('rich-editor') as HTMLDivElement;
                      document.execCommand('bold', false);
                      editor.focus();
                    }}
                  >
                    <strong>B</strong>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editor = document.getElementById('rich-editor') as HTMLDivElement;
                      document.execCommand('italic', false);
                      editor.focus();
                    }}
                  >
                    <em>I</em>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editor = document.getElementById('rich-editor') as HTMLDivElement;
                      document.execCommand('insertUnorderedList', false);
                      editor.focus();
                    }}
                  >
                    •
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editor = document.getElementById('rich-editor') as HTMLDivElement;
                      document.execCommand('insertOrderedList', false);
                      editor.focus();
                    }}
                  >
                    1.
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editor = document.getElementById('rich-editor') as HTMLDivElement;
                      document.execCommand('insertHorizontalRule', false);
                      editor.focus();
                    }}
                  >
                    —
                  </Button>
                </div>
                <div
                  id="rich-editor"
                  contentEditable
                  className="min-h-[200px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                  onInput={(e) => {
                    const content = e.currentTarget.innerHTML;
                    setEditingSection({ ...editingSection, content });
                  }}
                  dangerouslySetInnerHTML={{ __html: editingSection.content }}
                />
                <div className="text-xs text-muted-foreground">
                  <p><strong>Formatting:</strong></p>
                  <p>• Use <strong>B</strong> button for bold text</p>
                  <p>• Use <strong>I</strong> button for italic text</p>
                  <p>• Use <strong>•</strong> for bullet points</p>
                  <p>• Use <strong>1.</strong> for numbered lists</p>
                  <p>• Use <strong>—</strong> for horizontal lines</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="icon">Icon (Optional)</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[
                    { value: '', label: 'No Icon', icon: null },
                    { value: 'Scale', label: 'Scale', icon: Scale },
                    { value: 'CheckCircle', label: 'CheckCircle', icon: CheckCircle },
                    { value: 'Clock', label: 'Clock', icon: Clock },
                    { value: 'CreditCard', label: 'CreditCard', icon: CreditCard },
                    { value: 'Shield', label: 'Shield', icon: Shield },
                    { value: 'FileText', label: 'FileText', icon: FileText },
                    { value: 'AlertTriangle', label: 'AlertTriangle', icon: AlertTriangle },
                  ].map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setEditingSection({ ...editingSection, icon: option.value })}
                        className={`p-3 border rounded-md text-center hover:bg-gray-50 transition-colors ${
                          editingSection.icon === option.value ? 'border-primary bg-primary/10' : 'border-gray-200'
                        }`}
                      >
                        {IconComponent ? (
                          <IconComponent className="h-6 w-6 mx-auto mb-1" />
                        ) : (
                          <div className="h-6 w-6 mx-auto mb-1 bg-gray-200 rounded"></div>
                        )}
                        <div className="text-xs text-gray-600">{option.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Background Color option commented out - using fixed styling */}
              {/* <div>
                <Label htmlFor="background">Background Color</Label>
                <Input
                  id="background"
                  value={editingSection.background_color || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, background_color: e.target.value })}
                  placeholder="bg-white, bg-gray-50, etc."
                />
              </div> */}
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