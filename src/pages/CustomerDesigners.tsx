import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import Designers from "./Designers";

export default function CustomerDesigners() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 to-blue-500 px-6 py-4">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="text-white hover:bg-white/20" />
              <div>
                <h1 className="text-xl font-bold text-white">Find Designers</h1>
                <p className="text-white/80 text-sm">Browse and connect with talented designers</p>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="h-full">
            <Designers />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}