import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CodeProtection } from "@/components/CodeProtection";
import NewsletterPopup from "@/components/NewsletterPopup";
import Index from "./pages/Index";
import BookingPortal from "./pages/BookingPortal";
import BookingSuccess from "./pages/BookingSuccess";
import AdminBookings from "./pages/AdminBookings";
import AdminArchived from "./pages/AdminArchived";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPipeline from "./pages/AdminPipeline";
import AdminProjects from "./pages/AdminProjects";
import AdminPayments from "./pages/AdminPayments";
import AdminSecurity from "./pages/AdminSecurity";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminLogin from "./pages/AdminLogin";
import AdminMeetings from "./pages/AdminMeetings";
import AdminMessages from "./pages/AdminMessages";
import NotFound from "./pages/NotFound";
import ClientLogin from "./pages/ClientLogin";
import ClientDashboard from "./pages/ClientDashboard";
import ClientFiles from "./pages/ClientFiles";
import ClientMessages from "./pages/ClientMessages";
import ClientSettings from "./pages/ClientSettings";
import ClientMeetings from "./pages/ClientMeetings";
import ClientDeliverables from "./pages/ClientDeliverables";
import AdminClientFiles from "./pages/AdminClientFiles";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ClientProtectedRoute } from "./components/client/ClientProtectedRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminClients from "./pages/AdminClients";
import AdminFiles from "./pages/AdminFiles";
import AdminEpisodePlanner from "./pages/AdminEpisodePlanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CodeProtection />
      <Toaster />
      <Sonner />
      <NewsletterPopup />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/lander" element={<Index />} />
          <Route path="/booking-portal" element={<BookingPortal />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/client/login" element={<ClientLogin />} />
          
          {/* Client Routes */}
          <Route
            path="/client/dashboard"
            element={
              <ClientProtectedRoute>
                <ClientDashboard />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/files"
            element={
              <ClientProtectedRoute>
                <ClientFiles />
              </ClientProtectedRoute>
            }
          />
            <Route
              path="/client/messages"
              element={
                <ClientProtectedRoute>
                  <ClientMessages />
                </ClientProtectedRoute>
              }
            />
          <Route
            path="/client/settings"
            element={
              <ClientProtectedRoute>
                <ClientSettings />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/meetings"
            element={
              <ClientProtectedRoute>
                <ClientMeetings />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/deliverables"
            element={
              <ClientProtectedRoute>
                <ClientDeliverables />
              </ClientProtectedRoute>
            }
          />
          
          {/* Admin Routes with Sidebar Layout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="archived" element={<AdminArchived />} />
            <Route path="pipeline" element={<AdminPipeline />} />
            <Route path="meetings" element={<AdminMeetings />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="episode-planner" element={<AdminEpisodePlanner />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="clients/:clientId/files" element={<AdminClientFiles />} />
            <Route path="files" element={<AdminFiles />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="security" element={<AdminSecurity />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
