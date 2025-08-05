
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
