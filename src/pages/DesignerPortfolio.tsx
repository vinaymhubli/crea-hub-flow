
import { useState } from 'react';
import { 
  FolderOpen, 
  Plus,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  LayoutDashboard,
  Package,
  DollarSign,
  User,
  LogOut
} from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DesignerSidebar } from "@/components/DesignerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from '@/components/NotificationBell';

function AddPortfolioDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    year: new Date().getFullYear(),
    client: '',
    project_link: '',
    image: null as File | null
  });
  const { createPortfolioItem } = usePortfolio();

  const portfolioCategories = [
    "Logo Design",
    "Branding", 
    "UI/UX Design",
    "Print Design",
    "Illustration",
    "Web Design",
    "Other"
  ];

  const handleSave = async () => {
    if (!formData.title || !formData.image) {
      return;
    }

    const success = await createPortfolioItem(formData);
    if (success) {
      setIsOpen(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        year: new Date().getFullYear(),
        client: '',
        project_link: '',
        image: null
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-xl px-6 py-2.5 border-0 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Portfolio Item</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">Add Portfolio Item</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <p className="text-gray-600 text-sm">Add your best work to showcase your skills and attract clients.</p>
          
          <div className="space-y-2">
            <Label htmlFor="projectTitle">Project Title *</Label>
            <Input 
              id="projectTitle" 
              placeholder="E.g., Modern Logo for Tech Startup"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {portfolioCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input 
                id="year" 
                placeholder="2025"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Project Image *</Label>
            <Input 
              id="image" 
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
              className="w-full"
            />
            <p className="text-sm text-gray-500">Upload your best project image (preferred dimensions: 1200x800px)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe your work, process, and results"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client (Optional)</Label>
              <Input 
                id="client" 
                placeholder="Client name"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectLink">Project Link (Optional)</Label>
              <Input 
                id="projectLink" 
                placeholder="https://example.com"
                value={formData.project_link}
                onChange={(e) => setFormData({ ...formData, project_link: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-6 py-2.5 border-gray-300 hover:bg-gray-50 font-medium transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.title || !formData.image}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-xl px-6 py-2.5 border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditPortfolioDialog({ item, onClose }: { item: any; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: item.title || '',
    description: item.description || '',
    category: item.category || '',
    year: item.year || new Date().getFullYear(),
    client: item.client || '',
    project_link: item.project_link || '',
    image: null as File | null
  });
  const { updatePortfolioItem } = usePortfolio();

  const portfolioCategories = [
    "Logo Design",
    "Branding", 
    "UI/UX Design",
    "Print Design",
    "Illustration",
    "Web Design",
    "Other"
  ];

  const handleSave = async () => {
    const success = await updatePortfolioItem(item.id, formData);
    if (success) {
      onClose();
    }
  };

  return (
    <DialogContent className="max-w-lg mx-auto">
      <DialogHeader className="flex flex-row items-center justify-between">
        <DialogTitle className="text-lg font-semibold">Edit Portfolio Item</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="editTitle">Project Title</Label>
          <Input 
            id="editTitle" 
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="editCategory">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {portfolioCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editYear">Year</Label>
            <Input 
              id="editYear" 
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="editImage">Update Image (Optional)</Label>
          <Input 
            id="editImage" 
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="editDescription">Description</Label>
          <Textarea 
            id="editDescription" 
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="min-h-24 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="editClient">Client</Label>
            <Input 
              id="editClient" 
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editProjectLink">Project Link</Label>
            <Input 
              id="editProjectLink" 
              value={formData.project_link}
              onChange={(e) => setFormData({ ...formData, project_link: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="rounded-xl px-6 py-2.5 border-gray-300 hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-xl px-6 py-2.5 border-0"
          >
            Update
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export default function DesignerPortfolio() {
  const { user, profile, signOut } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All Works");
  const [editingItem, setEditingItem] = useState<any>(null);
  const { portfolioItems, loading, togglePortfolioItemActive, deletePortfolioItem } = usePortfolio();

  const userInitials = profile?.first_name && profile?.last_name 
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user?.email ? user.email.substring(0, 2).toUpperCase()
    : 'D';

  const userDisplayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email?.split('@')[0] || 'Designer';

  // Get unique categories from portfolio items
  const categories = ["All Works", ...Array.from(new Set(portfolioItems.map(item => item.category).filter(Boolean)))];

  // Filter items based on active category
  const filteredItems = activeCategory === "All Works" 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeCategory);

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
          <DesignerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          <DashboardHeader
            title="Portfolio"
            subtitle="Showcase your best design work to attract more clients"
            icon={<FolderOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            additionalInfo={
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
                <span className="text-white/90 font-medium">{portfolioItems.length} Projects</span>
                <span className="text-white/60">•</span>
                <span className="text-white/90 font-medium">{categories.length - 1} Categories</span>
              </div>
            }
            userInitials={userInitials}
            isOnline={true}
            actionButton={
              <div className="flex items-center space-x-2 sm:space-x-4">
                <NotificationBell />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                      <span className="text-white font-semibold text-xs sm:text-sm">
                        {userInitials}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-64 w-fit p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">{userInitials}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{userDisplayName}</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link
                          to="/designer-dashboard"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link
                          to="/designer-dashboard/services"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Package className="w-4 h-4 mr-3" />
                          Services
                        </Link>
                        <Link
                          to="/designer-dashboard/earnings"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <DollarSign className="w-4 h-4 mr-3" />
                          Earnings
                        </Link>
                        <Link
                          to="/designer-dashboard/profile"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button
                          onClick={async () => {
                            try {
                              await signOut();
                            } catch (error) {
                              console.error('Error signing out:', error);
                            }
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <AddPortfolioDialog />
              </div>
            }
          />

          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Enhanced Category Filter */}
            {categories.length > 1 && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-1.5 sm:p-2 mb-6 sm:mb-8 overflow-x-auto">
                <nav className="flex gap-1.5 sm:gap-2 min-w-max">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 hover:scale-105 whitespace-nowrap ${
                        category === activeCategory
                          ? "bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Portfolio Grid */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
                {filteredItems.map((item) => (
                  <div key={item.id} className="group cursor-pointer">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-rotate-1">
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img 
                          src={item.image_url} 
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-white text-sm font-medium mb-2">{item.description || 'No description'}</p>
                          </div>
                        </div>
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="text-xs font-semibold text-gray-800">{item.year}</span>
                        </div>
                        <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(item);
                            }}
                            className="bg-white/90 hover:bg-white text-gray-700"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePortfolioItemActive(item.id, !item.is_active);
                            }}
                            className="bg-white/90 hover:bg-white text-gray-700"
                          >
                            {item.is_active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => e.stopPropagation()}
                                className="bg-red-100 hover:bg-red-200 text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Portfolio Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePortfolioItem(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 mb-1 text-lg leading-tight">{item.title}</h3>
                            <p className="text-sm text-gray-500 font-medium">{item.client || 'Personal Project'}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.category && (
                              <div className="flex items-center space-x-1 bg-gradient-to-r from-green-400 to-blue-500 text-white px-3 py-1 rounded-full">
                                <span className="text-xs font-semibold">{item.category}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                            <span className="text-xs text-gray-600 font-medium">
                              {item.is_active ? 'Active' : 'Hidden'}
                            </span>
                          </div>
                          {item.project_link && (
                            <a 
                              href={item.project_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Live</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <FolderOpen className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {activeCategory === "All Works" ? "No portfolio items" : `No ${activeCategory} projects`}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  {activeCategory === "All Works" 
                    ? "Get started by adding your first portfolio item to showcase your work."
                    : `Add some ${activeCategory} projects to showcase your expertise in this category.`
                  }
                </p>
                <AddPortfolioDialog />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <EditPortfolioDialog 
            item={editingItem} 
            onClose={() => setEditingItem(null)} 
          />
        </Dialog>
      )}
    </SidebarProvider>
  );
}
