import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit2, Trash2, Download, Search, Filter, Calendar, Building, MapPin, Eye } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { JobApplication, InsertJobApplication } from "@shared/schema";

interface DashboardSummary {
  totalApplications: number;
  totalResponses: number;
  interviews: number;
  offers: number;
  rejections: number;
  pendingResponse: number;
  followUpReminders: number;
  lateFollowUps: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
}

export function JobApplications() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResponse, setFilterResponse] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof JobApplication>("applyDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch job applications
  const { data: applications = [], isLoading } = useQuery<JobApplication[]>({
    queryKey: ["/api/job-applications"],
  });

  // Fetch dashboard summary
  const { data: dashboardData } = useQuery<DashboardSummary>({
    queryKey: ["/api/job-applications/dashboard"],
  });

  // Create job application mutation
  const createMutation = useMutation({
    mutationFn: (application: InsertJobApplication) =>
      apiRequest("POST", "/api/job-applications", application),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications/dashboard"] });
      setIsAddModalOpen(false);
      toast({ title: "Success", description: "Job application created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job application",
        variant: "destructive",
      });
    },
  });

  // Update job application mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: Partial<JobApplication> & { id: number }) =>
      apiRequest("PUT", `/api/job-applications/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications/dashboard"] });
      setIsEditModalOpen(false);
      setEditingApplication(null);
      toast({ title: "Success", description: "Job application updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job application",
        variant: "destructive",
      });
    },
  });

  // Delete job application mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/job-applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications/dashboard"] });
      toast({ title: "Success", description: "Job application deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job application",
        variant: "destructive",
      });
    },
  });

  // Filter and sort applications
  const filteredApplications = applications
    .filter((app: JobApplication) => {
      const matchesSearch = 
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.appliedRoles.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.locationCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.locationCountry?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterResponse === "all" || app.response === filterResponse;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a: JobApplication, b: JobApplication) => {
      const aValue = a[sortField] as any;
      const bValue = b[sortField] as any;
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Calculate response time in days
  const calculateResponseTime = (applyDate: string, responseDate: string | null): number | null => {
    if (!responseDate) return null;
    const apply = new Date(applyDate);
    const response = new Date(responseDate);
    return Math.floor((response.getTime() - apply.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Check if application needs follow-up
  const needsFollowUp = (applyDate: string, response: string): boolean => {
    if (response && response !== 'No Response') return false;
    const apply = new Date(applyDate);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - apply.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 45;
  };

  // Check if application is late for follow-up
  const isLateFollowUp = (applyDate: string, response: string): boolean => {
    if (response && response !== 'No Response') return false;
    const apply = new Date(applyDate);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - apply.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 60;
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "ID", "Applied Roles", "Company", "Apply Date", "Where Applied", 
      "Credentials Used", "Comments", "Response", "Response Date", 
      "Location City", "Location Country", "Response Time (Days)", "Interview Comments"
    ];
    
    const csvData = (applications as JobApplication[]).map((app: JobApplication) => [
      app.id,
      app.appliedRoles,
      app.company,
      app.applyDate,
      app.whereApplied,
      app.credentialsUsed || "",
      app.commentsInformation || "",
      app.response,
      app.responseDate || "",
      app.locationCity || "",
      app.locationCountry || "",
      calculateResponseTime(app.applyDate, app.responseDate) || "",
      app.interviewComments || ""
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `job-applications-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Response badge styling
  const getResponseBadge = (response: string) => {
    const variants: Record<string, string> = {
      "Offer": "bg-green-500 text-white",
      "Interview": "bg-blue-500 text-white", 
      "Rejected": "bg-red-500 text-white",
      "No Response": "bg-gray-500 text-white",
      "Other": "bg-purple-500 text-white"
    };
    
    return (
      <Badge className={variants[response] || variants["Other"]}>
        {response}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Job Applications Tracker</h1>
          <p className="text-muted-foreground">Track and manage your job applications</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Job Application</DialogTitle>
                <DialogDescription>
                  Enter the details of your job application
                </DialogDescription>
              </DialogHeader>
              <JobApplicationForm 
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalApplications}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Response Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.responseRate}%</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.totalResponses} of {dashboardData.totalApplications}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{dashboardData.interviews}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.interviewRate}% of applications
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{dashboardData.offers}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.offerRate}% of applications
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Follow-up Reminders */}
      {dashboardData && (dashboardData.followUpReminders > 0 || dashboardData.lateFollowUps > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Follow-up Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {dashboardData.followUpReminders > 0 && (
                <div className="text-orange-700">
                  {dashboardData.followUpReminders} applications need follow-up (45+ days)
                </div>
              )}
              {dashboardData.lateFollowUps > 0 && (
                <div className="text-red-700 font-medium">
                  {dashboardData.lateFollowUps} applications are overdue (60+ days)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company, role, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterResponse} onValueChange={setFilterResponse}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by response" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Responses</SelectItem>
                <SelectItem value="No Response">No Response</SelectItem>
                <SelectItem value="Interview">Interview</SelectItem>
                <SelectItem value="Offer">Offer</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => {
                    if (sortField === 'id') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('id');
                      setSortDirection('desc');
                    }
                  }}>
                    ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => {
                    if (sortField === 'appliedRoles') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('appliedRoles');
                      setSortDirection('asc');
                    }
                  }}>
                    Role {sortField === 'appliedRoles' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => {
                    if (sortField === 'company') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('company');
                      setSortDirection('asc');
                    }
                  }}>
                    Company {sortField === 'company' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => {
                    if (sortField === 'applyDate') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('applyDate');
                      setSortDirection('desc');
                    }
                  }}>
                    Apply Date {sortField === 'applyDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Where Applied</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => {
                    if (sortField === 'response') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('response');
                      setSortDirection('asc');
                    }
                  }}>
                    Response {sortField === 'response' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {applications.length === 0 
                          ? "No job applications yet. Add your first application!"
                          : "No applications match your search criteria."
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app: JobApplication) => {
                    const needsFollowUpAlert = needsFollowUp(app.applyDate, app.response);
                    const isLateAlert = isLateFollowUp(app.applyDate, app.response);
                    const responseTime = calculateResponseTime(app.applyDate, app.responseDate);
                    
                    return (
                      <TableRow 
                        key={app.id} 
                        className={isLateAlert ? 'bg-red-50' : needsFollowUpAlert ? 'bg-orange-50' : ''}
                      >
                        <TableCell>{app.id}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {app.appliedRoles}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            {app.company}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(app.applyDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{app.whereApplied}</TableCell>
                        <TableCell>
                          {(app.locationCity || app.locationCountry) && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {[app.locationCity, app.locationCountry].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getResponseBadge(app.response)}</TableCell>
                        <TableCell>
                          {responseTime !== null ? `${responseTime} days` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingApplication(app);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this application?')) {
                                  deleteMutation.mutate(app.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Application</DialogTitle>
            <DialogDescription>
              Update the details of your job application
            </DialogDescription>
          </DialogHeader>
          {editingApplication && (
            <JobApplicationForm 
              initialData={editingApplication}
              onSubmit={(data) => updateMutation.mutate({ id: editingApplication.id, ...data })}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Job Application Form Component
interface JobApplicationFormProps {
  initialData?: JobApplication;
  onSubmit: (data: InsertJobApplication) => void;
  isLoading: boolean;
}

function JobApplicationForm({ initialData, onSubmit, isLoading }: JobApplicationFormProps) {
  const [formData, setFormData] = useState<Partial<InsertJobApplication>>({
    appliedRoles: initialData?.appliedRoles || "",
    company: initialData?.company || "",
    applyDate: initialData?.applyDate || new Date().toISOString().split('T')[0],
    whereApplied: initialData?.whereApplied || "LinkedIn",
    credentialsUsed: initialData?.credentialsUsed || "",
    commentsInformation: initialData?.commentsInformation || "",
    response: initialData?.response || "No Response",
    responseDate: initialData?.responseDate || "",
    locationCity: initialData?.locationCity || "",
    locationCountry: initialData?.locationCountry || "",
    interviewComments: initialData?.interviewComments || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.appliedRoles || !formData.company || !formData.applyDate) {
      return;
    }

    onSubmit({
      ...formData,
      appliedRoles: formData.appliedRoles!,
      company: formData.company!,
      applyDate: formData.applyDate!,
      whereApplied: formData.whereApplied!,
      response: formData.response!,
    } as InsertJobApplication);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="appliedRoles">Applied Roles *</Label>
          <Input
            id="appliedRoles"
            value={formData.appliedRoles}
            onChange={(e) => setFormData(prev => ({ ...prev, appliedRoles: e.target.value }))}
            placeholder="e.g. Senior Software Engineer"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
            placeholder="e.g. Google"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="applyDate">Apply Date *</Label>
          <Input
            id="applyDate"
            type="date"
            value={formData.applyDate}
            onChange={(e) => setFormData(prev => ({ ...prev, applyDate: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="whereApplied">Where Applied</Label>
          <Select 
            value={formData.whereApplied} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, whereApplied: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
              <SelectItem value="Website">Company Website</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="credentialsUsed">Credentials Used</Label>
        <Input
          id="credentialsUsed"
          value={formData.credentialsUsed || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, credentialsUsed: e.target.value }))}
          placeholder="e.g. Resume v2.1, Portfolio link"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="commentsInformation">Comments / Information</Label>
        <Textarea
          id="commentsInformation"
          value={formData.commentsInformation || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, commentsInformation: e.target.value }))}
          placeholder="Additional notes about this application..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="response">Response</Label>
          <Select 
            value={formData.response} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, response: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="No Response">No Response</SelectItem>
              <SelectItem value="Interview">Interview</SelectItem>
              <SelectItem value="Offer">Offer</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="responseDate">Response Date</Label>
          <Input
            id="responseDate"
            type="date"
            value={formData.responseDate || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, responseDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="locationCity">Location City</Label>
          <Input
            id="locationCity"
            value={formData.locationCity || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, locationCity: e.target.value }))}
            placeholder="e.g. Amsterdam"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="locationCountry">Location Country</Label>
          <Input
            id="locationCountry"
            value={formData.locationCountry || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, locationCountry: e.target.value }))}
            placeholder="e.g. Netherlands"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interviewComments">Interview Comments</Label>
        <Textarea
          id="interviewComments"
          value={formData.interviewComments || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, interviewComments: e.target.value }))}
          placeholder="Notes about interviews, feedback, next steps..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update Application" : "Create Application"}
        </Button>
      </div>
    </form>
  );
}