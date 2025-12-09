import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AdminCreatePlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data state, initialized as empty
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    monthly: "",
    quarterly: "",
    halfYearly: "",
    yearly: "",
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Use the 'createPlan' route
      await api.post("/plans/createPlan", apiData);
      
      toast({
        title: "Success!",
        description: `Plan "${apiData.name}" has been created.`,
      });
      
      navigate("/admin/dashboard"); // Redirect to dashboard on success

    } catch (err: any) {
      const errMsg = err.message || "Failed to create plan.";
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
          <CardTitle>Create New Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={formData.name}
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
                value={formData.description}
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
                  value={formData.monthly}
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
                  value={formData.quarterly}
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
                  value={formData.halfYearly}
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
                  value={formData.yearly}
                  onChange={handleInputChange}
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Plan"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCreatePlan;