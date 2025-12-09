import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, Trash2, Edit2, X, RefreshCw, Paperclip, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Interface matching the Backend Model
interface DailyCall {
  _id: string; // Backend uses _id
  title: string;
  scrip: string;
  action: 'BUY' | 'SELL';
  entry: string;
  buyMore?: string;
  target: string;
  stopLoss: string;
  price: number;
  rationale?: string;
  // status: 'active' | 'closed' | 'expired';
  publishedAt: string;
  isDeleted: boolean;
  createdAt: string;
  attachments?: { fileName: string; filePath: string; fileType: string }[];
}

// Form Data Interface
interface CallFormData {
  title: string;
  scrip: string;
  action: string;
  entry: string;
  buyMore: string;
  target: string;
  stopLoss: string;
  price: string; // Input as string, convert to number
  rationale: string;
}

const initialFormState: CallFormData = {
  title: "",
  scrip: "",
  action: "BUY",
  entry: "",
  buyMore: "",
  target: "",
  stopLoss: "",
  price: "",
  rationale: "",
};

const AdminDailyCalls = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // For submit action
  const [isFetching, setIsFetching] = useState(true); // For initial load
  const [calls, setCalls] = useState<DailyCall[]>([]);

  // State for Create/Edit Mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CallFormData>(initialFormState);

  // New State for Files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const navigate = useNavigate();

  // Fetch Calls
  const fetchCalls = async () => {
    try {
      setIsFetching(true);
      // Calls the endpoint: /api/daily-calls/admin/all
      const data = await api.get<DailyCall[]>("/daily-calls/admin/all");
      setCalls(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Error fetching calls",
        description: error.message || "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setSelectedFiles([]);
  };

  const handleEditClick = (call: DailyCall) => {
    setEditingId(call._id);
    setFormData({
      title: call.title,
      scrip: call.scrip,
      action: call.action,
      entry: call.entry,
      buyMore: call.buyMore || "",
      target: call.target,
      stopLoss: call.stopLoss,
      price: call.price.toString(),
      rationale: call.rationale || "",
    });
    setSelectedFiles([]); // Reset files on edit start
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!formData.title || !formData.scrip || !formData.price || !formData.entry || !formData.target || !formData.stopLoss) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData object for file upload
      const data = new FormData();
      data.append("title", formData.title);
      data.append("scrip", formData.scrip);
      data.append("action", formData.action);
      data.append("entry", formData.entry);
      data.append("buyMore", formData.buyMore);
      data.append("target", formData.target);
      data.append("stopLoss", formData.stopLoss);
      data.append("price", formData.price);
      data.append("rationale", formData.rationale);

      // Append files
      selectedFiles.forEach((file) => {
        data.append("attachments", file);
      });

      if (editingId) {
        // Update Existing Call
        // Note: For PUT with files, we use the raw axios instance logic via api.put but need to ensure it handles FormData
        // If your api.put wrapper doesn't handle Content-Type automatically for FormData, we might need a workaround.
        // However, usually axios handles FormData automatically if passed as body.
        // Since api.tsx put wrapper doesn't force JSON header, this should work.

        const updatedCall = await api.put<DailyCall>(`/daily-calls/${editingId}`, data);

        // Update local state optimistically
        setCalls(prev => prev.map(c => c._id === updatedCall._id ? updatedCall : c));

        toast({ title: "Updated Successfully", description: "Call details have been updated." });
      } else {
        // Create New Call using postFormData
        const newCall = await api.postFormData<DailyCall>("/daily-calls", data);

        // Add to local state
        setCalls(prev => [newCall, ...prev]);

        toast({ title: "Published Successfully", description: "New trading call is live." });
      }

      resetForm();

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to save call",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this call? This is a soft delete.")) return;

    try {
      await api.delete(`/daily-calls/${id}`);
      await fetchCalls();
      toast({ title: "Deleted", description: "Call has been marked as deleted." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Manage Daily Calls</h1>
            <p className="text-muted-foreground text-sm">Create and manage trading recommendations</p>
          </div>
        </div>
        <Button variant="ghost" onClick={fetchCalls} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* === CREATE / EDIT FORM === */}
        <div className="lg:col-span-2">
          <Card className={editingId ? "border-primary border-2" : ""}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{editingId ? "Edit Call" : "Publish New Call"}</CardTitle>
                <CardDescription>
                  {editingId ? "Updating existing recommendation" : "Share a new trading idea with your users"}
                </CardDescription>
              </div>
              {editingId && (
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4 mr-1" /> Cancel Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Row 1: Scrip & Action */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scrip">Scrip Name *</Label>
                    <Input id="scrip" value={formData.scrip} onChange={handleInputChange} required placeholder="e.g. RELIANCE" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="action">Action *</Label>
                    <Select value={formData.action} onValueChange={(val) => handleSelectChange("action", val)}>
                      <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">BUY</SelectItem>
                        <SelectItem value="SELL">SELL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Teaser Title (Public) *</Label>
                  <Input id="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. High Conviction IT Stock" />
                  <p className="text-xs text-muted-foreground">This is shown to users before they unlock the call.</p>
                </div>

                {/* Row 3: Technical Levels */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry">Entry Price *</Label>
                    <Input id="entry" value={formData.entry} onChange={handleInputChange} required placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyMore">Buy More/Avg</Label>
                    <Input id="buyMore" value={formData.buyMore} onChange={handleInputChange} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target">Target *</Label>
                    <Input id="target" value={formData.target} onChange={handleInputChange} required placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stopLoss">Stop Loss *</Label>
                    <Input id="stopLoss" value={formData.stopLoss} onChange={handleInputChange} required placeholder="0.00" />
                  </div>
                </div>

                {/* Row 4: Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Unlock Price (₹) *</Label>
                    <Input id="price" type="number" value={formData.price} onChange={handleInputChange} required placeholder="e.g. 99" />
                  </div>
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <Label htmlFor="attachments" className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments (Images, PDF, Docx)
                  </Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {selectedFiles.length} file(s) selected
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rationale">Rationale / Analysis</Label>
                  <Textarea id="rationale" value={formData.rationale} onChange={handleInputChange} placeholder="Why this trade? Technical/Fundamental reasons..." rows={3} />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Edit2 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {editingId ? "Update Call" : "Publish Call"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* === LIST / HISTORY === */}
        <div className="h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle>Recent History</CardTitle>
              <CardDescription>All calls including closed/deleted</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[800px] pr-2">
              {isFetching ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : calls.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No calls found.</p>
              ) : (
                <div className="space-y-4">
                  {calls.map((call) => (
                    <div
                      key={call._id}
                      className={`p-3 border rounded-lg transition-colors ${call.isDeleted ? 'bg-destructive/5 border-destructive/20 opacity-70' : 'bg-card hover:bg-muted/50'} ${editingId === call._id ? 'ring-2 ring-primary border-transparent' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">{call.scrip}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(call.createdAt), "dd MMM, HH:mm")}</p>
                        </div>
                        {call.isDeleted && <Badge variant="destructive">Deleted</Badge>}
                      </div>

                      <div className="flex justify-between items-center text-xs mb-3">
                        <span className={`font-bold ${call.action === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>{call.action}</span>
                        <span className="font-mono">₹{call.price}</span>
                      </div>

                      {!call.isDeleted && (
                        <div className="flex gap-2 mt-2">
                          {/* NEW VIEW BUTTON */}
                          {/* <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={() => navigate(`/daily-calls/${call._id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button> */}

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={() => handleEditClick(call)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" /> Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(call._id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default AdminDailyCalls;