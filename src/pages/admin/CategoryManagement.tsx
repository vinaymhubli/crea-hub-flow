import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Save, X, Folder } from 'lucide-react';

interface CategoryRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export default function CategoryManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CategoryRow | null>(null);

  if (!user) return <Navigate to="/admin-login" replace />;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories', error);
      toast({ title: 'Error', description: 'Failed to load categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (row?: CategoryRow) => {
    if (row) {
      setEditing({ ...row });
    } else {
      setEditing({ id: '', name: '', is_active: true, created_at: null, updated_at: null });
    }
    setIsDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      if (editing.id) {
        const { error } = await supabase
          .from('categories')
          .update({ name: editing.name, is_active: editing.is_active })
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Category updated successfully' });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ name: editing.name, is_active: editing.is_active });
        if (error) throw error;
        toast({ title: 'Created', description: 'Category created successfully' });
      }
      setIsDialogOpen(false);
      setEditing(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving category', error);
      toast({ title: 'Error', description: 'Failed to save category', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (row: CategoryRow) => {
    setToDelete(row);
    setIsDeleteDialogOpen(true);
  };

  const deleteCategory = async () => {
    if (!toDelete) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('categories').delete().eq('id', toDelete.id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Category deleted' });
      setIsDeleteDialogOpen(false);
      setToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting category', error);
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage service/portfolio categories available to designers</p>
        </div>
        <Button onClick={() => openDialog()}>
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
                {categories.map((row) => (
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
                        <Button size="sm" variant="outline" onClick={() => openDialog(row)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openDelete(row)}>
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>Set the category name and status</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="is_active" checked={editing.is_active} onCheckedChange={(checked) => setEditing({ ...editing, is_active: checked })} />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{toDelete?.name}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteCategory} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


