import { 
  LayoutDashboard, 
  User, 
  FolderOpen, 
  Calendar, 
  Clock, 
  DollarSign, 
  History, 
  Settings,
  MessageSquare,
  MessageCircle,
  Package,
  FileCheck,
  FileText,
  AlertTriangle,
  Receipt,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDesignerProfile } from '@/hooks/useDesignerProfile';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const sidebarItems = [
  { title: "Dashboard", url: "/designer-dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/designer-dashboard/profile", icon: User },
  { title: "Services", url: "/designer-dashboard/services", icon: Package },
  { title: "Portfolio", url: "/designer-dashboard/portfolio", icon: FolderOpen },
  { title: "Bookings", url: "/designer-dashboard/bookings", icon: Calendar },
  { title: "Messages", url: "/designer-dashboard/messages", icon: MessageSquare },
  // { title: "File Reviews", url: "/designer-dashboard/file-reviews", icon: FileCheck },
  { title: "Complaints", url: "/designer/complaints", icon: AlertTriangle },
  { title: "Invoices", url: "/designer-dashboard/invoices", icon: Receipt },
  { title: "Availability", url: "/designer-dashboard/availability", icon: Clock },
  { title: "Earnings", url: "/designer-dashboard/earnings", icon: DollarSign },
  { title: "Session History", url: "/designer-dashboard/history", icon: History },
  // { title: "Client Feedback", url: "/designer-dashboard/feedback", icon: MessageCircle },
  { title: "Settings", url: "/designer-dashboard/settings", icon: Settings },
];

function SidebarUserInfo() {
  const { user, profile } = useAuth();
  const { designerProfile } = useDesignerProfile();
  
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'D';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getDisplayName = () => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'Designer';
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
        <span className="text-white font-semibold text-sm">
          {getInitials(profile?.first_name, profile?.last_name)}
        </span>
      </div>
      <div>
        <p className="font-semibold text-gray-900">{getDisplayName()}</p>
        {/* <p className="text-sm text-gray-500">
          {designerProfile?.is_online ? 'Online' : 'Offline'}
        </p> */}
      </div>
    </div>
  );
}

export function DesignerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <SidebarUserInfo />
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
                            ? 'bg-gradient-to-r from-green-50 to-blue-50 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 border-r-2 border-gradient-to-b from-green-500 to-blue-500' 
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

          {/* Logout Section */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-t border-gray-200 pt-4 mt-4"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
    </Sidebar>
  );
}