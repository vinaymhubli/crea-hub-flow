
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Designers from "./pages/Designers";
import AIAssistant from "./pages/AIAssistant";
import HowToUse from "./pages/HowToUse";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Auth from "./pages/Auth";
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
import CallSession from "./pages/CallSession";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/designers" element={<Designers />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/designer-dashboard" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/designer-dashboard/profile" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerProfile />
            </ProtectedRoute>
          } />
          <Route path="/designer-dashboard/portfolio" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerPortfolio />
            </ProtectedRoute>
          } />
          <Route path="/designer-dashboard/bookings" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerBookings />
            </ProtectedRoute>
          } />
          <Route path="/designer-dashboard/availability" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerAvailability />
            </ProtectedRoute>
          } />
          <Route path="/designer-dashboard/earnings" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerEarnings />
            </ProtectedRoute>
          } />
          <Route path="/designer-dashboard/history" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerSessionHistory />
            </ProtectedRoute>
          } />
          <Route path="/designer-dashboard/messages" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerMessages />
            </ProtectedRoute>
          } />
          <Route path="/designer-dashboard/settings" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerSettings />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard" element={
            <ProtectedRoute requireUserType="client">
              <CustomerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/wallet" element={
            <ProtectedRoute requireUserType="client">
              <CustomerWallet />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/bookings" element={
            <ProtectedRoute requireUserType="client">
              <CustomerBookings />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/messages" element={
            <ProtectedRoute requireUserType="client">
              <CustomerMessages />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/recent-designers" element={
            <ProtectedRoute requireUserType="client">
              <CustomerRecentDesigners />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/notifications" element={
            <ProtectedRoute requireUserType="client">
              <CustomerNotifications />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/profile" element={
            <ProtectedRoute requireUserType="client">
              <CustomerProfile />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/settings" element={
            <ProtectedRoute requireUserType="client">
              <CustomerSettings />
            </ProtectedRoute>
          } />
          <Route path="/session/:bookingId" element={
            <ProtectedRoute>
              <CallSession />
            </ProtectedRoute>
          } />
          {/* Hidden admin routes - not linked anywhere */}
          <Route path="/secret-admin-login" element={<AdminLogin />} />
          <Route path="/secret-admin-panel" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
