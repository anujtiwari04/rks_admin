import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react"; // Import a loader

export const AdminProtectedRoute = () => {
  // --- UPDATED: Get isAuthLoading ---
  const { isAuthenticated, user, isAuthLoading } = useAuth();

  // --- NEW: Show loading spinner while auth is checking ---
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // --- This check now runs *after* loading is complete ---
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};