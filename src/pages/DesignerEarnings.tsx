import React from 'react';
import { DesignerEarningsDashboard } from '@/components/DesignerEarningsDashboard';
import { DesignerSidebar } from '@/components/DesignerSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DollarSign } from 'lucide-react';

export default function DesignerEarnings() {
  return (
    <SidebarProvider>
      <DesignerSidebar />
      <SidebarInset>
        <DashboardHeader
          title="Earnings"
          subtitle="Track your earnings and manage withdrawals"
          icon={<DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
          <DesignerEarningsDashboard />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}