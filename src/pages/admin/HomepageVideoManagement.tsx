import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Edit, Play, ExternalLink, AlertCircle, Trash2 } from 'lucide-react';

interface HowItWorksContent {
  id: string;
  section_type: string;
  title: string;
  subtitle: string;
  description: string;
  youtube_url: string;
  thumbnail_url?: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function HomepageVideoManagement() {
  const [content, setContent] = useState<HowItWorksContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<HowItWorksContent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('how_it_works_content')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data as HowItWorksContent[] || []);
    } catch (error) {
      console.error('Error fetching video content:', error);
      toast({
        title: "Error",
        description: "Failed to load video content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (item: HowItWorksContent) => {
    try {
      setSaving(true);
      
      if (item.id) {
        // Update existing item
        const { error } = await supabase
          .from('how_it_works_content')
          .update({
            title: item.title,
            subtitle: item.subtitle,
            description: item.description,
            youtube_url: item.youtube_url,
            thumbnail_url: item.thumbnail_url,
            is_published: item.is_published,
            sort_order: item.sort_order,
          })
          .eq('id', item.id);

        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from('how_it_works_content')
          .insert({
            section_type: 'video',
            title: item.title,
            subtitle: item.subtitle,
            description: item.description,
            youtube_url: item.youtube_url,
            thumbnail_url: item.thumbnail_url,
            is_published: item.is_published,
            sort_order: item.sort_order,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Video content saved successfully.",
      });

      setEditingItem(null);
      fetchContent();
    } catch (error) {
      console.error('Error saving video content:', error);
      toast({
        title: "Error",
        description: "Failed to save video content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const extractVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnailUrl = (youtubeUrl: string) => {
    const videoId = extractVideoId(youtubeUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  const getEmbedUrl = (youtubeUrl: string) => {
    const videoId = extractVideoId(youtubeUrl);
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null;
  };

  const deleteItem = async (item: HowItWorksContent) => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('how_it_works_content')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content deleted successfully.",
      });

      fetchContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addNewItem = () => {
    const newItem: HowItWorksContent = {
      id: '',
      section_type: 'video',
      title: '',
      subtitle: '',
      description: '',
      youtube_url: '',
      thumbnail_url: '',
      is_published: true,
      sort_order: content.length,
      created_at: '',
      updated_at: '',
    };
    setEditingItem(newItem);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Homepage Video Management</h1>
            <p className="text-muted-foreground">
              Manage the video content displayed on your homepage
            </p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">How It Works Video Management</h1>
          <p className="text-muted-foreground">
            Manage the video content displayed in the "How Our Platform Works" section
          </p>
        </div>
        <Button onClick={addNewItem}>
          <Play className="h-4 w-4 mr-2" />
          Add Video Content
        </Button>
      </div>

      {content.length === 0 && !editingItem && (
        <Card>
          <CardContent className="p-8 text-center">
            <Play className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Video Content</h3>
            <p className="text-muted-foreground mb-4">
              Add video content to showcase your platform walkthrough
            </p>
            <Button onClick={addNewItem}>
              <Play className="h-4 w-4 mr-2" />
              Add Your First Video
            </Button>
          </CardContent>
        </Card>
      )}

      {content.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                {item.title || 'Untitled Video'}
                {!item.is_published && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Draft
                  </span>
                )}
              </CardTitle>
              <div className="flex gap-2">
                {item.youtube_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(item.youtube_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on YouTube
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingItem(item)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the content "{item.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteItem(item)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Subtitle</Label>
                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              {item.youtube_url && (
                <div>
                  <Label className="text-sm font-medium">YouTube URL</Label>
                  <p className="text-sm text-blue-600 break-all">{item.youtube_url}</p>
                </div>
              )}
              {item.youtube_url && getThumbnailUrl(item.youtube_url) && (
                <div>
                  <Label className="text-sm font-medium">Video Preview</Label>
                  <div className="mt-2">
                    <img
                      src={getThumbnailUrl(item.youtube_url)}
                      alt="Video thumbnail"
                      className="w-32 h-20 object-cover rounded border"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {editingItem && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem.id ? 'Edit Video Content' : 'Add Video Content'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={editingItem.title}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, title: e.target.value })
                    }
                    placeholder="e.g., See How It Works"
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={editingItem.subtitle}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, subtitle: e.target.value })
                    }
                    placeholder="e.g., Watch our complete platform walkthrough"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  placeholder="Describe what viewers will learn from this video..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="youtube_url">YouTube URL *</Label>
                <Input
                  id="youtube_url"
                  value={editingItem.youtube_url}
                  onChange={(e) => {
                    const url = e.target.value;
                    setEditingItem({ 
                      ...editingItem, 
                      youtube_url: url,
                      thumbnail_url: getThumbnailUrl(url) || ''
                    });
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {editingItem.youtube_url && !extractVideoId(editingItem.youtube_url) && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Please enter a valid YouTube URL
                  </div>
                )}
                {editingItem.youtube_url && extractVideoId(editingItem.youtube_url) && (
                  <div className="mt-2">
                    <Label className="text-sm font-medium">Video Preview</Label>
                    <div className="mt-2">
                      <img
                        src={getThumbnailUrl(editingItem.youtube_url)}
                        alt="Video thumbnail"
                        className="w-48 h-32 object-cover rounded border"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={editingItem.is_published}
                  onCheckedChange={(checked) =>
                    setEditingItem({ ...editingItem, is_published: checked })
                  }
                />
                <Label htmlFor="is_published">Published</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => saveItem(editingItem)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
