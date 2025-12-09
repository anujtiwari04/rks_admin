
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, DollarSign, UserPlus, Clock, ArrowLeft, Loader2, AlertCircle, ArrowDownUp, UserMinus, Download } from "lucide-react";
import { format, isAfter, isBefore, addDays, parseISO, subMonths } from "date-fns";
import api from "@/lib/api";
import * as XLSX from "xlsx";

interface AdminMembership {
  _id: string;
  user: { _id: string; name: string; email: string };
  planName: string;
  duration: 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Yearly';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  expiryDate: string;
  amountPaid: number; // This is now TOTAL amount paid across all renewals
  renewalCount: number;
}

// Define valid keys for sorting
type SortableKeys = 'user.name' | 'planName' | 'startDate' | 'expiryDate';

const AdminUserDashboard = () => {
  // --- STATE FOR API DATA, LOADING, AND ERRORS ---
  const [allMemberships, setAllMemberships] = useState<AdminMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterText, setFilterText] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expired'>('all');
  
  // --- STATE FOR SORTING ---
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>({
    key: 'startDate',
    direction: 'desc',
  });

  // --- FETCH DATA FROM API ---
  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<AdminMembership[]>('/admin/all-memberships');
        setAllMemberships(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Failed to fetch memberships:", err);
        setError(err.message || 'An unknown error occurred.');
        setAllMemberships([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberships();
  }, []);

  // Analytics calculations
  const analytics = useMemo(() => {
    if (isLoading || allMemberships.length === 0) {
      return { activeSubscribers: 0, totalRevenue: 0, newMembers: 0, newMembers6m: 0, upcomingExpirations: 0, notRenewed: 0 };
    }
    const now = new Date();
    const thirtyDaysAgo = addDays(now, -30);
    const thirtyDaysLater = addDays(now, 30);
    const sixMonthsAgo = subMonths(now, 6);

    const activeSubscribers = allMemberships.filter((m) => m.status === 'active').length;
    const totalRevenue = allMemberships.reduce((sum, m) => sum + m.amountPaid, 0) / 100;
    
    // New members logic: First time subscribers in last 30 days
    // Logic: Start date is recent AND renewalCount is 1
    const newMembers = allMemberships.filter((m) => 
        isAfter(parseISO(m.startDate), thirtyDaysAgo) && m.renewalCount === 1
    ).length;

    const newMembers6m = allMemberships.filter((m) => isAfter(parseISO(m.startDate), sixMonthsAgo)).length;
    
    const upcomingExpirations = allMemberships.filter((m) => 
      m.status === 'active' && 
      isAfter(parseISO(m.expiryDate), now) && 
      isBefore(parseISO(m.expiryDate), thirtyDaysLater)
    ).length;

    // --- UPDATED Not Renewed Calculation ---
    // A user is "not renewed" if their latest status is 'expired' AND they only have 1 count.
    // If renewalCount > 1, they renewed at least once before expiring again.
    const notRenewed = allMemberships.filter((m) => 
        m.status === 'expired' && m.renewalCount === 1
    ).length;

    return { activeSubscribers, totalRevenue, newMembers, newMembers6m, upcomingExpirations, notRenewed };
  }, [allMemberships, isLoading]);

  // Filter and sort memberships
  const processedMemberships = useMemo(() => {
    let filtered = allMemberships;

    // Filter by tab
    if (activeTab === 'active') {
      filtered = filtered.filter((m) => m.status === 'active');
    } else if (activeTab === 'expired') {
      filtered = filtered.filter((m) => m.status === 'expired');
    }

    // Filter by search text
    if (filterText) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter((m) =>
        m.user.name.toLowerCase().includes(searchLower) ||
        m.user.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort the filtered data
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'user.name') {
          aValue = a.user.name.toLowerCase();
          bValue = b.user.name.toLowerCase();
        } else if (sortConfig.key === 'startDate' || sortConfig.key === 'expiryDate') {
          aValue = parseISO(a[sortConfig.key]).getTime();
          bValue = parseISO(b[sortConfig.key]).getTime();
        } else {
          aValue = a[sortConfig.key as keyof AdminMembership];
          bValue = b[sortConfig.key as keyof AdminMembership];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [allMemberships, activeTab, filterText, sortConfig]);

  // --- SORTING HANDLER ---
  const handleSort = (key: SortableKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- EXCEL DOWNLOAD HANDLER ---
  const downloadExcel = () => {
    if (processedMemberships.length === 0) return;

    const dataToExport = processedMemberships.map(m => ({
      'User Name': m.user.name,
      'Email': m.user.email,
      'Plan Name': m.planName,
      'Latest Duration': m.duration,
      'Current Status': m.status,
      'Latest Start Date': format(parseISO(m.startDate), 'dd MMM, yyyy'), 
      'Expiry Date': format(parseISO(m.expiryDate), 'dd MMM, yyyy'),
      'Total Amount Paid': (m.amountPaid / 100).toFixed(2),
      'Renewal Count': m.renewalCount,
      'Has Renewed?': m.renewalCount > 1 ? 'Yes' : 'No'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    worksheet['!cols'] = [
      { wch: 25 }, // User Name
      { wch: 35 }, // Email
      { wch: 20 }, // Plan Name
      { wch: 15 }, // Duration
      { wch: 10 }, // Status
      { wch: 18 }, // Start Date
      { wch: 18 }, // Expiry Date
      { wch: 15 }, // Total Amount
      { wch: 10 }, // Renewals
      { wch: 10 }, // Has Renewed
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Memberships");
    XLSX.writeFile(workbook, `Memberships_Summary_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-500">Active</Badge>;
      case 'expired':
        return <Badge className="bg-red-500 hover:bg-red-500">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: SortableKeys }) => (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSort(sortKey)}
        className="-ml-3"
      >
        {label}
        <ArrowDownUp className="ml-2 h-3 w-3" />
      </Button>
    </TableHead>
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">User Memberships</h1>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeSubscribers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all renewals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Members (30d)</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.newMembers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Expirations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.upcomingExpirations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Not Renewed</CardTitle>
              <UserMinus className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.notRenewed}</div>
              <p className="text-xs text-muted-foreground">Expired & never renewed</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Memberships</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-between items-start sm:items-center">
              <Input
                placeholder="Search by name or email..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="max-w-sm"
              />
              <Button 
                variant="outline" 
                onClick={downloadExcel} 
                disabled={processedMemberships.length === 0}
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Loading memberships...</span>
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHeader label="User" sortKey="user.name" />
                        <TableHead>Current Status</TableHead>
                        <SortableHeader label="Plan" sortKey="planName" />
                        <SortableHeader label="Latest Start" sortKey="startDate" />
                        <SortableHeader label="Expiry Date" sortKey="expiryDate" />
                        <TableHead>Renewed?</TableHead>
                        <TableHead>Total Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedMemberships.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No memberships found
                          </TableCell>
                        </TableRow>
                      ) : (
                        processedMemberships.map((membership) => (
                          <TableRow key={membership._id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{membership.user.name}</span>
                                <span className="text-sm text-muted-foreground">{membership.user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(membership.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{membership.planName}</span>
                                <span className="text-sm text-muted-foreground">{membership.duration}</span>
                              </div>
                            </TableCell>
                            <TableCell>{format(parseISO(membership.startDate), 'dd MMM, yyyy')}</TableCell>
                            <TableCell>{format(parseISO(membership.expiryDate), 'dd MMM, yyyy')}</TableCell>
                            <TableCell>
                                {membership.renewalCount > 1 ? (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                        Yes ({membership.renewalCount})
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground text-sm pl-2">No</span>
                                )}
                            </TableCell>
                            <TableCell>₹{(membership.amountPaid / 100).toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserDashboard;
