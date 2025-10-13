import React from 'react';
import { DesignerEarningsDashboard } from '@/components/DesignerEarningsDashboard';
import { DesignerSidebar } from '@/components/DesignerSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function DesignerEarnings() {
  return (
    <SidebarProvider>
      <DesignerSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Earnings</h1>
              <p className="text-muted-foreground text-sm sm:text-base truncate">
                Track your earnings and manage withdrawals
              </p>
            </div>
          </div>
          
          <DesignerEarningsDashboard />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}