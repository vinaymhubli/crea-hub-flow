import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Edit, Plus, Trash2, ArrowUp, ArrowDown, Heart, Users, Rocket, Shield, Globe, Lightbulb, Upload, X } from 'lucide-react';

interface AboutContent {
  id: string;
  section_type: 'hero' | 'mission' | 'story' | 'values' | 'team' | 'cta' | 'value_item' | 'team_member' | 'stats';
  title: string;
  subtitle: string;
  description: string;
  content: string;
  image_url: string;
  background_image_url: string;
  icon: string;
  color_scheme: string;
  image_position: 'left' | 'right' | 'center' | 'background';
  stats: any;
  team_member: any;
  value_item: any;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function AboutManagement() {
  const [content, setContent] = useState<AboutContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<AboutContent | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const colorOptions = [
    { value: 'green', label: 'Green', bgColor: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { value: 'blue', label: 'Blue', bgColor: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { value: 'purple', label: 'Purple', bgColor: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { value: 'red', label: 'Red', bgColor: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    { value: 'orange', label: 'Orange', bgColor: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { value: 'yellow', label: 'Yellow', bgColor: 'bg-yellow-50', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' }
  ];

  const iconOptions = [
    { value: 'Heart', label: 'Heart', icon: Heart },
    { value: 'Users', label: 'Users', icon: Users },
    { value: 'Rocket', label: 'Rocket', icon: Rocket },
    { value: 'Shield', label: 'Shield', icon: Shield },
    { value: 'Globe', label: 'Globe', icon: Globe },
    { value: 'Lightbulb', label: 'Lightbulb', icon: Lightbulb }
  ];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('about_page_content')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data as any || []);
    } catch (error) {
      console.error('Error fetching about content:', error);
      toast({
        title: "Error",
        description: "Failed to load about page content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (item: AboutContent) => {
    try {
      setSaving(true);
      
      const itemData = {
        section_type: item.section_type,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        content: item.content,
        image_url: item.image_url,
        background_image_url: item.background_image_url,
        icon: item.icon,
        color_scheme: item.color_scheme,
        image_position: item.image_position,
        stats: item.stats,
        team_member: item.team_member,
        value_item: item.value_item,
        sort_order: item.sort_order,
        is_published: item.is_published,
        updated_at: new Date().toISOString()
      };

      if (item.id) {
        const { error } = await supabase
          .from('about_page_content')
          .update(itemData)
          .eq('id', item.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('about_page_content')
          .insert(itemData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "About content updated successfully.",
      });

      await fetchContent();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving about content:', error);
      toast({
        title: "Error",
        description: "Failed to save about content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('about_page_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "About item deleted successfully.",
      });

      await fetchContent();
    } catch (error) {
      console.error('Error deleting about item:', error);
      toast({
        title: "Error",
        description: "Failed to delete about item.",
        variant: "destructive",
      });
    }
  };

  const uploadImage = async (file: File, field: 'image_url' | 'background_image_url') => {
    try {
      setUploading(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `about-images/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      // Update the editing item with the new image URL
      if (editingItem) {
        setEditingItem({
          ...editingItem,
          [field]: publicUrl
        });
      }

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addNewItem = (type: string) => {
    const newItem: AboutContent = {
      id: '',
      section_type: type as any,
      title: type === 'story' ? 'New Story Section' : 
             type === 'value_item' ? 'New Value' :
             type === 'team_member' ? 'New Team Member' :
             type === 'stats' ? 'New Statistic' : `New ${type.replace('_', ' ')}`,
      subtitle: type === 'story' ? 'Year - Description' : 
                type === 'team_member' ? 'Role/Position' : '',
      description: type === 'story' ? 'Story description...' :
                   type === 'value_item' ? 'Value description...' :
                   type === 'team_member' ? 'Team member bio...' :
                   type === 'stats' ? 'Statistic description' : '',
      content: '',
      image_url: '',
      background_image_url: '',
      icon: type === 'value_item' ? 'Heart' : '',
      color_scheme: type === 'value_item' ? 'green' : 
                    type === 'stats' ? 'green' : 'green',
      image_position: type === 'story' ? 'right' : 'center',
      stats: type === 'stats' ? { value: '0', color: 'green' } : null,
      team_member: type === 'team_member' ? { name: '', role: '', bio: '', image: '', linkedin: '#' } : null,
      value_item: type === 'value_item' ? { title: '', description: '', icon: 'Heart', color: 'text-green-600 bg-green-50' } : null,
      sort_order: content.filter(c => c.section_type === type).length + 1,
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
  const missionContent = content.find(c => c.section_type === 'mission');
  const storyContent = content.filter(c => c.section_type === 'story');
  const valuesContent = content.find(c => c.section_type === 'values');
  const valueItems = content.filter(c => c.section_type === 'value_item');
  const teamContent = content.find(c => c.section_type === 'team');
  const teamMembers = content.filter(c => c.section_type === 'team_member');
  const statsContent = content.filter(c => c.section_type === 'stats');
  const ctaContent = content.find(c => c.section_type === 'cta');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">About Page Management</h1>
          <p className="text-muted-foreground">
            Manage your about page content including hero, mission, story, values, team, and CTA sections
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => addNewItem('story')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Story
          </Button>
          <Button onClick={() => addNewItem('value_item')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Value
          </Button>
          <Button onClick={() => addNewItem('team_member')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
          <Button onClick={() => addNewItem('stats')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Statistic
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      {heroContent && (
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>
              Main heading and background for the about page
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
                <Label htmlFor="hero-subtitle">Subtitle</Label>
                <Input
                  id="hero-subtitle"
                  value={heroContent.subtitle}
                  onChange={(e) => {
                    const updated = content.map(c => 
                      c.id === heroContent.id ? { ...c, subtitle: e.target.value } : c
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
              <div>
                <Label htmlFor="hero-bg-image">Background Image URL</Label>
                <Input
                  id="hero-bg-image"
                  value={heroContent.background_image_url}
                  onChange={(e) => {
                    const updated = content.map(c => 
                      c.id === heroContent.id ? { ...c, background_image_url: e.target.value } : c
                    );
                    setContent(updated);
                  }}
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

      {/* Mission Section */}
      {missionContent && (
        <Card>
          <CardHeader>
            <CardTitle>Mission Section</CardTitle>
            <CardDescription>
              Mission statement and supporting image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="mission-title">Title</Label>
                <Input
                  id="mission-title"
                  value={missionContent.title}
                  onChange={(e) => {
                    const updated = content.map(c => 
                      c.id === missionContent.id ? { ...c, title: e.target.value } : c
                    );
                    setContent(updated);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="mission-subtitle">Subtitle</Label>
                <Input
                  id="mission-subtitle"
                  value={missionContent.subtitle}
                  onChange={(e) => {
                    const updated = content.map(c => 
                      c.id === missionContent.id ? { ...c, subtitle: e.target.value } : c
                    );
                    setContent(updated);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="mission-description">Description</Label>
                <Textarea
                  id="mission-description"
                  value={missionContent.description}
                  onChange={(e) => {
                    const updated = content.map(c => 
                      c.id === missionContent.id ? { ...c, description: e.target.value } : c
                    );
                    setContent(updated);
                  }}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="mission-image">Image URL</Label>
                <Input
                  id="mission-image"
                  value={missionContent.image_url}
                  onChange={(e) => {
                    const updated = content.map(c => 
                      c.id === missionContent.id ? { ...c, image_url: e.target.value } : c
                    );
                    setContent(updated);
                  }}
                />
              </div>
            </div>
            <Button onClick={() => saveItem(missionContent)} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Mission Section
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Story Sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Story Timeline</CardTitle>
              <CardDescription>
                Manage the story timeline sections
              </CardDescription>
            </div>
            <Button onClick={() => addNewItem('story')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Story
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storyContent.map((story, index) => (
              <div key={story.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{story.title}</h3>
                    <p className="text-sm text-muted-foreground">{story.subtitle}</p>
                    {story.image_url && (
                      <p className="text-xs text-blue-600 mt-1">Has image: {story.image_url.substring(0, 50)}...</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(story)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem(story.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{story.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Core Values */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Core Values</CardTitle>
              <CardDescription>
                Manage the core values section
              </CardDescription>
            </div>
            <Button onClick={() => addNewItem('value_item')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Value
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {valueItems.map((value, index) => (
              <div key={value.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{value.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      value.color_scheme === 'green' ? 'bg-green-100 text-green-800' :
                      value.color_scheme === 'blue' ? 'bg-blue-100 text-blue-800' :
                      value.color_scheme === 'purple' ? 'bg-purple-100 text-purple-800' :
                      value.color_scheme === 'red' ? 'bg-red-100 text-red-800' :
                      value.color_scheme === 'orange' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {value.color_scheme}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(value)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem(value.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage team member profiles
              </CardDescription>
            </div>
            <Button onClick={() => addNewItem('team_member')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={member.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{member.title}</h3>
                    <p className="text-sm text-muted-foreground">{member.subtitle}</p>
                    {member.image_url && (
                      <p className="text-xs text-blue-600 mt-1">Has image: {member.image_url.substring(0, 50)}...</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>
                Manage the statistics displayed in the story section
              </CardDescription>
            </div>
            <Button onClick={() => addNewItem('stats')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Statistic
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statsContent.map((stat, index) => (
              <div key={stat.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{stat.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {stat.stats ? stat.stats.value : 'No value set'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(stat)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem(stat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
              {editingItem.id ? `Edit ${editingItem.section_type.replace('_', ' ')}` : `Add New ${editingItem.section_type.replace('_', ' ')}`}
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
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={editingItem.subtitle}
                  onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="image-url">Image</Label>
                <div className="space-y-2">
                  <Input
                    id="image-url"
                    value={editingItem.image_url}
                    onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg or upload below"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file, 'image_url');
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                    {editingItem.image_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem({ ...editingItem, image_url: '' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {editingItem.image_url && (
                    <div className="mt-2">
                      <img 
                        src={editingItem.image_url} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="background-image-url">Background Image</Label>
                <div className="space-y-2">
                  <Input
                    id="background-image-url"
                    value={editingItem.background_image_url}
                    onChange={(e) => setEditingItem({ ...editingItem, background_image_url: e.target.value })}
                    placeholder="https://example.com/background.jpg or upload below"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file, 'background_image_url');
                      }}
                      className="hidden"
                      id="background-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('background-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Background
                        </>
                      )}
                    </Button>
                    {editingItem.background_image_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem({ ...editingItem, background_image_url: '' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {editingItem.background_image_url && (
                    <div className="mt-2">
                      <img 
                        src={editingItem.background_image_url} 
                        alt="Background Preview" 
                        className="w-32 h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
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
                <Label htmlFor="image-position">Image Position</Label>
                <select
                  id="image-position"
                  value={editingItem.image_position}
                  onChange={(e) => setEditingItem({ ...editingItem, image_position: e.target.value as 'left' | 'right' | 'center' | 'background' })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="left">Left Side</option>
                  <option value="right">Right Side</option>
                  <option value="center">Center</option>
                  <option value="background">Background</option>
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
                rows={4}
              />
            </div>
            {editingItem.section_type === 'value_item' && (
              <div>
                <Label htmlFor="icon">Icon</Label>
                <select
                  id="icon"
                  value={editingItem.icon}
                  onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  {iconOptions.map(icon => (
                    <option key={icon.value} value={icon.value}>{icon.label}</option>
                  ))}
                </select>
              </div>
            )}
            {editingItem.section_type === 'stats' && (
              <div>
                <Label htmlFor="stats-value">Statistics Value</Label>
                <Input
                  id="stats-value"
                  value={editingItem.stats?.value || ''}
                  onChange={(e) => setEditingItem({ 
                    ...editingItem, 
                    stats: { ...editingItem.stats, value: e.target.value, color: editingItem.color_scheme }
                  })}
                />
              </div>
            )}
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