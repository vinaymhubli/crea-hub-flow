import React from 'react';
import { DesignerEarningsDashboard } from '@/components/DesignerEarningsDashboard';
import { DesignerSidebar } from '@/components/DesignerSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import NotificationBell from '@/components/NotificationBell';
import { DollarSign, LayoutDashboard, Package, User, LogOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';


export default function DesignerEarnings() {
  const { user, profile, signOut } = useAuth();

  const userInitials = profile?.first_name && profile?.last_name 
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user?.email ? user.email.substring(0, 2).toUpperCase()
    : 'D';

  const userDisplayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email?.split('@')[0] || 'Designer';

  return (
    <SidebarProvider>
      <DesignerSidebar />
      <SidebarInset>
        <DashboardHeader
          title="Earnings"
          subtitle="Track your earnings and manage withdrawals"
          icon={<DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
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
            </div>
          }
        />
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
          <DesignerEarningsDashboard />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}