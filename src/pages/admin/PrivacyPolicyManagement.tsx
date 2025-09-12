import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Edit, Plus, Trash2, ArrowUp, ArrowDown, Shield, FileText, Lock, Users, Eye as EyeIcon } from 'lucide-react';

interface PrivacyPolicyContent {
  id: string;
  section_type: 'hero' | 'content' | 'card';
  title: string;
  subtitle: string;
  description: string;
  content: string;
  icon: string;
  card_items: string[];
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function PrivacyPolicyManagement() {
  const [content, setContent] = useState<PrivacyPolicyContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<PrivacyPolicyContent | null>(null);
  const { toast } = useToast();

  const iconOptions = ['Eye', 'Users', 'Lock', 'Shield', 'FileText', 'Settings', 'Database', 'Globe'];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('privacy_policy_content')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data as any || []);
    } catch (error) {
      console.error('Error fetching privacy policy content:', error);
      toast({
        title: "Error",
        description: "Failed to load privacy policy content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (item: PrivacyPolicyContent) => {
    try {
      setSaving(true);
      
      const itemData = {
        section_type: item.section_type,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        content: item.content,
        icon: item.icon,
        card_items: item.card_items,
        sort_order: item.sort_order,
        is_published: item.is_published,
        updated_at: new Date().toISOString()
      };

      if (item.id) {
        const { error } = await supabase
          .from('privacy_policy_content')
          .update(itemData)
          .eq('id', item.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('privacy_policy_content')
          .insert(itemData);

        if (error) throw error;
      }

      await fetchContent();
      setEditingItem(null);
      toast({
        title: "Success",
        description: "Privacy policy content saved successfully!",
      });
    } catch (error) {
      console.error('Error saving privacy policy content:', error);
      toast({
        title: "Error",
        description: "Failed to save privacy policy content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('privacy_policy_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchContent();
      toast({
        title: "Success",
        description: "Privacy policy content deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting privacy policy content:', error);
      toast({
        title: "Error",
        description: "Failed to delete privacy policy content.",
        variant: "destructive",
      });
    }
  };

  const addNewItem = (type: string) => {
    const newItem: PrivacyPolicyContent = {
      id: '',
      section_type: type as any,
      title: type === 'hero' ? 'Privacy Policy Hero' : 
             type === 'content' ? 'New Content Section' : 'New Card Section',
      subtitle: type === 'hero' ? 'Last updated: January 1, 2024' : '',
      description: '',
      content: '',
      icon: type === 'card' ? 'Shield' : '',
      card_items: type === 'card' ? ['New bullet point 1', 'New bullet point 2'] : [],
      sort_order: content.filter(c => c.section_type === type).length + 1,
      is_published: true,
      updated_at: new Date().toISOString()
    };
    setEditingItem(newItem);
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'hero': return <Shield className="h-5 w-5" />;
      case 'content': return <FileText className="h-5 w-5" />;
      case 'card': return <EyeIcon className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const groupedContent = content.reduce((acc, item) => {
    if (!acc[item.section_type]) {
      acc[item.section_type] = [];
    }
    acc[item.section_type].push(item);
    return acc;
  }, {} as Record<string, PrivacyPolicyContent[]>);

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
          <h1 className="text-3xl font-bold">Privacy Policy Management</h1>
          <p className="text-gray-600">Manage privacy policy content, sections, and cards</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => addNewItem('content')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
          <Button onClick={() => addNewItem('card')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Card
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
              Manage {sectionType} content for the privacy policy page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.subtitle && <p className="text-sm text-gray-600">{item.subtitle}</p>}
                    {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                    {item.card_items && item.card_items.length > 0 && (
                      <div className="mt-2 text-sm text-gray-500">
                        {item.card_items.length} bullet points
                      </div>
                    )}
                    {item.icon && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mt-1">
                        Icon: {item.icon}
                      </span>
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
            <h2 className="text-xl font-bold mb-4">Edit Privacy Policy Content</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
              
              {editingItem.section_type === 'hero' && (
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={editingItem.subtitle}
                    onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                    placeholder="Last updated: January 1, 2024"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Section description..."
                />
              </div>

              {editingItem.section_type === 'card' && (
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <select
                    id="icon"
                    value={editingItem.icon}
                    onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    {iconOptions.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              )}

              {editingItem.section_type === 'card' && (
                <div>
                  <Label htmlFor="card-items">Card Items (one per line)</Label>
                  <Textarea
                    id="card-items"
                    value={editingItem.card_items.join('\n')}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      card_items: e.target.value.split('\n').filter(item => item.trim())
                    })}
                    placeholder="Enter each bullet point on a new line..."
                    rows={6}
                  />
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
