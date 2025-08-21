import { useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  UserCheck,
  Calendar,
  PlayCircle,
  BookOpen,
  Wallet,
  CreditCard,
  Settings,
  FileText,
  Zap,
  BarChart3,
  MessageSquare,
  Bell,
  ChevronRight,
} from "lucide-react";

const mainSections = [
  {
    title: "Dashboard",
    url: "/secret-admin-panel",
    icon: LayoutDashboard,
  },
  {
    title: "Designer Verification",
    url: "/secret-admin-panel/designer-verification",
    icon: UserCheck,
  },
  {
    title: "Designer Availability",
    url: "/secret-admin-panel/designer-availability",
    icon: Calendar,
  },
  {
    title: "Session Control",
    url: "/secret-admin-panel/session-control",
    icon: PlayCircle,
  },
  {
    title: "Bookings",
    url: "/secret-admin-panel/bookings",
    icon: BookOpen,
  },
];

const generalSections = [
  {
    title: "Wallet Management",
    url: "/secret-admin-panel/wallet-management",
    icon: Wallet,
  },
  {
    title: "Transactions",
    url: "/secret-admin-panel/transactions",
    icon: CreditCard,
  },
];

const invoicingSections = [
  {
    title: "Invoice Settings",
    url: "/secret-admin-panel/invoice-settings",
    icon: Settings,
  },
  {
    title: "Invoice Templates",
    url: "/secret-admin-panel/invoice-templates",
    icon: FileText,
  },
  {
    title: "Invoice Features Demo",
    url: "/secret-admin-panel/invoice-demo",
    icon: Zap,
  },
];

const analyticsSections = [
  {
    title: "Analytics Dashboard",
    url: "/secret-admin-panel/analytics",
    icon: BarChart3,
  },
];

const communicationSections = [
  {
    title: "Support Messages",
    url: "/secret-admin-panel/support-messages",
    icon: MessageSquare,
  },
  {
    title: "Notifications",
    url: "/secret-admin-panel/notifications",
    icon: Bell,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} border-r bg-background`}
      collapsible="icon"
    >
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Admin Panel
              </h2>
              <p className="text-xs text-muted-foreground">Platform Management</p>
            </div>
          )}
          <SidebarTrigger className="ml-auto" />
        </div>
      </div>

      <SidebarContent className="px-2">
        {/* Main Dashboard Sections */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainSections.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* General Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">General</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {generalSections.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Invoicing Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoicing</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {invoicingSections.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analytics</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsSections.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Communications Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Communications</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {communicationSections.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </NavLink>
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