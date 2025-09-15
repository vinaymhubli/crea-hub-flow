import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle, Clock, CreditCard, Shield, FileText, AlertTriangle, Users, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface TermsContent {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  updated_at: string;
}

const TermsDynamic = () => {
  const [content, setContent] = useState<TermsContent | null>(null);
  const [loading, setLoading] = useState(true);

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
        .eq('is_published', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setContent(data);
      }
    } catch (error) {
      console.error('Error fetching terms content:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Terms and Conditions</h1>
          <p className="text-muted-foreground">Content not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Badge className="mb-4" variant="secondary">
            <Scale className="w-4 h-4 mr-2" />
            Terms and Conditions
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {content.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Last updated: {new Date(content.updated_at).toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={renderFormattedContent(content.content)} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsDynamic;
