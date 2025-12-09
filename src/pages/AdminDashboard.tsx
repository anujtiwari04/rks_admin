import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, Trash2, Megaphone } from "lucide-react"; // Added Megaphone icon
import api from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface ApiPlan {
  _id: string;
  name: string;
  description: string;
  pricing: {
    monthly: number | null;
    quarterly: number | null;
    halfYearly: number | null;
    yearly: number | null;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { toast } = useToast();

  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [planToDelete, setPlanToDelete] = useState<ApiPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<ApiPlan[]>("/plans/getAllPlans");
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast({ title: "Error", description: "Failed to fetch plans.", variant: "destructive" });
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDeletePlan = async () => {
    if (!planToDelete) return;

    setIsDeleting(true);
    try {
      const res = await api.delete<{ message: string }>(`/plans/delete/${planToDelete._id}`);
      toast({
        title: "Success",
        description: res.message,
      });
      setPlanToDelete(null);
      await fetchPlans();
    } catch (err: any) {
      console.error("Failed to delete plan:", err);
      toast({
        title: "Error Deleting Plan",
        description: err.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto max-w-6xl">
        <Card>
          <CardHeader className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <CardTitle className="text-xl sm:text-2xl md:text-3xl">Admin Dashboard</CardTitle>
              </div>
              <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
                Logout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <p className="text-sm sm:text-base text-muted-foreground">
                Welcome, <span className="font-semibold text-foreground">{user?.name}</span>
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                This is your admin dashboard. You have full access to manage the application.
              </p>

              {/* Daily call managment */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-base sm:text-lg font-semibold">Daily Calls</h3>
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm sm:text-base">Daily Market Calls</span>
                      </div>
                      <Link to="/admin/all-daily-calls" className="w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto">
                          View All Calls
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* user managment */}
              <div className="space-y-3 pt-6 border-t">
                <h3 className="text-base sm:text-lg font-semibold">User Management</h3>
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <span className="font-medium text-sm sm:text-base">All Subscriptions</span>
                      <Link to="/admin/users" className="w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto">Manage Users</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Premium Plans */}
              <div className="space-y-3 pt-6 border-t">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-base sm:text-lg font-semibold">Premium Plans</h3>
                  <Link to="/admin/create-plan" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto">Create New Plan</Button>
                  </Link>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm sm:text-base text-muted-foreground">Loading plans...</span>
                  </div>
                ) : plans.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">No premium plans found.</p>
                ) : (
                  plans.map((plan) => (
                    <Card key={plan._id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <span className="font-medium text-sm sm:text-base break-words">{plan.name}</span>
                          <div className="flex flex-wrap gap-2">
                            <Link to={`/admin/chat/${encodeURIComponent(plan.name)}`} className="flex-1 sm:flex-none">
                              <Button size="sm" className="w-full sm:w-auto">Chat</Button>
                            </Link>
                            <Link to={`/admin/edit-plan/${encodeURIComponent(plan.name)}`} className="flex-1 sm:flex-none">
                              <Button size="sm" variant="outline" className="w-full sm:w-auto">Edit</Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setPlanToDelete(plan)}
                              className="w-full sm:w-auto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>


            </div>
          </CardContent>
        </Card>
      </div>

      {/* dlt alert */}
      <AlertDialog
        open={!!planToDelete}
        onOpenChange={(open) => { if (!open) setPlanToDelete(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              <strong className="mx-1">{planToDelete?.name}</strong>
              plan and all associated chat messages.
              <br /><br />
              <span className="text-destructive font-medium">
                Note: This will fail if any users are actively subscribed to this plan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, delete plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;