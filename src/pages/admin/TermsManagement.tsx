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

interface TermsContent {
  id?: string;
  title: string;
  content: string;
  is_published: boolean;
  updated_at?: string;
}

export default function TermsManagement() {
  const [content, setContent] = useState<TermsContent>({
    title: 'Terms and Conditions',
    content: `# Terms and Conditions

Last updated: January 31, 2025

## 1. Acceptance of Terms

By accessing and using Meetmydesigners ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement.

## 2. Description of Service

Meetmydesigners is a platform that connects clients with verified designers for real-time collaboration and consultation services.

## 3. User Accounts

### 3.1 Account Creation
- Users must provide accurate and complete information
- Users are responsible for maintaining account security
- Users must be at least 18 years old to create an account

### 3.2 Account Responsibilities
- Users are responsible for all activities under their account
- Users must notify us immediately of any unauthorized use
- Users may not share account credentials

## 4. Designer Verification

### 4.1 Verification Process
- All designers undergo a comprehensive verification process
- Verification includes portfolio review, skill assessment, and background checks
- Only verified designers can offer services on the platform

### 4.2 Designer Responsibilities
- Designers must maintain accurate profiles
- Designers must deliver work according to agreed specifications
- Designers must maintain professional standards

## 5. Payment Terms

### 5.1 Payment Processing
- Payments are processed securely through our platform
- Funds are held in escrow until project completion
- We support all major payment methods

### 5.2 Refund Policy
- Refunds are available within 30 days of project completion
- Refund requests must be submitted through the platform
- Refunds are processed within 5-7 business days

## 6. Intellectual Property

### 6.1 Client Rights
- Clients retain ownership of their original content
- Clients receive full rights to completed work
- Clients may not use designer work without payment

### 6.2 Designer Rights
- Designers retain rights to their portfolio and process
- Designers may showcase completed work in their portfolio
- Designers may not use client content for other projects

## 7. Prohibited Activities

Users may not:
- Violate any applicable laws or regulations
- Infringe on intellectual property rights
- Engage in fraudulent or deceptive practices
- Harass or abuse other users
- Share inappropriate or offensive content

## 8. Limitation of Liability

Meetmydesigners is not liable for:
- Indirect, incidental, or consequential damages
- Loss of profits or business opportunities
- Damages exceeding the amount paid for services

## 9. Termination

### 9.1 User Termination
- Users may terminate their account at any time
- Termination does not affect completed transactions
- Outstanding obligations must be fulfilled

### 9.2 Platform Termination
- We may terminate accounts for violations of these terms
- We will provide notice before termination when possible
- Termination may result in loss of access to the platform

## 10. Changes to Terms

We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or platform notification.

## 11. Contact Information

For questions about these terms, please contact us at:
- Email: legal@meetmydesigner.com
- Address: Meetmydesigners Inc., 123 Design Street, New York, NY 10001`,
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
        .eq('page_type', 'terms')
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
      console.error('Error fetching terms content:', error);
      toast({
        title: "Error",
        description: "Failed to load terms and conditions content.",
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
        page_type: 'terms',
        title: content.title,
        content: content.content,
        is_published: content.is_published,
        updated_at: new Date().toISOString()
      };

      if (content.id) {
        // Update existing content
        const { error } = await supabase
          .from('content_pages')
          .update(contentData)
          .eq('id', content.id);

        if (error) throw error;
      } else {
        // Create new content
        const { error } = await supabase
          .from('content_pages')
          .insert(contentData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Terms and conditions updated successfully.",
      });

      // Refresh content
      await fetchContent();
    } catch (error) {
      console.error('Error saving terms content:', error);
      toast({
        title: "Error",
        description: "Failed to save terms and conditions.",
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
          <h1 className="text-3xl font-bold">Terms & Conditions</h1>
          <p className="text-muted-foreground">
            Manage your platform's terms and conditions
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
          <CardTitle>Terms & Conditions Content</CardTitle>
          <CardDescription>
            Update your platform's terms and conditions
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
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const editor = document.getElementById('terms-rich-editor') as HTMLDivElement;
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
                    const editor = document.getElementById('terms-rich-editor') as HTMLDivElement;
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
                    const editor = document.getElementById('terms-rich-editor') as HTMLDivElement;
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
                    const editor = document.getElementById('terms-rich-editor') as HTMLDivElement;
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
                    const editor = document.getElementById('terms-rich-editor') as HTMLDivElement;
                    document.execCommand('insertHorizontalRule', false);
                    editor.focus();
                  }}
                >
                  —
                </Button>
              </div>
              <div
                id="terms-rich-editor"
                contentEditable
                className="min-h-[400px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                style={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
                onInput={(e) => {
                  const contentValue = e.currentTarget.innerHTML;
                  setContent({ ...content, content: contentValue });
                }}
                dangerouslySetInnerHTML={{ __html: content.content }}
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
