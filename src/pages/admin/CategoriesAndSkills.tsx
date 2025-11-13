import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Save, X, Folder, Wrench } from 'lucide-react';

interface CategoryRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface SkillRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export default function CategoriesAndSkills() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Categories state
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRow | null>(null);
  
  // Skills state
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [editingSkill, setEditingSkill] = useState<SkillRow | null>(null);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [isSkillDeleteDialogOpen, setIsSkillDeleteDialogOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<SkillRow | null>(null);

  if (!user) return <Navigate to="/admin-login" replace />;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesResult, skillsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('skills').select('*').order('name', { ascending: true })
      ]);
      
      if (categoriesResult.error) throw categoriesResult.error;
      if (skillsResult.error) throw skillsResult.error;
      
      setCategories(categoriesResult.data || []);
      setSkills(skillsResult.data || []);
    } catch (error) {
      console.error('Error fetching data', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Category functions
  const openCategoryDialog = (row?: CategoryRow) => {
    if (row) {
      setEditingCategory({ ...row });
    } else {
      setEditingCategory({ id: '', name: '', is_active: true, created_at: null, updated_at: null });
    }
    setIsCategoryDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!editingCategory) return;
    try {
      setSaving(true);
      if (editingCategory.id) {
        const { error } = await supabase
          .from('categories')
          .update({ name: editingCategory.name, is_active: editingCategory.is_active })
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Category updated successfully' });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ name: editingCategory.name, is_active: editingCategory.is_active });
        if (error) throw error;
        toast({ title: 'Created', description: 'Category created successfully' });
      }
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving category', error);
      toast({ title: 'Error', description: 'Failed to save category', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openCategoryDelete = (row: CategoryRow) => {
    setCategoryToDelete(row);
    setIsCategoryDeleteDialogOpen(true);
  };

  const deleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('categories').delete().eq('id', categoryToDelete.id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Category deleted' });
      setIsCategoryDeleteDialogOpen(false);
      setCategoryToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting category', error);
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Skill functions
  const openSkillDialog = (row?: SkillRow) => {
    if (row) {
      setEditingSkill({ ...row });
    } else {
      setEditingSkill({ id: '', name: '', is_active: true, created_at: null, updated_at: null });
    }
    setIsSkillDialogOpen(true);
  };

  const saveSkill = async () => {
    if (!editingSkill) return;
    try {
      setSaving(true);
      if (editingSkill.id) {
        const { error } = await supabase
          .from('skills')
          .update({ name: editingSkill.name, is_active: editingSkill.is_active })
          .eq('id', editingSkill.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Skill updated successfully' });
      } else {
        const { error } = await supabase
          .from('skills')
          .insert({ name: editingSkill.name, is_active: editingSkill.is_active });
        if (error) throw error;
        toast({ title: 'Created', description: 'Skill created successfully' });
      }
      setIsSkillDialogOpen(false);
      setEditingSkill(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving skill', error);
      toast({ title: 'Error', description: 'Failed to save skill', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openSkillDelete = (row: SkillRow) => {
    setSkillToDelete(row);
    setIsSkillDeleteDialogOpen(true);
  };

  const deleteSkill = async () => {
    if (!skillToDelete) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('skills').delete().eq('id', skillToDelete.id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Skill deleted' });
      setIsSkillDeleteDialogOpen(false);
      setSkillToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting skill', error);
      toast({ title: 'Error', description: 'Failed to delete skill', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categories & Skills</h1>
        <p className="text-muted-foreground">Manage categories and skills available for filtering and selection</p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Categories</h2>
              <p className="text-sm text-muted-foreground">Manage service/portfolio categories</p>
            </div>
            <Button onClick={() => openCategoryDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category List</CardTitle>
              <CardDescription>Create, edit, and disable categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No categories found. Add your first category!
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{row.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{row.is_active ? 'Active' : 'Inactive'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => openCategoryDialog(row)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openCategoryDelete(row)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Skills</h2>
              <p className="text-sm text-muted-foreground">Manage platform-wide skills designers can choose</p>
            </div>
            <Button onClick={() => openSkillDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Skills List</CardTitle>
              <CardDescription>Create, edit, and disable skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No skills found. Add your first skill!
                        </TableCell>
                      </TableRow>
                    ) : (
                      skills.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{row.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{row.is_active ? 'Active' : 'Inactive'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => openSkillDialog(row)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openSkillDelete(row)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory?.id ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>Set the category name and status</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-name">Name</Label>
                <Input 
                  id="category-name" 
                  value={editingCategory.name} 
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} 
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="category-is_active" 
                  checked={editingCategory.is_active} 
                  onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, is_active: checked })} 
                />
                <Label htmlFor="category-is_active">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveCategory} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Delete Dialog */}
      <Dialog open={isCategoryDeleteDialogOpen} onOpenChange={setIsCategoryDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteCategory} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skill Dialog */}
      <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSkill?.id ? 'Edit Skill' : 'Add Skill'}</DialogTitle>
            <DialogDescription>Set the skill name and status</DialogDescription>
          </DialogHeader>
          {editingSkill && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="skill-name">Name</Label>
                <Input 
                  id="skill-name" 
                  value={editingSkill.name} 
                  onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })} 
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="skill-is_active" 
                  checked={editingSkill.is_active} 
                  onCheckedChange={(checked) => setEditingSkill({ ...editingSkill, is_active: checked })} 
                />
                <Label htmlFor="skill-is_active">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSkillDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveSkill} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skill Delete Dialog */}
      <Dialog open={isSkillDeleteDialogOpen} onOpenChange={setIsSkillDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{skillToDelete?.name}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSkillDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteSkill} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

