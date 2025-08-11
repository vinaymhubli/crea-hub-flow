
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Designers from "./pages/Designers";
import AIAssistant from "./pages/AIAssistant";
import HowToUse from "./pages/HowToUse";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DesignerDashboard from "./pages/DesignerDashboard";
import DesignerProfile from "./pages/DesignerProfile";
import DesignerPortfolio from "./pages/DesignerPortfolio";
import DesignerBookings from "./pages/DesignerBookings";
import DesignerAvailability from "./pages/DesignerAvailability";
import DesignerEarnings from "./pages/DesignerEarnings";
import DesignerSessionHistory from "./pages/DesignerSessionHistory";
import DesignerSettings from "./pages/DesignerSettings";
import DesignerMessages from "./pages/DesignerMessages";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerWallet from "./pages/CustomerWallet";
import CustomerBookings from "./pages/CustomerBookings";
import CustomerMessages from "./pages/CustomerMessages";
import CustomerRecentDesigners from "./pages/CustomerRecentDesigners";
import CustomerNotifications from "./pages/CustomerNotifications";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerSettings from "./pages/CustomerSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/designers" element={<Designers />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/designer-dashboard" element={<DesignerDashboard />} />
          <Route path="/designer-dashboard/profile" element={<DesignerProfile />} />
          <Route path="/designer-dashboard/portfolio" element={<DesignerPortfolio />} />
          <Route path="/designer-dashboard/bookings" element={<DesignerBookings />} />
          <Route path="/designer-dashboard/availability" element={<DesignerAvailability />} />
          <Route path="/designer-dashboard/earnings" element={<DesignerEarnings />} />
          <Route path="/designer-dashboard/history" element={<DesignerSessionHistory />} />
          <Route path="/designer-dashboard/messages" element={<DesignerMessages />} />
          <Route path="/designer-dashboard/settings" element={<DesignerSettings />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/customer-dashboard/wallet" element={<CustomerWallet />} />
          <Route path="/customer-dashboard/bookings" element={<CustomerBookings />} />
          <Route path="/customer-dashboard/messages" element={<CustomerMessages />} />
          <Route path="/customer-dashboard/recent-designers" element={<CustomerRecentDesigners />} />
          <Route path="/customer-dashboard/notifications" element={<CustomerNotifications />} />
          <Route path="/customer-dashboard/profile" element={<CustomerProfile />} />
          <Route path="/customer-dashboard/settings" element={<CustomerSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
