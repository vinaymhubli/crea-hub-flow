import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Star, 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  ArrowUp, 
  ArrowDown,
  Crown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDesignerAverageRatings } from '@/hooks/useDesignerAverageRatings';

interface Designer {
  id: string;
  user_id: string;
  designer_table_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  rating: number;
  specialties: string[];
  experience_years: number;
  is_verified: boolean;
  created_at: string;
}

interface FeaturedDesigner {
  id: string;
  designer_id: string;
  designer_table_id?: string;
  position: number;
  is_active: boolean;
  featured_since: string;
  featured_until?: string;
  admin_notes?: string;
  designer_name: string;
  designer_email: string;
  designer_avatar?: string;
  designer_rating: number;
  designer_specialties: string[];
  designer_experience: number;
  designer_verified: boolean;
}

export function FeaturedDesignersManager() {
  const [featuredDesigners, setFeaturedDesigners] = useState<FeaturedDesigner[]>([]);
  const [availableDesigners, setAvailableDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDesigner, setSelectedDesigner] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<number>(1);
  const [adminNotes, setAdminNotes] = useState('');
  const [featuredUntil, setFeaturedUntil] = useState('');
  const ratingInput = useMemo(() => {
    const entries: { id: string; profiles?: { first_name?: string | null; last_name?: string | null } }[] = [];
    const seen = new Set<string>();

    featuredDesigners.forEach((designer) => {
      const designerKey = designer.designer_table_id || designer.designer_id;
      if (!designerKey || seen.has(designerKey)) return;

      const nameParts = designer.designer_name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      entries.push({
        id: designerKey,
        profiles: { first_name: firstName, last_name: lastName },
      });
      seen.add(designerKey);
    });

    availableDesigners.forEach((designer) => {
      const designerKey = designer.designer_table_id || designer.user_id;
      if (!designerKey || seen.has(designerKey)) return;

      entries.push({
        id: designerKey,
        profiles: {
          first_name: designer.first_name || '',
          last_name: designer.last_name || '',
        },
      });
      seen.add(designerKey);
    });

    return entries;
  }, [featuredDesigners, availableDesigners]);

  const { ratings: designerRatings } = useDesignerAverageRatings(ratingInput);

  
  // Video management state
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);

  useEffect(() => {
    fetchFeaturedDesigners();
    fetchAvailableDesigners();
    fetchVideoContent();
  }, []);

  const fetchFeaturedDesigners = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc('get_featured_designers_admin');
      if (error) throw error;
      
      // Fetch experience_years from designers table for each featured designer
      const designersWithExperience = await Promise.all(
        (data || []).map(async (designer: FeaturedDesigner) => {
          try {
            const { data: designerData, error: designerError } = await supabase
              .from('designers')
              .select('id, experience_years')
              .eq('user_id', designer.designer_id)
              .single();
            
            if (designerError) {
              console.warn(`Error fetching experience for designer ${designer.designer_id}:`, designerError);
              return {
                ...designer,
                designer_table_id: designer.designer_id,
                designer_experience: designer.designer_experience || 0
              };
            }
            
            return {
              ...designer,
              designer_table_id: designerData?.id || designer.designer_id,
              designer_experience: designerData?.experience_years || 0
            };
          } catch (err) {
            console.error('Error fetching designer experience:', err);
            return {
              ...designer,
              designer_table_id: designer.designer_id,
              designer_experience: designer.designer_experience || 0
            };
          }
        })
      );
      
      setFeaturedDesigners(designersWithExperience);
    } catch (error) {
      console.error('Error fetching featured designers:', error);
      toast.error('Failed to fetch featured designers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDesigners = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          first_name,
          last_name,
          email,
          avatar_url,
          created_at,
          designers!inner(
            id,
            rating,
            skills,
            experience_years,
            is_online,
            completion_rate
          )
        `)
        .eq('user_type', 'designer')
        .order('designers(rating)', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match the expected interface
      const transformedData = data?.map(profile => ({
        id: profile.user_id,
        user_id: profile.user_id,
        designer_table_id: profile.designers?.id || profile.user_id,
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        email: profile.email || null,
        avatar_url: profile.avatar_url || null,
        rating: profile.designers?.rating || 0,
        specialties: profile.designers?.skills || [],
        experience_years: profile.designers?.experience_years || 0,
        is_verified: profile.designers?.is_online || false,
        created_at: profile.created_at
      })) || [];
      
      setAvailableDesigners(transformedData);
    } catch (error) {
      console.error('Error fetching designers:', error);
      toast.error('Failed to fetch designers');
    }
  };

  const addFeaturedDesigner = async () => {
    if (!selectedDesigner || !selectedPosition) {
      toast.error('Please select a designer and position');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc('add_featured_designer', {
        p_designer_id: selectedDesigner,
        p_position: selectedPosition,
        p_admin_notes: adminNotes || null,
        p_featured_until: featuredUntil || null
      });

      if (error) throw error;

      toast.success('Designer added to featured list');
      setShowAddDialog(false);
      setSelectedDesigner('');
      setSelectedPosition(1);
      setAdminNotes('');
      setFeaturedUntil('');
      fetchFeaturedDesigners();
    } catch (error) {
      console.error('Error adding featured designer:', error);
      toast.error('Failed to add featured designer');
    } finally {
      setLoading(false);
    }
  };

  const removeFeaturedDesigner = async (designerId: string) => {
    try {
      setLoading(true);
      console.log('Removing designer:', designerId);
      
      // Try complete deletion (simpler and more reliable)
      const { error: deleteError } = await (supabase as any)
        .from('featured_designers')
        .delete()
        .eq('designer_id', designerId);

      console.log('Delete result:', { deleteError });

      if (deleteError) {
        console.error('Delete failed:', deleteError);
        // Try update as fallback
        console.log('Trying update as fallback...');
        const { error: updateError } = await (supabase as any)
          .from('featured_designers')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('designer_id', designerId);
          
        if (updateError) {
          console.error('Update also failed:', updateError);
          throw updateError;
        }
        console.log('Update successful');
      } else {
        console.log('Delete successful');
      }

      toast.success('Designer removed from featured list');
      fetchFeaturedDesigners();
    } catch (error) {
      console.error('Error removing featured designer:', error);
      toast.error('Failed to remove featured designer');
    } finally {
      setLoading(false);
    }
  };

  // For arrow button swaps (up/down)
  const swapDesigner = async (designerId: string, direction: 'up' | 'down') => {
    try {
      setLoading(true);
      const { error } = await (supabase as any).rpc('swap_featured_designers', {
        p_designer_id: designerId,
        p_direction: direction
      });

      if (error) throw error;

      toast.success(`Designer moved ${direction}`);
      fetchFeaturedDesigners();
    } catch (error) {
      console.error('Error swapping designer:', error);
      toast.error(`Failed to move designer ${direction}`);
    } finally {
      setLoading(false);
    }
  };

  // For setting specific position (edit mode)
  const setDesignerPosition = async (designerId: string, newPosition: number) => {
    try {
      setLoading(true);
      const { error } = await (supabase as any).rpc('set_featured_designer_position', {
        p_designer_id: designerId,
        p_new_position: newPosition
      });

      if (error) throw error;

      toast.success('Designer position updated');
      fetchFeaturedDesigners();
    } catch (error) {
      console.error('Error setting designer position:', error);
      toast.error('Failed to update designer position');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoContent = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('featured_designer_video')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setVideoUrl(data.youtube_url || '');
        setVideoTitle(data.title || '');
        setVideoDescription(data.description || '');
      }
    } catch (error) {
      console.error('Error fetching video content:', error);
    }
  };

  const saveVideoContent = async () => {
    try {
      setVideoLoading(true);
      
      // First, deactivate any existing videos
      await (supabase as any)
        .from('featured_designer_video')
        .update({ is_active: false })
        .eq('is_active', true);

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert new video
      const { error } = await (supabase as any)
        .from('featured_designer_video')
        .insert({
          youtube_url: videoUrl,
          title: videoTitle,
          description: videoDescription,
          is_active: true,
          created_by: user?.id
        });

      if (error) throw error;
      
      toast.success('Video saved successfully');
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error('Failed to save video');
    } finally {
      setVideoLoading(false);
    }
  };

  // Backward compatibility
  const reorderDesigner = async (designerId: string, newPosition: number) => {
    await setDesignerPosition(designerId, newPosition);
  };

  const getAvailablePositions = () => {
    const usedPositions = featuredDesigners.map(fd => fd.position);
    return Array.from({ length: 10 }, (_, i) => i + 1).filter(pos => !usedPositions.includes(pos));
  };

  const filteredDesigners = availableDesigners.filter(designer =>
    (designer.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (designer.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (designer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (designer.specialties || []).some(specialty => 
      (specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Crown className="w-6 h-6 mr-2 text-yellow-600" />
            Featured Designers
          </h2>
          <p className="text-muted-foreground">
            Manage the top 10 designers shown on the homepage
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Featured Designer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Featured Designer</DialogTitle>
              <DialogDescription>
                Select a designer and position to feature them on the homepage
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Designer Search */}
              <div className="space-y-2">
                <Label>Search Designers</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or specialty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Designer Selection */}
              <div className="space-y-2">
                <Label>Select Designer</Label>
                <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a designer" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filteredDesigners.map((designer) => (
                      <SelectItem key={designer.user_id} value={designer.user_id}>
                        <div className="flex items-center space-x-3">
                          <img
                            src={designer.avatar_url || '/placeholder-avatar.png'}
                            alt={designer.first_name || 'Designer'}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-medium">
                              {designer.first_name || 'Unknown'} {designer.last_name || ''}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(designer.specialties || []).join(', ')} • {designer.experience_years || 0} years
                            </p>
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                {(() => {
                                  const ratingKey = designer.designer_table_id || designer.user_id;
                                  const avgRating = designerRatings[ratingKey || ''] ?? designer.rating;
                                  return avgRating > 0 ? (
                                    <>
                                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                      <span>{avgRating.toFixed(1)}</span>
                                    </>
                                  ) : null;
                                })()}
                              </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Position Selection */}
              <div className="space-y-2">
                <Label>Position (1-10)</Label>
                <Select value={selectedPosition.toString()} onValueChange={(value) => setSelectedPosition(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePositions().map((position) => (
                      <SelectItem key={position} value={position.toString()}>
                        Position {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label>Admin Notes (Optional)</Label>
                <Input
                  placeholder="Add notes about why this designer is featured..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              {/* Featured Until */}
              <div className="space-y-2">
                <Label>Featured Until (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={featuredUntil}
                  onChange={(e) => setFeaturedUntil(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addFeaturedDesigner} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Designer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Video Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Featured Designers Video
          </CardTitle>
          <CardDescription>
            Set the video that will be displayed in the Featured Designers section on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video-url">YouTube Video URL</Label>
              <Input
                id="video-url"
                placeholder="https://youtu.be/your-video-id"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-title">Video Title</Label>
              <Input
                id="video-title"
                placeholder="Featured Designers Video"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="video-description">Video Description</Label>
            <Input
              id="video-description"
              placeholder="Description for the video"
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={saveVideoContent} 
              disabled={videoLoading || !videoUrl.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {videoLoading ? 'Saving...' : 'Save Video'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Featured Designers List */}
      <div className="grid gap-4">
        {featuredDesigners.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Featured Designers</h3>
              <p className="text-muted-foreground mb-4">
                Add designers to feature them on the homepage
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Designer
              </Button>
            </CardContent>
          </Card>
        ) : (
          featuredDesigners.map((designer, index) => (
            <Card key={designer.id} className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        #{designer.position}
                      </Badge>
                      <Crown className="w-4 h-4 text-yellow-600" />
                    </div>
                    
                    <img
                      src={designer.designer_avatar || '/placeholder-avatar.png'}
                      alt={designer.designer_name}
                      className="w-12 h-12 rounded-full"
                    />
                    
                    <div>
                      <h3 className="font-semibold">{designer.designer_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {designer.designer_email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium ml-1">
                            {(() => {
                              const ratingKey = designer.designer_table_id || designer.designer_id;
                              const avgRating = designerRatings[ratingKey || ''] ?? designer.designer_rating;
                              return avgRating > 0 ? avgRating.toFixed(1) : '0.0';
                            })()}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {designer.designer_experience} years
                        </Badge>
                        {designer.designer_verified && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Move Up */}
                    {designer.position > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => swapDesigner(designer.designer_id, 'up')}
                        disabled={loading}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {/* Move Down */}
                    {designer.position < 10 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => swapDesigner(designer.designer_id, 'down')}
                        disabled={loading}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {/* Remove */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFeaturedDesigner(designer.designer_id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {designer.admin_notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <strong>Admin Notes:</strong> {designer.admin_notes}
                  </div>
                )}

                <div className="mt-2 text-xs text-muted-foreground">
                  Featured since: {new Date(designer.featured_since).toLocaleDateString()}
                  {designer.featured_until && (
                    <span className="ml-4">
                      Until: {new Date(designer.featured_until).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Featured Designers Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {featuredDesigners.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Currently Featured
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {featuredDesigners.filter(d => d.designer_verified).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Verified Designers
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {10 - featuredDesigners.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Available Positions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FeaturedDesignersManager;
