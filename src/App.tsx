import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Admin Pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminChat from "./pages/AdminChat";
import AdminCreatePlan from "./pages/AdminCreatePlan";
import AdminEditPlan from "./pages/AdminEditPlan";
import AdminUserDashboard from "./pages/AdminUserDashboard";
import AdminDailyCalls from "./pages/AdminDailyCalls";
import AllDailyCalls from "./pages/AllDailyCalls";

import { ScrollToTop } from "./components/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";

// Note: You might want to remove Navbar or create a specific AdminNavbar later
// For now, we assume admins don't need the public Navbar

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          
          <Routes>
            {/* Default Route: Redirect to Login */}
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin Routes */}
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/chat/:planName" element={<AdminChat />} />
              <Route path="/admin/create-plan" element={<AdminCreatePlan />} />
              <Route path="/admin/edit-plan/:planName" element={<AdminEditPlan />} />
              <Route path="/admin/users" element={<AdminUserDashboard />} />
              <Route path="/admin/daily-calls" element={<AdminDailyCalls />} />
              <Route path="/admin/all-daily-calls" element={<AllDailyCalls />} />
            </Route>

            {/* Catch all redirect to login */}
            <Route path="*" element={<Navigate to="/admin/login" replace />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;