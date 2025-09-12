import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Edit, Plus, Trash2, ArrowUp, ArrowDown, BookOpen, HelpCircle, Monitor, MessageSquare, AlertTriangle } from 'lucide-react';

interface SupportContent {
  id: string;
  section_type: 'hero' | 'tabs' | 'faq' | 'guides' | 'system_status' | 'contact' | 'urgent_help';
  title: string;
  subtitle: string;
  description: string;
  content: string;
  tab_name: string;
  card_data: any;
  form_fields: any;
  status_data: any;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function SupportManagement() {
  const [content, setContent] = useState<SupportContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<SupportContent | null>(null);
  const { toast } = useToast();

  const tabOptions = ['FAQ', 'Guides', 'System Status', 'Contact'];
  const badgeOptions = ['Tips', 'Designers', 'Projects', 'Billing', 'Quality'];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_page_content')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data as any || []);
    } catch (error) {
      console.error('Error fetching support content:', error);
      toast({
        title: "Error",
        description: "Failed to load support content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (item: SupportContent) => {
    try {
      setSaving(true);
      
      const itemData = {
        section_type: item.section_type,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        content: item.content,
        tab_name: item.tab_name,
        card_data: item.card_data,
        form_fields: item.form_fields,
        status_data: item.status_data,
        sort_order: item.sort_order,
        is_published: item.is_published,
        updated_at: new Date().toISOString()
      };

      if (item.id) {
        const { error } = await supabase
          .from('support_page_content')
          .update(itemData)
          .eq('id', item.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('support_page_content')
          .insert(itemData);

        if (error) throw error;
      }

      await fetchContent();
      setEditingItem(null);
      toast({
        title: "Success",
        description: "Support content saved successfully!",
      });
    } catch (error) {
      console.error('Error saving support content:', error);
      toast({
        title: "Error",
        description: "Failed to save support content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('support_page_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchContent();
      toast({
        title: "Success",
        description: "Support content deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting support content:', error);
      toast({
        title: "Error",
        description: "Failed to delete support content.",
        variant: "destructive",
      });
    }
  };

  const addNewItem = (type: string) => {
    const newItem: SupportContent = {
      id: '',
      section_type: type as any,
      title: type === 'faq' ? 'New FAQ Item' : 
             type === 'guides' ? 'New Guide' :
             type === 'system_status' ? 'System Status' :
             type === 'contact' ? 'Contact Form' :
             type === 'urgent_help' ? 'Urgent Help' :
             type === 'hero' ? 'Support Hero' : 'New Item',
      subtitle: '',
      description: '',
      content: '',
      tab_name: type === 'faq' ? 'FAQ' : 
                type === 'guides' ? 'Guides' :
                type === 'system_status' ? 'System Status' :
                type === 'contact' ? 'Contact' : '',
      card_data: type === 'faq' || type === 'guides' ? { read_time: '5 min read', badge: null, content: '' } : null,
      form_fields: type === 'contact' ? { form_title: '', form_description: '', fields: [] } : null,
      status_data: type === 'system_status' ? { overall_status: 'Healthy', last_updated: '', services: [] } : null,
      sort_order: content.filter(c => c.section_type === type).length + 1,
      is_published: true,
      updated_at: new Date().toISOString()
    };
    setEditingItem(newItem);
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'hero': return <HelpCircle className="h-5 w-5" />;
      case 'tabs': return <MessageSquare className="h-5 w-5" />;
      case 'faq': return <HelpCircle className="h-5 w-5" />;
      case 'guides': return <BookOpen className="h-5 w-5" />;
      case 'system_status': return <Monitor className="h-5 w-5" />;
      case 'contact': return <MessageSquare className="h-5 w-5" />;
      case 'urgent_help': return <AlertTriangle className="h-5 w-5" />;
      default: return <HelpCircle className="h-5 w-5" />;
    }
  };

  const groupedContent = content.reduce((acc, item) => {
    if (!acc[item.section_type]) {
      acc[item.section_type] = [];
    }
    acc[item.section_type].push(item);
    return acc;
  }, {} as Record<string, SupportContent[]>);

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
          <h1 className="text-3xl font-bold">Support Page Management</h1>
          <p className="text-gray-600">Manage support page content, FAQ cards, guides, and contact forms</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => addNewItem('faq')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
          <Button onClick={() => addNewItem('guides')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Guide
          </Button>
          <Button onClick={() => addNewItem('contact')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Content Sections */}
      {Object.entries(groupedContent).map(([sectionType, items]) => (
        <Card key={sectionType}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getSectionIcon(sectionType)}
              {sectionType.replace('_', ' ').toUpperCase()} ({items.length})
            </CardTitle>
            <CardDescription>
              Manage {sectionType.replace('_', ' ')} content for the support page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.subtitle && <p className="text-sm text-gray-600">{item.subtitle}</p>}
                    {item.tab_name && <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{item.tab_name}</span>}
                    {item.card_data && (
                      <div className="mt-2 text-sm text-gray-500">
                        {item.card_data.read_time} {item.card_data.badge && `• ${item.card_data.badge}`}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Support Content</h2>
            
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
                />
              </div>

              {editingItem.section_type === 'faq' || editingItem.section_type === 'guides' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tab-name">Tab Name</Label>
                    <select
                      id="tab-name"
                      value={editingItem.tab_name}
                      onChange={(e) => setEditingItem({ ...editingItem, tab_name: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      {tabOptions.map(tab => (
                        <option key={tab} value={tab}>{tab}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="read-time">Read Time</Label>
                    <Input
                      id="read-time"
                      value={editingItem.card_data?.read_time || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        card_data: { ...editingItem.card_data, read_time: e.target.value }
                      })}
                      placeholder="5 min read"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="badge">Badge (optional)</Label>
                    <select
                      id="badge"
                      value={editingItem.card_data?.badge || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        card_data: { ...editingItem.card_data, badge: e.target.value || null }
                      })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">No Badge</option>
                      {badgeOptions.map(badge => (
                        <option key={badge} value={badge}>{badge}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="card-content">Card Content</Label>
                    <Textarea
                      id="card-content"
                      value={editingItem.card_data?.content || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        card_data: { ...editingItem.card_data, content: e.target.value }
                      })}
                      placeholder="Card content description..."
                    />
                  </div>
                </div>
              ) : null}

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