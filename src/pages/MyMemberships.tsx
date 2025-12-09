import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api, { setToken as clearToken } from '@/lib/api'; 
import { addDays, isBefore, isAfter, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface IMembership {
  _id: string;
  planName: string;
  status: 'active' | 'expired' | 'cancelled';
  expiryDate: string;
  amountPaid?: number;
  duration?: string;
  startDate?: string;
}

const getExpiryStatus = (expiryDate: string) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();

  if (diffTime <= 0) {
    return <span className="text-destructive font-medium">Expired on {expiry.toLocaleDateString('en-GB')}</span>;
  }

  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return <span className="text-yellow-600 font-medium">Expires in {diffDays} days</span>;
  return <span className="text-success font-medium">Active until {expiry.toLocaleDateString('en-GB')}</span>;
};

const MyMembershipsPage = () => {
  const { isAuthenticated, setAuthDialogOpen } = useAuth();
  const navigate = useNavigate();

  const [memberships, setMemberships] = useState<IMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- CHANGED: Now storing an ARRAY of plans to show in the dialog ---
  const [expiringPlans, setExpiringPlans] = useState<IMembership[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('TOKEN');
    if (!token) {
      setAuthDialogOpen(true);
      setIsLoading(false);
      return;
    }

    const fetchMemberships = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<IMembership[]>('/memberships');
        const validMemberships = Array.isArray(data) ? data : [];
        setMemberships(validMemberships);

        // --- UPDATED LOGIC: Collect ALL expiring plans ---
        const now = new Date();
        const threeDaysFromNow = addDays(now, 3);
        const plansToExpire: IMembership[] = [];

        for (const sub of validMemberships) {
          const expiryDate = parseISO(sub.expiryDate);
          // Check if active AND expires within 3 days
          if (sub.status === 'active' && isAfter(expiryDate, now) && isBefore(expiryDate, threeDaysFromNow)) {
            plansToExpire.push(sub);
          }
        }

        // If we found any expiring plans, show them in the dialog
        if (plansToExpire.length > 0) {
          setExpiringPlans(plansToExpire);
        }

      } catch (err: any) {
        if (err?.status === 401 || err?.message?.toLowerCase()?.includes('unauthorized')) {
          clearToken(); 
          setAuthDialogOpen(true);
        } else {
          console.error('Failed to fetch memberships:', err);
        }
        setMemberships([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberships();
  }, [isAuthenticated, setAuthDialogOpen]);
  
  const handleResubscribe = (planName: string) => {
    navigate(`/subscribe/${encodeURIComponent(planName)}`);
    // We don't necessarily need to clear the dialog here, as the navigation will unmount the component
    // but good practice if you use a modal based router or want to be safe:
    setExpiringPlans([]); 
  };

  // Helper to determine dialog title
  const getDialogTitle = () => {
    if (expiringPlans.length === 0) return "";
    if (expiringPlans.length === 1) {
      return expiringPlans[0].status === 'active' ? "Subscription Expiring Soon" : "Subscription Expired";
    }
    return "Attention: Multiple Subscriptions";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground">Please login to view your memberships</p>
          <Button onClick={() => setAuthDialogOpen(true)}>Login to view</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Your Memberships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* --- UPDATED: Multi-Plan Alert Dialog --- */}
      <AlertDialog
        open={expiringPlans.length > 0}
        onOpenChange={(open) => {
          if (!open) setExpiringPlans([]);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
               <AlertTriangle className="h-5 w-5 text-yellow-600" />
               {getDialogTitle()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              The following plans require your attention:
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* List of Expiring Plans */}
          <div className="py-2 space-y-3">
            {expiringPlans.map((plan) => (
              <div key={plan._id} className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{plan.planName}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.status === 'active' ? 'Expires: ' : 'Expired: '} 
                    {new Date(plan.expiryDate).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleResubscribe(plan.planName)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Renew
                </Button>
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            {/* Only a Close button here. The primary actions are now per-item. */}
            <AlertDialogCancel onClick={() => setExpiringPlans([])}>
              Remind Me Later
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <h1 className="text-4xl font-bold mb-8">My Memberships</h1>

      {memberships.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Memberships Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">You have not subscribed to any plans yet.</p>
            <Button onClick={() => navigate('/membership')}>View Plans</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.map((sub) => (
            <Card
              key={sub._id}
              className={`cursor-pointer transition-all duration-200 
                ${sub.status !== 'active' 
                  ? 'opacity-80 border-destructive/30 hover:border-destructive hover:shadow-md' 
                  : 'border-border hover:border-primary/50 hover:shadow-lg'}`}
              onClick={() => {
                if (sub.status === 'active') {
                  navigate(`/membership-chat/${encodeURIComponent(sub.planName)}`);
                } else {
                  // If clicking an expired card, we set state to an array containing JUST this plan
                  // This reuses the same Dialog UI we built above!
                  setExpiringPlans([sub]);
                }
              }}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{sub.planName}</span>
                  {sub.status === 'active' ? (
                     <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                     <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-medium">
                        Inactive
                     </span>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">{getExpiryStatus(sub.expiryDate)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {sub.status === 'active' 
                    ? 'Click to view updates for this plan.' 
                    : 'Membership expired. Click to renew.'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMembershipsPage;