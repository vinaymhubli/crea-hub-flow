import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Edit, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface ContactContent {
  id: string;
  section_type: 'hero' | 'contact_method';
  title: string;
  description: string;
  content: string;
  icon: string;
  contact_info: string;
  action_text: string;
  color_scheme: string;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function ContactManagement() {
  const [content, setContent] = useState<ContactContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<ContactContent | null>(null);
  const { toast } = useToast();

  const colorOptions = [
    { value: 'green', label: 'Green', bgColor: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600', buttonBg: 'bg-green-600 hover:bg-green-700' },
    { value: 'blue', label: 'Blue', bgColor: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', buttonBg: 'bg-blue-600 hover:bg-blue-700' },
    { value: 'purple', label: 'Purple', bgColor: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', buttonBg: 'bg-purple-600 hover:bg-purple-700' },
    { value: 'orange', label: 'Orange', bgColor: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', buttonBg: 'bg-orange-600 hover:bg-orange-700' }
  ];

  const iconOptions = [
    'ri-mail-line', 'ri-phone-line', 'ri-chat-3-line', 'ri-map-pin-line',
    'ri-time-line', 'ri-chat-smile-2-line', 'ri-customer-service-2-line',
    'ri-headphone-line', 'ri-message-3-line', 'ri-video-line'
  ];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_page_content')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching contact content:', error);
      toast({
        title: "Error",
        description: "Failed to load contact page content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (item: ContactContent) => {
    try {
      setSaving(true);
      
      const itemData = {
        section_type: item.section_type,
        title: item.title,
        description: item.description,
        content: item.content,
        icon: item.icon,
        contact_info: item.contact_info,
        action_text: item.action_text,
        color_scheme: item.color_scheme,
        sort_order: item.sort_order,
        is_published: item.is_published,
        updated_at: new Date().toISOString()
      };

      if (item.id) {
        const { error } = await supabase
          .from('contact_page_content')
          .update(itemData)
          .eq('id', item.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_page_content')
          .insert(itemData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Contact content updated successfully.",
      });

      await fetchContent();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving contact content:', error);
      toast({
        title: "Error",
        description: "Failed to save contact content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_page_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact item deleted successfully.",
      });

      await fetchContent();
    } catch (error) {
      console.error('Error deleting contact item:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact item.",
        variant: "destructive",
      });
    }
  };

  const addNewContactMethod = () => {
    const newItem: ContactContent = {
      id: '',
      section_type: 'contact_method',
      title: 'New Contact Method',
      description: 'Description for the new contact method',
      content: 'New Contact Method',
      icon: 'ri-customer-service-2-line',
      contact_info: 'Contact information',
      action_text: 'Take Action',
      color_scheme: 'green',
      sort_order: content.filter(c => c.section_type === 'contact_method').length + 1,
      is_published: true,
      updated_at: new Date().toISOString()
    };
    setEditingItem(newItem);
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

  const heroContent = content.find(c => c.section_type === 'hero');
  const contactMethods = content.filter(c => c.section_type === 'contact_method');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contact Page Management</h1>
          <p className="text-muted-foreground">
            Manage your contact page hero section and contact method cards
          </p>
        </div>
        <Button onClick={addNewContactMethod}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact Method
        </Button>
      </div>

      {/* Hero Section */}
      {heroContent && (
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>
              Main heading and description for the contact page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="hero-title">Title</Label>
                <Input
                  id="hero-title"
                  value={heroContent.title}
                  onChange={(e) => {
                    const updated = content.map(c => 
                      c.id === heroContent.id ? { ...c, title: e.target.value } : c
                    );
                    setContent(updated);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="hero-description">Description</Label>
                <Textarea
                  id="hero-description"
                  value={heroContent.description}
                  onChange={(e) => {
                    const updated = content.map(c => 
                      c.id === heroContent.id ? { ...c, description: e.target.value } : c
                    );
                    setContent(updated);
                  }}
                  rows={3}
                />
              </div>
            </div>
            <Button onClick={() => saveItem(heroContent)} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Hero Section
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Method Cards</CardTitle>
          <CardDescription>
            Manage the contact method cards displayed on the contact page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contactMethods.map((method, index) => (
              <div key={method.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{method.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      method.color_scheme === 'green' ? 'bg-green-100 text-green-800' :
                      method.color_scheme === 'blue' ? 'bg-blue-100 text-blue-800' :
                      method.color_scheme === 'purple' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {method.color_scheme}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(method)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem(method.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Description:</strong> {method.description}</p>
                  <p><strong>Contact:</strong> {method.contact_info}</p>
                  <p><strong>Action:</strong> {method.action_text}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingItem && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem.id ? 'Edit Contact Method' : 'Add New Contact Method'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
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
              <div>
                <Label htmlFor="contact-info">Contact Information</Label>
                <Input
                  id="contact-info"
                  value={editingItem.contact_info}
                  onChange={(e) => setEditingItem({ ...editingItem, contact_info: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="action-text">Action Text</Label>
                <Input
                  id="action-text"
                  value={editingItem.action_text}
                  onChange={(e) => setEditingItem({ ...editingItem, action_text: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="color-scheme">Color Scheme</Label>
                <select
                  id="color-scheme"
                  value={editingItem.color_scheme}
                  onChange={(e) => setEditingItem({ ...editingItem, color_scheme: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  {colorOptions.map(color => (
                    <option key={color.value} value={color.value}>{color.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="sort-order">Sort Order</Label>
                <Input
                  id="sort-order"
                  type="number"
                  value={editingItem.sort_order}
                  onChange={(e) => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                rows={3}
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
            <div className="flex items-center space-x-2">
              <Button onClick={() => saveItem(editingItem)} disabled={saving}>
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
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}