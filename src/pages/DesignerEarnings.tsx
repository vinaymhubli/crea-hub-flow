import React from 'react';
import { DesignerEarningsDashboard } from '@/components/DesignerEarningsDashboard';
import { DesignerSidebar } from '@/components/DesignerSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function DesignerEarnings() {
  return (
    <SidebarProvider>
      <DesignerSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
              <p className="text-muted-foreground">
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