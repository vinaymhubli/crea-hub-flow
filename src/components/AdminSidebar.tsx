import { useState } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  Play,
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
  Users,
  Receipt,
  HelpCircle,
  FileText as FileTextIcon,
  Globe,
  DollarSign,
  TrendingUp,
  Activity,
  Edit,
  Database,
  Shield,
  Trophy,
  ArrowUpCircle,
  ArrowDownCircle,
  Percent,
  Share2,
  Image,
  Crown,
  Megaphone,
  LogOut,
} from "lucide-react";

const mainSections = [
  {
    title: "Dashboard",
    url: "/admin-dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Transactions",
    url: "/admin/transactions",
    icon: Receipt,
  },
  {
    title: "Final Files",
    url: "/admin/final-files",
    icon: FileText,
  },
  {
    title: "Complaints",
    url: "/admin/complaints",
    icon: MessageSquare,
  },
  // {
  //   title: "Refunds",
  //   url: "/admin/refunds",
  //   icon: DollarSign,
  // },
  {
    title: "Designer Verification",
    url: "/admin/designer-verification",
    icon: UserCheck,
  },
  {
    title: "Designer Availability",
    url: "/admin/designer-availability",
    icon: Calendar,
  },
  {
    title: "Session Control",
    url: "/admin/session-control",
    icon: PlayCircle,
  },
];

// Content Management section items
const contentSections = [
  // {
  //   title: "CMS Dashboard",
  //   url: "/admin/cms",
  //   icon: FileTextIcon,
  // },
  // {
  //   title: "Website Sections",
  //   url: "/admin/cms/sections",
  //   icon: LayoutDashboard,
  // },
  // {
  //   title: "FAQs",
  //   url: "/admin/cms/faqs",
  //   icon: HelpCircle,
  // },
  {
    title: "Terms & Conditions",
    url: "/admin/cms/terms",
    icon: FileText,
  },
  {
    title: "Support Content",
    url: "/admin/cms/support",
    icon: MessageSquare,
  },
  {
    title: "Privacy Policy",
    url: "/admin/cms/privacy-policy",
    icon: Shield,
  },
  {
    title: "Success Stories",
    url: "/admin/cms/success-stories",
    icon: Trophy,
  },
  // {
  //   title: "For Designers",
  //   url: "/admin/cms/for-designers",
  //   icon: Users,
  // },
  {
    title: "About Us",
    url: "/admin/cms/about",
    icon: Globe,
  },
  {
    title: "Contact Info",
    url: "/admin/cms/contact",
    icon: Bell,
  },
  {
    title: "Refund Policy",
    url: "/admin/cms/refund-policy",
    icon: DollarSign,
  },
  {
    title: "Social Media",
    url: "/admin/cms/social-media",
    icon: Share2,
  },
  {
    title: "Logo Management",
    url: "/admin/cms/logos",
    icon: Image,
  },
  {
    title: "Featured Designers",
    url: "/admin/featured-designers",
    icon: Crown,
  },
  {
    title: "Promotions & Offers",
    url: "/admin/promotions",
    icon: Megaphone,
  },
  {
    title: "Pricing Management",
    url: "/admin/pricing",
    icon: DollarSign,
  },
  {
    title: "How It Works Video",
    url: "/admin/homepage-video",
    icon: Play,
  },
  // {
  //   title: "Help Center",
  //   url: "/admin/cms/help-center",
  //   icon: HelpCircle,
  // },
  // {
  //   title: "Blog",
  //   url: "/admin/cms/blog",
  //   icon: Edit,
  // },
];

// Analytics section items
const analyticsSections = [
  {
    title: "Earnings",
    url: "/admin/earnings",
    icon: DollarSign,
  },
  {
    title: "Usage Analytics",
    url: "/admin/analytics/usage",
    icon: Activity,
  },
  {
    title: "Revenue Analytics",
    url: "/admin/analytics/revenue",
    icon: TrendingUp,
  },
  {
    title: "Engagement Analytics",
    url: "/admin/analytics/engagement",
    icon: BarChart3,
  },
];

// Platform Configuration section items
const platformSections = [
  {
    title: "Platform Settings",
    url: "/admin/platform/settings",
    icon: Settings,
  },
  {
    title: "Invoice Management",
    url: "/admin/invoice-management",
    icon: FileText,
  },
  {
    title: "Commissions",
    url: "/admin/platform/commissions",
    icon: DollarSign,
  },
  {
    title: "Taxes",
    url: "/admin/platform/taxes",
    icon: Receipt,
  },
  // {
  //   title: "Tax Collections",
  //   url: "/admin/tax-collections",
  //   icon: TrendingUp,
  // },
  {
    title: "TDS Management",
    url: "/admin/tds-management",
    icon: Percent,
  },
];

const walletSections = [
  {
    title: "Wallet Recharges",
    url: "/admin/wallet-recharges",
    icon: ArrowUpCircle,
  },
  {
    title: "Wallet Withdrawals",
    url: "/admin/wallet-withdrawals",
    icon: ArrowDownCircle,
  },
];

// Communications section items
const communicationSections = [
  {
    title: "Communications",
    url: "/admin/communications",
    icon: MessageSquare,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/admin-login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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
              <p className="text-xs text-muted-foreground">
                Platform Management
              </p>
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

        {/* Content Management Section */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Content Management
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {contentSections.map((item) => (
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

        {/* Platform Configuration Section */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Platform Config
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {platformSections.map((item) => (
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

        {/* Wallet Transactions Section */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Wallet Transactions
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {walletSections.map((item) => (
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
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Analytics
            </SidebarGroupLabel>
          )}
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
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Communications
            </SidebarGroupLabel>
          )}
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
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
