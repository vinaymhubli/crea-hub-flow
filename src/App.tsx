
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
import UserManagement from "./pages/admin/UserManagement"
import TransactionManagement from "./pages/admin/TransactionManagement"
import AdminFinalFiles from "./pages/admin/AdminFinalFiles"
import AdminComplaints from "./pages/admin/AdminComplaints"
import AdminRefunds from "./pages/admin/AdminRefunds"
import DesignerVerification from "./pages/admin/DesignerVerification"
import SessionControl from "./pages/admin/SessionControl"
import AdminDesignerAvailability from "./pages/admin/DesignerAvailability"
// import CMSDashboard from "./pages/admin/CMSDashboard"
// import FAQManagement from "./pages/admin/FAQManagement"
import TermsManagement from "./pages/admin/TermsManagement"
import SupportManagement from "./pages/admin/SupportManagement"
import SupportDynamic from "./pages/SupportDynamic"
import PrivacyPolicyManagement from "./pages/admin/PrivacyPolicyManagement"
import PrivacyPolicyDynamic from "./pages/PrivacyPolicyDynamic"
import SuccessStoriesManagement from "./pages/admin/SuccessStoriesManagement"
import SuccessStoriesDynamic from "./pages/SuccessStoriesDynamic"
// import ForDesignersManagement from "./pages/admin/ForDesignersManagement"
// import ForDesignersDynamic from "./pages/ForDesignersDynamic"
import AboutManagement from "./pages/admin/AboutManagement"
import AboutDynamic from "./pages/AboutDynamic"
import ContactManagement from "./pages/admin/ContactManagement"
import ContactDynamic from "./pages/ContactDynamic"
import RefundPolicyManagement from "./pages/admin/RefundPolicyManagement"
// import HelpCenterManagement from "./pages/admin/HelpCenterManagement"
// import BlogManagement from "./pages/admin/BlogManagement"
// import WebsiteSectionManager from "./pages/admin/WebsiteSectionManager"
import UsageAnalytics from "./pages/admin/analytics/UsageAnalytics"
import RevenueAnalytics from "./pages/admin/analytics/RevenueAnalytics"
import AdminPlatformSettings from "./pages/admin/AdminPlatformSettings"
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
import CustomerFiles from "./pages/CustomerFiles"
import DesignerDashboard from "./pages/DesignerDashboard"
import DesignerProfile from "./pages/DesignerProfile"
import DesignerPortfolio from "./pages/DesignerPortfolio"
import DesignerBookings from "./pages/DesignerBookings"
import DesignerMessages from "./pages/DesignerMessages"
import DesignerAvailability from "./pages/DesignerAvailability"
import DesignerEarnings from "./pages/DesignerEarnings"
import DesignerComplaints from "./pages/DesignerComplaints"
import DesignerSessionHistory from "./pages/DesignerSessionHistory"
import DesignerSettings from "./pages/DesignerSettings"
import DesignerServices from "./pages/DesignerServices"
import DesignerFileReviews from "./pages/DesignerFileReviews"
import CallSession from "./pages/CallSession"
import LiveCallSession from "./pages/LiveCallSession"
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
import RefundPolicyDynamic from "./pages/RefundPolicyDynamic"
import TermsDynamic from "./pages/TermsDynamic"
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
                          location.pathname.startsWith('/live-session/') ||
                          location.state?.hideGlobalChrome;
  
  return (
    <div className="min-h-screen w-full flex flex-col">
      {!hideGlobalChrome && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<AboutDynamic />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/contact" element={<ContactDynamic />} />
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
          <Route path="/success-stories" element={<SuccessStoriesDynamic />} />
          <Route path="/support" element={<SupportDynamic />} />
          <Route path="/for-designers" element={<ForDesigners />} />
          <Route path="/designer-resources" element={<DesignerResources />} />
          <Route path="/designer-community" element={<DesignerCommunity />} />
          <Route path="/designer-help" element={<DesignerHelp />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/privacy" element={<PrivacyPolicyDynamic />} />
          <Route path="/terms" element={<TermsDynamic />} />
          <Route path="/refund-policy" element={<RefundPolicyDynamic />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin-dashboard" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* User Management */}
          <Route path="/admin/users" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* Transaction Management */}
          <Route path="/admin/transactions" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <TransactionManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* Final Files Management */}
          <Route path="/admin/final-files" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <AdminFinalFiles />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* Complaints Management */}
          <Route path="/admin/complaints" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <AdminComplaints />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* Refunds Management */}
          <Route path="/admin/refunds" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <AdminRefunds />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* Designer Management */}
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
          
          {/* Content Management System */}
          {/* <Route path="/admin/cms" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <CMSDashboard />
              </AdminLayout>
            </ProtectedAdminRoute>
          } /> */}
          {/* <Route path="/admin/cms/faqs" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <FAQManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } /> */}
          <Route path="/admin/cms/terms" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <TermsManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/cms/support" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <SupportManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/cms/privacy-policy" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <PrivacyPolicyManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/cms/success-stories" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <SuccessStoriesManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          {/* <Route path="/admin/cms/for-designers" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <ForDesignersManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } /> */}
          <Route path="/admin/cms/about" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <AboutManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/cms/contact" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <ContactManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/cms/refund-policy" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <RefundPolicyManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          {/* <Route path="/admin/cms/help-center" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <HelpCenterManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/cms/blog" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <BlogManagement />
              </AdminLayout>
            </ProtectedAdminRoute>
          } /> */}
          {/* <Route path="/admin/cms/sections" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <WebsiteSectionManager />
              </AdminLayout>
            </ProtectedAdminRoute>
          } /> */}
          
          {/* Analytics */}
          <Route path="/admin/analytics/usage" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <UsageAnalytics />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/analytics/revenue" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <RevenueAnalytics />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <Analytics />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* Platform Configuration */}
          <Route path="/admin/platform/settings" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <AdminPlatformSettings />
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
          <Route path="/customer-dashboard/files" element={
            <ProtectedRoute requireUserType="client">
              <CustomerFiles />
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
          <Route path="/designer/complaints" element={
            <ProtectedRoute requireUserType="designer">
              <DesignerComplaints />
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
          
          {/* New live session route with Agora A/V (unambiguous path) */}
          <Route path="/live-session/:sessionId" element={
            <ProtectedRoute>
              <LiveCallSession />
            </ProtectedRoute>
          } />
          {/* Back-compat live session route */}
          <Route path="/session/live_:sessionId" element={
            <ProtectedRoute>
              <LiveCallSession />
            </ProtectedRoute>
          } />
          {/* Legacy booking session route */}
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
