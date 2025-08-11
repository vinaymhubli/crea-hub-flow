import { useState } from 'react';
import { 
  LayoutDashboard, 
  User, 
  FolderOpen, 
  Calendar, 
  Clock, 
  DollarSign, 
  History, 
  Settings,
  Plus,
  X,
  Eye
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const sidebarItems = [
  { title: "Dashboard", url: "/designer-dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/designer-dashboard/profile", icon: User },
  { title: "Portfolio", url: "/designer-dashboard/portfolio", icon: FolderOpen },
  { title: "Bookings", url: "/designer-dashboard/bookings", icon: Calendar },
  { title: "Availability", url: "/designer-dashboard/availability", icon: Clock },
  { title: "Earnings", url: "/designer-dashboard/earnings", icon: DollarSign },
  { title: "Session History", url: "/designer-dashboard/history", icon: History },
  { title: "Settings", url: "/designer-dashboard/settings", icon: Settings },
];

function DesignerSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">VB</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Vb Bn</p>
              <p className="text-sm text-gray-500">Designer</p>
            </div>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.url) 
                          ? 'bg-gradient-to-r from-green-50 to-blue-50 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 border-r-2 border-green-500' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive(item.url) ? 'text-green-600' : ''}`} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
    </Sidebar>
  );
}

function AddPortfolioDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const portfolioCategories = [
    "Logo Design",
    "Branding", 
    "UI/UX Design",
    "Print Design",
    "Illustration",
    "Web Design",
    "Other"
  ];

  const handleSave = () => {
    // Handle save logic here
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Portfolio Item</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">Add Portfolio Item</DialogTitle>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <p className="text-gray-600 text-sm">Add your best work to showcase your skills and attract clients.</p>
          
          <div className="space-y-2">
            <Label htmlFor="projectTitle">Project Title</Label>
            <Input 
              id="projectTitle" 
              placeholder="E.g., Modern Logo for Tech Startup"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {portfolioCategories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, '-')}>
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
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input 
              id="imageUrl" 
              placeholder="https://example.com/image.jpg"
              className="w-full"
            />
            <p className="text-sm text-gray-500">Provide a direct link to your image (preferred dimensions: 1200x800px)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe your work, process, and results"
              className="min-h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client (Optional)</Label>
              <Input 
                id="client" 
                placeholder="Client name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectLink">Project Link (Optional)</Label>
              <Input 
                id="projectLink" 
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DesignerPortfolio() {
  const [activeCategory, setActiveCategory] = useState("All Works");

  const categories = [
    "All Works",
    "Logo Design", 
    "Branding",
    "UI/UX Design",
    "Print Design",
    "Illustration",
    "Web Design",
    "Other"
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Enhanced Header with Profile Preview */}
          <header className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 px-6 py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2" />
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <FolderOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Portfolio</h1>
                    <p className="text-white/90 text-lg">Showcase your best design work to attract more clients</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-white/90 font-medium">6 Projects</span>
                      <span className="text-white/60">•</span>
                      <span className="text-white/90 font-medium">3 Categories</span>
                    </div>
                  </div>
                </div>
              </div>
              <AddPortfolioDialog />
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto">
            {/* Enhanced Category Filter */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 mb-8">
              <nav className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 ${
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

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {/* Sample Portfolio Items */}
              {[
                { id: 1, title: "Modern E-commerce UI", category: "UI/UX Design", year: "2024", color: "from-blue-400 to-purple-500" },
                { id: 2, title: "Tech Startup Branding", category: "Branding", year: "2024", color: "from-green-400 to-blue-500" },
                { id: 3, title: "Minimalist Logo Design", category: "Logo Design", year: "2023", color: "from-purple-400 to-pink-500" },
                { id: 4, title: "Mobile App Interface", category: "UI/UX Design", year: "2024", color: "from-orange-400 to-red-500" },
                { id: 5, title: "Corporate Identity", category: "Branding", year: "2023", color: "from-indigo-400 to-blue-500" },
                { id: 6, title: "Creative Illustration", category: "Illustration", year: "2024", color: "from-green-400 to-teal-500" }
              ].map((item) => (
                <div key={item.id} className="group cursor-pointer">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                        <span className="text-6xl font-bold text-white/20">#{item.id}</span>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-lg">
                          <Eye className="w-4 h-4 mr-2" />
                          View Project
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">{item.category}</span>
                        <span className="text-xs text-gray-500 font-medium">{item.year}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State for when no items (hidden when we have sample data) */}
            <div className="text-center py-16 hidden">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <FolderOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No portfolio items</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                Get started by adding your first portfolio item to showcase your work.
              </p>
              <AddPortfolioDialog />
            </div>

            {/* Load More Button */}
            <div className="text-center">
              <Button className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg font-semibold">
                Load More Projects
              </Button>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}