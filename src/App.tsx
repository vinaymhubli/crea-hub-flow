
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth"
import Index from "./pages/Index"
import About from "./pages/About"
import HowToUse from "./pages/HowToUse"
import Contact from "./pages/Contact"
import Designers from "./pages/Designers"
import DesignerDetails from "./pages/DesignerDetails"
import Services from "./pages/Services"
import ServiceDetail from "./pages/ServiceDetail"
import Auth from "./pages/Auth"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import AdminLogin from "./pages/AdminLogin"
import AdminDashboard from "./pages/AdminDashboard"
import DesignerVerification from "./pages/admin/DesignerVerification"
import SessionControl from "./pages/admin/SessionControl"
import AdminDesignerAvailability from "./pages/admin/DesignerAvailability"
import CustomerDashboard from "./pages/CustomerDashboard"
import CustomerProfile from "./pages/CustomerProfile"
import CustomerBookings from "./pages/CustomerBookings"
import CustomerWallet from "./pages/CustomerWallet"
import CustomerInvoices from "./pages/CustomerInvoices"
import CustomerMessages from "./pages/CustomerMessages"
import CustomerNotifications from "./pages/CustomerNotifications"
import CustomerSettings from "./pages/CustomerSettings"
import CustomerRecentDesigners from "./pages/CustomerRecentDesigners"
import CustomerDesigners from "./pages/CustomerDesigners"
import DesignerDashboard from "./pages/DesignerDashboard"
import DesignerProfile from "./pages/DesignerProfile"
import DesignerPortfolio from "./pages/DesignerPortfolio"
import DesignerBookings from "./pages/DesignerBookings"
import DesignerMessages from "./pages/DesignerMessages"
import DesignerAvailability from "./pages/DesignerAvailability"
import DesignerEarnings from "./pages/DesignerEarnings"
import DesignerSessionHistory from "./pages/DesignerSessionHistory"
import DesignerSettings from "./pages/DesignerSettings"
import DesignerServices from "./pages/DesignerServices"
import DesignerFileReviews from "./pages/DesignerFileReviews"
import CallSession from "./pages/CallSession"
import AIAssistant from "./pages/AIAssistant"
import NotFound from "./pages/NotFound"
import Pricing from "./pages/Pricing"
import SuccessStories from "./pages/SuccessStories"
import GlobalScreenShareNotification from "./components/GlobalScreenShareNotification"
import Support from "./pages/Support"
import ForDesigners from "./pages/ForDesigners"
import DesignerResources from "./pages/DesignerResources"
import DesignerCommunity from "./pages/DesignerCommunity"
import DesignerHelp from "./pages/DesignerHelp"
import Blog from "./pages/Blog"
import Careers from "./pages/Careers"
import Privacy from "./pages/Privacy"
import Terms from "./pages/Terms"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute"
import { AdminLayout } from "./components/AdminLayout"
import GeneralSettings from "./pages/admin/GeneralSettings";
import Invoicing from "./pages/admin/Invoicing";
import Analytics from "./pages/admin/Analytics";
import Communications from "./pages/admin/Communications";
import Header from "./components/Header"
import Footer from "./components/Footer"
import "./App.css"

const queryClient = new QueryClient()

function AppContent() {
  const location = useLocation();
  
  // Hide header/footer only on dashboard and session routes, or when coming from dashboard
  const hideGlobalChrome = location.pathname.startsWith('/customer-dashboard') ||
                          location.pathname.startsWith('/designer-dashboard') ||
                          location.pathname.startsWith('/admin') ||
                          location.pathname === '/admin-dashboard' ||
                          location.pathname.startsWith('/session/') ||
                          location.state?.hideGlobalChrome;
  
  return (
    <div className="min-h-screen w-full flex flex-col">
      {!hideGlobalChrome && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/designers" element={<Designers />} />
          <Route path="/designer/:id" element={<DesignerDetails />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          
          {/* New Footer Pages */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/support" element={<Support />} />
          <Route path="/for-designers" element={<ForDesigners />} />
          <Route path="/designer-resources" element={<DesignerResources />} />
          <Route path="/designer-community" element={<DesignerCommunity />} />
          <Route path="/designer-help" element={<DesignerHelp />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin-dashboard" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/designer-verification" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <DesignerVerification />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/session-control" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <SessionControl />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/designer-availability" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <AdminDesignerAvailability />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* General Settings */}
          <Route path="/admin/general-settings" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <GeneralSettings />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* Invoicing */}
          <Route path="/admin/invoicing" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <Invoicing />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* Analytics */}
          <Route path="/admin/analytics" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <Analytics />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* Communications */}
          <Route path="/admin/communications" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <Communications />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* Protected Customer Routes */}
          <Route path="/customer-dashboard" element={
            <ProtectedRoute requireUserType="client">
              <CustomerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/profile" element={
            <ProtectedRoute requireUserType="client">
              <CustomerProfile />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/bookings" element={
            <ProtectedRoute requireUserType="client">
              <CustomerBookings />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/wallet" element={
            <ProtectedRoute requireUserType="client">
              <CustomerWallet />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/invoices" element={
            <ProtectedRoute requireUserType="client">
              <CustomerInvoices />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/messages" element={
            <ProtectedRoute requireUserType="client">
              <CustomerMessages />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/notifications" element={
            <ProtectedRoute requireUserType="client">
              <CustomerNotifications />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/settings" element={
            <ProtectedRoute requireUserType="client">
              <CustomerSettings />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/recent-designers" element={
            <ProtectedRoute requireUserType="client">
              <CustomerRecentDesigners />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard/designers" element={
            <ProtectedRoute requireUserType="client">
              <CustomerDesigners />
            </ProtectedRoute>
          } />
          
          {/* Protected Designer Routes */}
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
          <Route path="/designer-dashboard/services" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerServices />
            </ProtectedRoute>
          } />
          <Route path="/designer-dashboard/messages" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerMessages />
            </ProtectedRoute>
          } />
          <Route path="/designer-dashboard/file-reviews" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerFileReviews />
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
          <Route path="/designer-dashboard/settings" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerSettings />
            </ProtectedRoute>
          } />
          
          {/* Session Route */}
          <Route path="/session/:id" element={
            <ProtectedRoute>
              <CallSession />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideGlobalChrome && <Footer />}
      
      {/* Global Screen Share Notification Overlay */}
      <GlobalScreenShareNotification />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppContent />
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
