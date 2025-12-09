import { useState, useEffect } from "react"; // Import useEffect
import { Link, useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react"; // Import Loader2
import api from "@/lib/api"; // Import api client
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Interface for the plan data we fetch
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

const AdminEditPlan = () => {
  const { planName } = useParams<{ planName: string }>();
  const decodedPlanName = planName ? decodeURIComponent(planName) : "";
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [planId, setPlanId] = useState<string | null>(null); // To store the plan's _id
  const [isLoading, setIsLoading] = useState(false); // For submit loading
  const [isFetching, setIsFetching] = useState(true); // For initial data load
  const [error, setError] = useState<string | null>(null);

  // Form data state - **Initialized as empty strings**
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    monthly: "",
    quarterly: "",
    halfYearly: "",
    yearly: "",
  });

  // --- NEW: Fetch existing plan data on load ---
  useEffect(() => {
    const fetchPlanData = async () => {
      if (!decodedPlanName) return;
      
      try {
        setIsFetching(true);
        setError(null);
        //
        const plan = await api.get<ApiPlan>(`/plans/by-name/${decodedPlanName}`);
        
        // Populate the form with the fetched data
        setFormData({
          name: plan.name,
          description: plan.description,
          monthly: plan.pricing.monthly?.toString() || "",
          quarterly: plan.pricing.quarterly?.toString() || "",
          halfYearly: plan.pricing.halfYearly?.toString() || "",
          yearly: plan.pricing.yearly?.toString() || "",
        });
        setPlanId(plan._id); // Store the plan's ID for the update request
        
      } catch (err: any) {
        setError(err.message || "Failed to fetch plan details.");
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsFetching(false);
      }
    };

    fetchPlanData();
  }, [decodedPlanName, toast]);
  // --- END NEW ---

  // --- UPDATED: Handle form submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) return; // Don't submit if we don't have a plan ID

    setIsLoading(true);
    setError(null);

    // Format data for the API
    const apiData = {
      name: formData.name,
      description: formData.description,
      pricing: {
        monthly: formData.monthly ? Number(formData.monthly) : null,
        quarterly: formData.quarterly ? Number(formData.quarterly) : null,
        halfYearly: formData.halfYearly ? Number(formData.halfYearly) : null,
        yearly: formData.yearly ? Number(formData.yearly) : null,
      },
    };

    try {
      // Use the 'update' route with the planId
      await api.put(`/plans/update/${planId}`, apiData);
      
      toast({
        title: "Success!",
        description: `Plan "${apiData.name}" has been updated.`,
      });
      
      navigate("/admin/dashboard"); // Redirect to dashboard on success

    } catch (err: any) {
      const errMsg = err.message || "Failed to update plan.";
      setError(errMsg);
      toast({ title: "Error", description: errMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // --- UPDATED: Show loading spinner while fetching ---
  if (isFetching) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8 flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin/dashboard">
          <Button variant="outline" size="sm" disabled={isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          {/* This title is now dynamic, based on the URL param */}
          <CardTitle>Edit Plan: {decodedPlanName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={formData.name} // This is now from the fetched data
                onChange={handleInputChange}
                placeholder="Enter plan name"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description} // This is now from the fetched data
                onChange={handleInputChange}
                placeholder="Enter plan description"
                rows={4}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly">Monthly Price</Label>
                <Input
                  id="monthly"
                  type="number"
                  value={formData.monthly} // This is now from the fetched data
                  onChange={handleInputChange}
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quarterly">Quarterly Price</Label>
                <Input
                  id="quarterly"
                  type="number"
                  value={formData.quarterly} // This is now from the fetched data
                  onChange={handleInputChange}
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="halfYearly">Half-Yearly Price</Label>
                <Input
                  id="halfYearly"
                  type="number"
                  value={formData.halfYearly} // This is now from the fetched data
                  onChange={handleInputChange}
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearly">Yearly Price</Label>
                <Input
                  id="yearly"
                  type="number"
                  value={formData.yearly} // This is now from the fetched data
                  onChange={handleInputChange}
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || isFetching}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEditPlan;