import React, { useState, useEffect } from 'react';
import { FileText, Scale, AlertTriangle, CheckCircle, Clock, CreditCard, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface WebsiteSection {
  id: string;
  page: string;
  section_name: string;
  section_type: 'hero' | 'content' | 'features' | 'card' | 'testimonials' | 'cta' | 'footer';
  title: string;
  subtitle?: string;
  content: string;
  icon?: string;
  background_color?: string;
  text_color?: string;
  is_published: boolean;
  sort_order: number;
}

const RefundPolicyDynamic = () => {
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('website_sections')
        .select('*')
        .eq('page', 'refund-policy')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setSections(data as any || []);
    } catch (error) {
      console.error('Error fetching refund policy sections:', error);
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

  const renderFormattedContent = (content: string) => {
    // If content already contains HTML tags, use it directly
    if (content.includes('<strong>') || content.includes('<em>') || content.includes('<ul>') || content.includes('<ol>')) {
      return { __html: content };
    }

    // Convert markdown-style formatting to HTML for backward compatibility
    let formattedContent = content
      // Convert **text** to <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert *text* to <em>text</em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert bullet points to proper list items
      .replace(/^• (.*$)/gm, '<li>$1</li>')
      // Convert numbered lists
      .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
      // Convert line breaks to <br>
      .replace(/\n/g, '<br>');

    // Wrap consecutive <li> elements in <ul>
    formattedContent = formattedContent.replace(/(<li>.*<\/li>)(<br><li>.*<\/li>)*/g, (match) => {
      const listItems = match.replace(/<br>/g, '').replace(/<li>/g, '<li>').replace(/<\/li>/g, '</li>');
      return `<ul>₹{listItems}</ul>`;
    });

    return { __html: formattedContent };
  };

  const renderSection = (section: WebsiteSection) => {
    const IconComponent = getIconComponent(section.icon);

    switch (section.section_type) {
      case 'hero':
        return (
          <section key={section.id} className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <Badge className="mb-4" variant="secondary">
                {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
                {section.title}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {section.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {section.content}
              </p>
            </div>
          </section>
        );

      case 'content':
        return (
          <section key={section.id} className="py-8">
            <div className="max-w-4xl mx-auto px-6">
              <div className="prose prose-lg max-w-none">
                <h2>{section.title}</h2>
                <div dangerouslySetInnerHTML={renderFormattedContent(section.content)} />
              </div>
            </div>
          </section>
        );

      case 'card':
        return (
          <section key={section.id} className="py-8">
            <div className="max-w-4xl mx-auto px-6">
              <Card className="my-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {IconComponent && <IconComponent className="w-5 h-5 mr-2" />}
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div dangerouslySetInnerHTML={renderFormattedContent(section.content)} />
                </CardContent>
              </Card>
            </div>
          </section>
        );

      default:
        return (
          <section key={section.id} className="py-8">
            <div className="max-w-4xl mx-auto px-6">
              <h2>{section.title}</h2>
              <div dangerouslySetInnerHTML={renderFormattedContent(section.content)} />
            </div>
          </section>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading refund policy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {sections.map(renderSection)}
    </div>
  );
};

export default RefundPolicyDynamic;
