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
  Plus
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
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">VB</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Vb Bn</p>
              <p className="text-sm text-gray-500">designer</p>
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
                          ? 'bg-green-50 text-green-600 border-r-2 border-green-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      >
                        <item.icon className="w-5 h-5" />
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
      <div className="min-h-screen flex w-full bg-gray-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
                  <p className="text-gray-600">Showcase your best design work to attract more clients</p>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Portfolio Item</span>
              </Button>
            </div>
          </header>

          <div className="p-6">
            {/* Category Filter */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="flex space-x-8">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      category === activeCategory
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            </div>

            {/* Empty State */}
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No portfolio items</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Get started by adding your first portfolio item.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Portfolio Item</span>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}