import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Edit } from 'lucide-react';

interface HelpCenterContent {
  id?: string;
  title: string;
  content: string;
  is_published: boolean;
  updated_at?: string;
}

export default function HelpCenterManagement() {
  const [content, setContent] = useState<HelpCenterContent>({
    title: 'Help Center',
    content: `# Help Center

Welcome to the Meet My Designer Help Center. Find answers to common questions and get the support you need.

## Getting Started

### For Clients
1. **Create Your Account**: Sign up with your email and create a profile
2. **Browse Designers**: Explore verified designer profiles and portfolios
3. **Request Consultation**: Send consultation requests to designers you're interested in
4. **Collaborate**: Work with designers through our real-time collaboration tools

### For Designers
1. **Apply for Verification**: Submit your portfolio and credentials for review
2. **Complete Verification**: Pass our comprehensive verification process
3. **Build Your Profile**: Create an attractive profile showcasing your work
4. **Start Earning**: Accept consultation requests and start collaborating with clients

## Common Questions

### Account & Profile
- How do I update my profile information?
- How do I change my password?
- How do I delete my account?
- How do I verify my email address?

### Payments & Billing
- How do I add a payment method?
- How does the escrow system work?
- When do I get paid as a designer?
- How do I request a refund?

### Collaboration & Projects
- How do I start a video call with a designer?
- How do I share files securely?
- How do I track project progress?
- How do I leave feedback?

### Technical Support
- The platform is running slowly, what should I do?
- I can't access my account, help!
- Video calls aren't working properly
- I'm having trouble uploading files

## Support Channels

### Live Chat
- **Available**: 24/7
- **Response Time**: < 2 minutes
- **Best For**: Quick questions and immediate help

### Email Support
- **Available**: 24/7
- **Response Time**: < 4 hours
- **Best For**: Detailed questions and complex issues

### Phone Support
- **Available**: Monday - Friday, 9:00 AM - 6:00 PM EST
- **Response Time**: Immediate
- **Best For**: Urgent issues and complex problems

### Video Call Support
- **Available**: By appointment
- **Response Time**: Same day
- **Best For**: Screen sharing and complex technical issues

## Resources

### User Guides
- Complete platform walkthrough
- Step-by-step tutorials
- Best practices and tips
- Video demonstrations

### Community Forum
- Connect with other users
- Share experiences and tips
- Get help from the community
- Participate in discussions

### Knowledge Base
- Comprehensive documentation
- Searchable articles
- Troubleshooting guides
- Platform updates and news

## System Status

Check our system status page for real-time updates on platform performance:
- **Platform**: Operational (99.9% uptime)
- **Payments**: Operational (99.8% uptime)
- **Video Calls**: Operational (99.7% uptime)
- **File Uploads**: Operational (99.9% uptime)

## Contact Us

Still need help? Contact our support team:
- **Email**: support@meetmydesigner.com
- **Phone**: +1 (555) 123-4567
- **Live Chat**: Available on our website
- **Business Hours**: Monday - Friday, 9:00 AM - 6:00 PM EST`,
    is_published: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_pages')
        .select('*')
        .eq('page_type', 'help-center')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setContent({
          id: data.id,
          title: data.title,
          content: data.content,
          is_published: data.is_published,
          updated_at: data.updated_at
        });
      }
    } catch (error) {
      console.error('Error fetching help center content:', error);
      toast({
        title: "Error",
        description: "Failed to load help center content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    try {
      setSaving(true);
      
      const contentData = {
        page_type: 'help-center',
        title: content.title,
        content: content.content,
        is_published: content.is_published,
        updated_at: new Date().toISOString()
      };

      if (content.id) {
        const { error } = await supabase
          .from('content_pages')
          .update(contentData)
          .eq('id', content.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('content_pages')
          .insert(contentData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Help center content updated successfully.",
      });

      await fetchContent();
    } catch (error) {
      console.error('Error saving help center content:', error);
      toast({
        title: "Error",
        description: "Failed to save help center content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Help Center</h1>
          <p className="text-muted-foreground">
            Manage your platform's help center content
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="published">Published</Label>
          <Switch
            id="published"
            checked={content.is_published}
            onCheckedChange={(checked) => setContent({ ...content, is_published: checked })}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Help Center Content</CardTitle>
          <CardDescription>
            Update your platform's help center information and resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              placeholder="Enter title"
            />
          </div>
          
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content.content}
              onChange={(e) => setContent({ ...content, content: e.target.value })}
              placeholder="Enter help center content..."
              rows={20}
              className="min-h-[400px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {content.updated_at && (
                <span>Last updated: {new Date(content.updated_at).toLocaleDateString()}</span>
              )}
            </div>
            <Button onClick={saveContent} disabled={saving}>
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
    </div>
  );
}
