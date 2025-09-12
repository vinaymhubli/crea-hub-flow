import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, Edit, Eye, Plus, Globe, HelpCircle, 
  MessageSquare, Bell, DollarSign, BookOpen,
  CheckCircle, Clock, AlertTriangle, TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ContentPage {
  id: string;
  page_type: string;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_published: boolean;
  created_at: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  published_at: string;
  view_count: number;
  created_at: string;
}

interface CMSStats {
  total_pages: number;
  published_pages: number;
  total_faqs: number;
  published_faqs: number;
  total_blog_posts: number;
  published_blog_posts: number;
  total_views: number;
  recent_updates: number;
}

export default function CMSDashboard() {
  const { user } = useAuth();
  const [contentPages, setContentPages] = useState<ContentPage[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<CMSStats | null>(null);
  const [loading, setLoading] = useState(true);

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch content pages
      const { data: pagesData } = await supabase
        .from('content_pages')
        .select('*')
        .order('updated_at', { ascending: false });

      // Fetch FAQs
      const { data: faqsData } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch blog posts
      const { data: blogData } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      setContentPages(pagesData || []);
      setFaqs(faqsData || []);
      setBlogPosts(blogData || []);

      // Calculate stats
      const stats: CMSStats = {
        total_pages: pagesData?.length || 0,
        published_pages: pagesData?.filter(p => p.is_published).length || 0,
        total_faqs: faqsData?.length || 0,
        published_faqs: faqsData?.filter(f => f.is_published).length || 0,
        total_blog_posts: blogData?.length || 0,
        published_blog_posts: blogData?.filter(b => b.is_published).length || 0,
        total_views: blogData?.reduce((sum, b) => sum + b.view_count, 0) || 0,
        recent_updates: pagesData?.filter(p => 
          new Date(p.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching CMS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPageTypeIcon = (type: string) => {
    switch (type) {
      case 'faq':
        return <HelpCircle className="h-4 w-4" />;
      case 'terms':
        return <FileText className="h-4 w-4" />;
      case 'support':
        return <MessageSquare className="h-4 w-4" />;
      case 'about':
        return <Globe className="h-4 w-4" />;
      case 'contact':
        return <Bell className="h-4 w-4" />;
      case 'refund_policy':
        return <DollarSign className="h-4 w-4" />;
      case 'help_center':
        return <HelpCircle className="h-4 w-4" />;
      case 'blog':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPageTypeLabel = (type: string) => {
    switch (type) {
      case 'faq':
        return 'FAQ';
      case 'terms':
        return 'Terms & Conditions';
      case 'support':
        return 'Support';
      case 'about':
        return 'About Us';
      case 'contact':
        return 'Contact Info';
      case 'refund_policy':
        return 'Refund Policy';
      case 'help_center':
        return 'Help Center';
      case 'blog':
        return 'Blog';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading CMS dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management System</h1>
          <p className="text-muted-foreground">Manage all website content and pages</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Pages</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_pages}</div>
              <p className="text-xs text-muted-foreground">
                {stats.published_pages} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">FAQs</CardTitle>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_faqs}</div>
              <p className="text-xs text-muted-foreground">
                {stats.published_faqs} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_blog_posts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.published_blog_posts} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_views}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recent_updates} updates this week
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content Pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/admin/cms/sections">
              <Button variant="outline" className="w-full justify-start">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Website Sections
              </Button>
            </Link>
            {/* <Link to="/admin/cms/faqs">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                Manage FAQs
              </Button>
            </Link> */}
            <Link to="/admin/cms/terms">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Terms & Conditions
              </Button>
            </Link>
            <Link to="/admin/cms/support">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Support Content
              </Button>
            </Link>
            <Link to="/admin/cms/about">
              <Button variant="outline" className="w-full justify-start">
                <Globe className="h-4 w-4 mr-2" />
                About Us
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact & Policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/admin/cms/contact">
              <Button variant="outline" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                Contact Information
              </Button>
            </Link>
            <Link to="/admin/cms/refund-policy">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Refund Policy
              </Button>
            </Link>
            {/* <Link to="/admin/cms/help-center">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help Center
              </Button>
            </Link> */}
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blog Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/admin/cms/blog">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Blog Posts
              </Button>
            </Link>
            <Link to="/admin/cms/blog">
              <Button className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create New Post
              </Button>
            </Link>
          </CardContent>
        </Card> */}
      </div>

      {/* Recent Content Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Content Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentPages.slice(0, 10).map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getPageTypeIcon(page.page_type)}
                        <span className="text-sm">{getPageTypeLabel(page.page_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{page.title}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.is_published ? 'default' : 'secondary'}>
                        {page.is_published ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(page.updated_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/admin/cms/${page.page_type}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/admin/cms/${page.page_type}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent FAQs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.slice(0, 10).map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell>
                      <Badge variant="outline">{faq.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium max-w-md truncate">{faq.question}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={faq.is_published ? 'default' : 'secondary'}>
                        {faq.is_published ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(faq.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/admin/cms/faqs">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/admin/cms/faqs">
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Blog Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogPosts.slice(0, 10).map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-muted-foreground">{post.slug}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.is_published ? 'default' : 'secondary'}>
                        {post.is_published ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{post.view_count}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Not published'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/admin/cms/blog">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/admin/cms/blog">
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
