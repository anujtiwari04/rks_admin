import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ArrowLeft, Plus, Lock, Unlock, Trash2, Edit, Loader2, RefreshCw, Link as LinkIcon, Check } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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

interface DailyCall {
  _id: string;
  title: string;
  scrip: string;
  action: 'BUY' | 'SELL';
  entry: string;
  buyMore?: string;
  target: string;
  stopLoss: string;
  price: number;
  // status: 'active' | 'closed' | 'expired';
  publishedAt: string;
  isDeleted: boolean;
}

const AllDailyCalls = () => {
  const { toast } = useToast();
  const navigate = useNavigate(); // Use navigate for edit
  const [calls, setCalls] = useState<DailyCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [callToDelete, setCallToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null); // State for feedback

  const fetchCalls = async () => {
    try {
      setIsLoading(true);
      // Fetch all calls (active, closed, expired, deleted)
      const data = await api.get<DailyCall[]>("/daily-calls/admin/all");
      setCalls(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch calls.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleDelete = async () => {
    if (!callToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/daily-calls/${callToDelete}`);
      toast({ title: "Success", description: "Call marked as deleted." });
      await fetchCalls(); // Refresh list
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setCallToDelete(null);
    }
  };
  const frontendUrl = " http://localhost:8080";

  const copyToClipboard = (id: string) => {
    const url = `${frontendUrl}/daily-calls/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    console.log("Copied:", url);
    toast({ description: "URL copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };



  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Daily Calls</h1>
            <p className="text-muted-foreground">View and manage all your trading calls history.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCalls} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/admin/daily-calls">
            <Button className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" />
              Publish New Call
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : calls.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No records found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Published Date</TableHead>
                    <TableHead>Scrip</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Levels (E / T / SL)</TableHead>
                    <TableHead>Price</TableHead>
                    {/* <TableHead>Status</TableHead> */}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call._id} className={call.isDeleted ? "opacity-50 bg-muted/30" : ""}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(call.publishedAt || Date.now()), "dd MMM yyyy, HH:mm")}
                      </TableCell>

                      <TableCell className="font-medium">
                        {call.scrip}
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{call.title}</div>
                      </TableCell>

                      <TableCell>
                        <span className={`font-bold px-2 py-1 rounded text-xs ${call.action === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {call.action}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs space-y-1">
                        <div><span className="font-semibold text-muted-foreground">E:</span> {call.entry}</div>
                        <div><span className="font-semibold text-muted-foreground">T:</span> {call.target}</div>
                        <div><span className="font-semibold text-muted-foreground">SL:</span> {call.stopLoss}</div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 font-mono text-sm">
                          {call.price > 0 ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Unlock className="h-3 w-3 text-success" />}
                          ₹{call.price}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {!call.isDeleted ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setCallToDelete(call._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Badge variant="destructive" className="">Deleted</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* NEW COPY BUTTON */}
                          {!call.isDeleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(call._id)}
                              title="Copy Link"
                            >
                              {copiedId === call._id ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          )}

                          {!call.isDeleted ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setCallToDelete(call._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Badge variant="destructive">Deleted</Badge>
                          )}
                        </div>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!callToDelete} onOpenChange={(open) => !open && setCallToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this call?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the call as deleted. Users will no longer see it in the main feed,
              but existing purchases will be preserved in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllDailyCalls;