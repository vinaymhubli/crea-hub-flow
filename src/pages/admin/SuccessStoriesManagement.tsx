import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Edit, Plus, Trash2, ArrowUp, ArrowDown, Trophy, BarChart3, MessageSquare, Star, Users, Award, TrendingUp } from 'lucide-react';

interface SuccessStoriesContent {
  id: string;
  section_type: 'hero' | 'stats' | 'story' | 'testimonial' | 'cta';
  title: string;
  subtitle: string;
  description: string;
  content: string;
  category: string;
  duration: string;
  metrics: any;
  achievements: string[];
  testimonial_data: any;
  designer_data: any;
  stats_data: any;
  cta_data: any;
  image_url: string;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function SuccessStoriesManagement() {
  const [content, setContent] = useState<SuccessStoriesContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<SuccessStoriesContent | null>(null);
  const { toast } = useToast();

  const categoryOptions = ['SaaS', 'E-commerce', 'Healthcare', 'Fintech', 'Education', 'Real Estate', 'Food & Beverage', 'Fashion', 'Technology', 'Other'];
  const durationOptions = ['6 months', '12 months', '18 months', '24 months', '36 months', '48 months'];
  const iconOptions = ['Award', 'TrendingUp', 'Users', 'Star', 'Trophy', 'Target', 'Zap', 'Shield'];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('success_stories_content')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching success stories content:', error);
      toast({
        title: "Error",
        description: "Failed to load success stories content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (item: SuccessStoriesContent) => {
    try {
      setSaving(true);
      
      const itemData = {
        section_type: item.section_type,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        content: item.content,
        category: item.category,
        duration: item.duration,
        metrics: item.metrics,
        achievements: item.achievements,
        testimonial_data: item.testimonial_data,
        designer_data: item.designer_data,
        stats_data: item.stats_data,
        cta_data: item.cta_data,
        image_url: item.image_url,
        sort_order: item.sort_order,
        is_published: item.is_published,
        updated_at: new Date().toISOString()
      };

      if (item.id) {
        const { error } = await supabase
          .from('success_stories_content')
          .update(itemData)
          .eq('id', item.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('success_stories_content')
          .insert(itemData);

        if (error) throw error;
      }

      await fetchContent();
      setEditingItem(null);
      toast({
        title: "Success",
        description: "Success stories content saved successfully!",
      });
    } catch (error) {
      console.error('Error saving success stories content:', error);
      toast({
        title: "Error",
        description: "Failed to save success stories content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('success_stories_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchContent();
      toast({
        title: "Success",
        description: "Success stories content deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting success stories content:', error);
      toast({
        title: "Error",
        description: "Failed to delete success stories content.",
        variant: "destructive",
      });
    }
  };

  const addNewItem = (type: string) => {
    const newItem: SuccessStoriesContent = {
      id: '',
      section_type: type as any,
      title: type === 'hero' ? 'Success Stories Hero' : 
             type === 'stats' ? 'Statistics Section' :
             type === 'story' ? 'New Success Story' :
             type === 'cta' ? 'Call to Action' : 'New Item',
      subtitle: '',
      description: '',
      content: '',
      category: type === 'story' ? 'SaaS' : '',
      duration: type === 'story' ? '12 months' : '',
      metrics: type === 'story' ? { revenue: '$1M+', growth: '100%', rating: 5 } : null,
      achievements: type === 'story' ? ['New achievement 1', 'New achievement 2'] : [],
      testimonial_data: type === 'story' ? { quote: '', client_name: '', client_title: '', company: '' } : null,
      designer_data: type === 'story' ? { name: '', rating: 5, reviews: 0 } : null,
      stats_data: type === 'stats' ? { statistics: [] } : null,
      cta_data: type === 'cta' ? { buttons: [] } : null,
      image_url: '',
      sort_order: content.filter(c => c.section_type === type).length + 1,
      is_published: true,
      updated_at: new Date().toISOString()
    };
    setEditingItem(newItem);
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'hero': return <Trophy className="h-5 w-5" />;
      case 'stats': return <BarChart3 className="h-5 w-5" />;
      case 'story': return <Star className="h-5 w-5" />;
      case 'testimonial': return <MessageSquare className="h-5 w-5" />;
      case 'cta': return <Users className="h-5 w-5" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const groupedContent = content.reduce((acc, item) => {
    if (!acc[item.section_type]) {
      acc[item.section_type] = [];
    }
    acc[item.section_type].push(item);
    return acc;
  }, {} as Record<string, SuccessStoriesContent[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Success Stories Management</h1>
          <p className="text-gray-600">Manage success stories, statistics, testimonials, and call-to-action sections</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => addNewItem('story')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Story
          </Button>
          <Button onClick={() => addNewItem('stats')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Stats
          </Button>
          <Button onClick={() => addNewItem('cta')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add CTA
          </Button>
        </div>
      </div>

      {/* Content Sections */}
      {Object.entries(groupedContent).map(([sectionType, items]) => (
        <Card key={sectionType}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getSectionIcon(sectionType)}
              {sectionType.toUpperCase()} ({items.length})
            </CardTitle>
            <CardDescription>
              Manage {sectionType} content for the success stories page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.subtitle && <p className="text-sm text-gray-600">{item.subtitle}</p>}
                    {item.category && (
                      <div className="flex gap-2 mt-2">
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{item.category}</span>
                        {item.duration && <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">{item.duration}</span>}
                      </div>
                    )}
                    {item.metrics && (
                      <div className="mt-2 text-sm text-gray-500">
                        Revenue: {item.metrics.revenue} • Growth: {item.metrics.growth} • Rating: {item.metrics.rating}/5
                      </div>
                    )}
                    {item.achievements && item.achievements.length > 0 && (
                      <div className="mt-2 text-sm text-gray-500">
                        {item.achievements.length} achievements
                      </div>
                    )}
                    {item.stats_data && (
                      <div className="mt-2 text-sm text-gray-500">
                        {item.stats_data.statistics?.length || 0} statistics
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.is_published}
                      onCheckedChange={(checked) => {
                        const updatedItem = { ...item, is_published: checked };
                        saveItem(updatedItem);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Success Stories Content</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={editingItem.subtitle}
                  onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Section description..."
                />
              </div>

              {editingItem.section_type === 'story' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      {categoryOptions.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <select
                      id="duration"
                      value={editingItem.duration}
                      onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      {durationOptions.map(duration => (
                        <option key={duration} value={duration}>{duration}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {editingItem.section_type === 'story' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="revenue">Revenue</Label>
                    <Input
                      id="revenue"
                      value={editingItem.metrics?.revenue || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metrics: { ...editingItem.metrics, revenue: e.target.value }
                      })}
                      placeholder="$1M+"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="growth">Growth</Label>
                    <Input
                      id="growth"
                      value={editingItem.metrics?.growth || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metrics: { ...editingItem.metrics, growth: e.target.value }
                      })}
                      placeholder="100%"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      value={editingItem.metrics?.rating || 5}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metrics: { ...editingItem.metrics, rating: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              )}

              {editingItem.section_type === 'story' && (
                <div>
                  <Label htmlFor="achievements">Achievements (one per line)</Label>
                  <Textarea
                    id="achievements"
                    value={editingItem.achievements.join('\n')}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      achievements: e.target.value.split('\n').filter(item => item.trim())
                    })}
                    placeholder="Enter each achievement on a new line..."
                    rows={4}
                  />
                </div>
              )}

              {editingItem.section_type === 'story' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testimonial-quote">Testimonial Quote</Label>
                    <Textarea
                      id="testimonial-quote"
                      value={editingItem.testimonial_data?.quote || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        testimonial_data: { ...editingItem.testimonial_data, quote: e.target.value }
                      })}
                      placeholder="Client testimonial quote..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="client-name">Client Name</Label>
                    <Input
                      id="client-name"
                      value={editingItem.testimonial_data?.client_name || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        testimonial_data: { ...editingItem.testimonial_data, client_name: e.target.value }
                      })}
                      placeholder="Client name"
                    />
                  </div>
                </div>
              )}

              {editingItem.section_type === 'story' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client-title">Client Title</Label>
                    <Input
                      id="client-title"
                      value={editingItem.testimonial_data?.client_title || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        testimonial_data: { ...editingItem.testimonial_data, client_title: e.target.value }
                      })}
                      placeholder="CEO, Company Name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="designer-name">Designer Name</Label>
                    <Input
                      id="designer-name"
                      value={editingItem.designer_data?.name || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        designer_data: { ...editingItem.designer_data, name: e.target.value }
                      })}
                      placeholder="Designer name"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="sort-order">Sort Order</Label>
                <Input
                  id="sort-order"
                  type="number"
                  value={editingItem.sort_order}
                  onChange={(e) => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={editingItem.is_published}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_published: checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button onClick={() => saveItem(editingItem)} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
