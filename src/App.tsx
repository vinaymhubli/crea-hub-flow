
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth"
import Index from "./pages/Index"
import About from "./pages/About"
import HowToUse from "./pages/HowToUse"
import Contact from "./pages/Contact"
import Designers from "./pages/Designers"
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
import CustomerMessages from "./pages/CustomerMessages"
import CustomerNotifications from "./pages/CustomerNotifications"
import CustomerSettings from "./pages/CustomerSettings"
import CustomerRecentDesigners from "./pages/CustomerRecentDesigners"
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
import CallSession from "./pages/CallSession"
import AIAssistant from "./pages/AIAssistant"
import NotFound from "./pages/NotFound"
import { ProtectedRoute } from "./components/ProtectedRoute"
import Header from "./components/Header"
import Footer from "./components/Footer"
import "./App.css"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/how-to-use" element={<HowToUse />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/designers" element={<Designers />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/services/:id" element={<ServiceDetail />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/ai-assistant" element={<AIAssistant />} />
                  
                  {/* Protected Admin Routes */}
                  <Route path="/admin-dashboard" element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/designer-verification" element={
                    <ProtectedRoute>
                      <DesignerVerification />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/session-control" element={
                    <ProtectedRoute>
                      <SessionControl />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/designer-availability" element={
                    <ProtectedRoute>
                      <AdminDesignerAvailability />
                    </ProtectedRoute>
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
              <Footer />
            </div>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
