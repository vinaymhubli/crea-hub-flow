import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Users } from "lucide-react";
import Designers from "./Designers";

export default function CustomerDesigners() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar />
        
        <main className="flex-1">
          <DashboardHeader
            title="Find Designers"
            subtitle="Browse and connect with talented designers"
            icon={<Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
          />

          {/* Content */}
          <div className="h-full">
            <Designers />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}