import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Edit, Plus, Trash2, ArrowUp, ArrowDown, Users, BarChart3, MessageSquare, Star, UserPlus, Search, User, MessageCircle } from 'lucide-react';

interface ForDesignersContent {
  id: string;
  section_type: 'hero' | 'cta_cards' | 'stats' | 'footer_cta';
  title: string;
  subtitle: string;
  description: string;
  content: string;
  hero_data: any;
  cta_cards: any;
  stats_data: any;
  background_image_url: string;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
}

export default function ForDesignersManagement() {
  const [content, setContent] = useState<ForDesignersContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<ForDesignersContent | null>(null);
  const { toast } = useToast();

  const iconOptions = ['UserPlus', 'MessageCircle', 'Search', 'User', 'Users', 'Star', 'Trophy', 'Target'];
  const colorOptions = ['green', 'blue', 'purple', 'red', 'orange', 'yellow'];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('website_sections' as any)
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data as any || []);
    } catch (error) {
      console.error('Error fetching for designers content:', error);
      toast({
        title: "Error",
        description: "Failed to load for designers content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (item: ForDesignersContent) => {
    try {
      setSaving(true);
      
      const itemData = {
        section_type: item.section_type,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        content: item.content,
        hero_data: item.hero_data,
        cta_cards: item.cta_cards,
        stats_data: item.stats_data,
        background_image_url: item.background_image_url,
        sort_order: item.sort_order,
        is_published: item.is_published,
        updated_at: new Date().toISOString()
      };

      if (item.id) {
        const { error } = await supabase
          .from('website_sections' as any)
          .update(itemData)
          .eq('id', item.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('website_sections' as any)
          .insert(itemData);

        if (error) throw error;
      }

      await fetchContent();
      setEditingItem(null);
      toast({
        title: "Success",
        description: "For designers content saved successfully!",
      });
    } catch (error) {
      console.error('Error saving for designers content:', error);
      toast({
        title: "Error",
        description: "Failed to save for designers content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('website_sections' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchContent();
      toast({
        title: "Success",
        description: "For designers content deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting for designers content:', error);
      toast({
        title: "Error",
        description: "Failed to delete for designers content.",
        variant: "destructive",
      });
    }
  };

  const addNewItem = (type: string) => {
    const newItem: ForDesignersContent = {
      id: '',
      section_type: type as any,
      title: type === 'hero' ? 'Creative Journey Hero' : 
             type === 'cta_cards' ? 'CTA Cards Section' :
             type === 'stats' ? 'Statistics Section' :
             type === 'footer_cta' ? 'Footer CTA Section' : 'New Item',
      subtitle: '',
      description: '',
      content: '',
      hero_data: type === 'hero' ? { highlight_text: '', background_gradient: 'from-green-500 via-blue-500 to-purple-600' } : null,
      cta_cards: type === 'cta_cards' || type === 'footer_cta' ? { cards: [] } : null,
      stats_data: type === 'stats' ? { statistics: [] } : null,
      background_image_url: '',
      sort_order: content.filter(c => c.section_type === type).length + 1,
      is_published: true,
      updated_at: new Date().toISOString()
    };
    setEditingItem(newItem);
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'hero': return <Users className="h-5 w-5" />;
      case 'cta_cards': return <MessageSquare className="h-5 w-5" />;
      case 'stats': return <BarChart3 className="h-5 w-5" />;
      case 'footer_cta': return <Star className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const groupedContent = content.reduce((acc, item) => {
    if (!acc[item.section_type]) {
      acc[item.section_type] = [];
    }
    acc[item.section_type].push(item);
    return acc;
  }, {} as Record<string, ForDesignersContent[]>);

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
          <h1 className="text-3xl font-bold">For Designers Page Management</h1>
          <p className="text-gray-600">Manage the creative journey section that appears at the bottom of multiple pages</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => addNewItem('hero')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Hero
          </Button>
          <Button onClick={() => addNewItem('cta_cards')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add CTA Cards
          </Button>
          <Button onClick={() => addNewItem('stats')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Stats
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
              Manage {sectionType.replace('_', ' ')} content for the for designers page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.subtitle && <p className="text-sm text-gray-600">{item.subtitle}</p>}
                    {item.hero_data && (
                      <div className="mt-2 text-sm text-gray-500">
                        Highlight: {item.hero_data.highlight_text}
                      </div>
                    )}
                    {item.cta_cards && (
                      <div className="mt-2 text-sm text-gray-500">
                        {item.cta_cards.cards?.length || 0} CTA cards
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
            <h2 className="text-xl font-bold mb-4">Edit For Designers Content</h2>
            
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
                <Textarea
                  id="subtitle"
                  value={editingItem.subtitle}
                  onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>

              {editingItem.section_type === 'hero' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="highlight-text">Highlight Text</Label>
                    <Input
                      id="highlight-text"
                      value={editingItem.hero_data?.highlight_text || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        hero_data: { ...editingItem.hero_data, highlight_text: e.target.value }
                      })}
                      placeholder="Creative Journey?"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="background-gradient">Background Gradient</Label>
                    <Input
                      id="background-gradient"
                      value={editingItem.hero_data?.background_gradient || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        hero_data: { ...editingItem.hero_data, background_gradient: e.target.value }
                      })}
                      placeholder="from-green-500 via-blue-500 to-purple-600"
                    />
                  </div>
                </div>
              )}

              {editingItem.section_type === 'cta_cards' && (
                <div>
                  <Label>CTA Cards</Label>
                  <div className="space-y-4 mt-2">
                    {editingItem.cta_cards?.cards?.map((card: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`card-title-${index}`}>Card Title</Label>
                            <Input
                              id={`card-title-${index}`}
                              value={card.title}
                              onChange={(e) => {
                                const newCards = [...editingItem.cta_cards.cards];
                                newCards[index].title = e.target.value;
                                setEditingItem({ ...editingItem, cta_cards: { ...editingItem.cta_cards, cards: newCards } });
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`card-description-${index}`}>Description</Label>
                            <Input
                              id={`card-description-${index}`}
                              value={card.description}
                              onChange={(e) => {
                                const newCards = [...editingItem.cta_cards.cards];
                                newCards[index].description = e.target.value;
                                setEditingItem({ ...editingItem, cta_cards: { ...editingItem.cta_cards, cards: newCards } });
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <Label htmlFor={`card-icon-${index}`}>Icon</Label>
                            <select
                              id={`card-icon-${index}`}
                              value={card.card_icon}
                              onChange={(e) => {
                                const newCards = [...editingItem.cta_cards.cards];
                                newCards[index].card_icon = e.target.value;
                                setEditingItem({ ...editingItem, cta_cards: { ...editingItem.cta_cards, cards: newCards } });
                              }}
                              className="w-full p-2 border rounded-md"
                            >
                              {iconOptions.map(icon => (
                                <option key={icon} value={icon}>{icon}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor={`card-color-${index}`}>Card Color</Label>
                            <select
                              id={`card-color-${index}`}
                              value={card.card_color}
                              onChange={(e) => {
                                const newCards = [...editingItem.cta_cards.cards];
                                newCards[index].card_color = e.target.value;
                                setEditingItem({ ...editingItem, cta_cards: { ...editingItem.cta_cards, cards: newCards } });
                              }}
                              className="w-full p-2 border rounded-md"
                            >
                              {colorOptions.map(color => (
                                <option key={color} value={color}>{color}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor={`button-text-${index}`}>Button Text</Label>
                            <Input
                              id={`button-text-${index}`}
                              value={card.button_text}
                              onChange={(e) => {
                                const newCards = [...editingItem.cta_cards.cards];
                                newCards[index].button_text = e.target.value;
                                setEditingItem({ ...editingItem, cta_cards: { ...editingItem.cta_cards, cards: newCards } });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newCards = [...(editingItem.cta_cards?.cards || [])];
                        newCards.push({
                          title: 'New Card',
                          description: 'Card description',
                          button_text: 'Button Text',
                          card_icon: 'UserPlus',
                          card_color: 'green',
                          button_color: 'green'
                        });
                        setEditingItem({ ...editingItem, cta_cards: { ...editingItem.cta_cards, cards: newCards } });
                      }}
                    >
                      Add Card
                    </Button>
                  </div>
                </div>
              )}

              {editingItem.section_type === 'stats' && (
                <div>
                  <Label>Statistics</Label>
                  <div className="space-y-4 mt-2">
                    {editingItem.stats_data?.statistics?.map((stat: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`stat-value-${index}`}>Value</Label>
                            <Input
                              id={`stat-value-${index}`}
                              value={stat.value}
                              onChange={(e) => {
                                const newStats = [...editingItem.stats_data.statistics];
                                newStats[index].value = e.target.value;
                                setEditingItem({ ...editingItem, stats_data: { ...editingItem.stats_data, statistics: newStats } });
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`stat-label-${index}`}>Label</Label>
                            <Input
                              id={`stat-label-${index}`}
                              value={stat.label}
                              onChange={(e) => {
                                const newStats = [...editingItem.stats_data.statistics];
                                newStats[index].label = e.target.value;
                                setEditingItem({ ...editingItem, stats_data: { ...editingItem.stats_data, statistics: newStats } });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newStats = [...(editingItem.stats_data?.statistics || [])];
                        newStats.push({
                          value: '1,000+',
                          label: 'New Statistic'
                        });
                        setEditingItem({ ...editingItem, stats_data: { ...editingItem.stats_data, statistics: newStats } });
                      }}
                    >
                      Add Statistic
                    </Button>
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
