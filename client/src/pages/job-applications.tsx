import { useState, useEffect, useRef } from "react";
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
import { Plus, Edit2, Trash2, Download, Upload, Search, Filter, Calendar, Building, MapPin, Eye, FileSpreadsheet, ChevronDown, TrashIcon, Home, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n";
import * as XLSX from 'xlsx';
import type { JobApplication, InsertJobApplication } from "@shared/schema";
import careerCopilotIcon from "@assets/ICON_CareerCopilot_1755719130597.png";
import { LanguageSelector } from "@/components/language-selector";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

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
  const { user } = useAuth();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResponse, setFilterResponse] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof JobApplication>("applyDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Export to CSV/Excel
  const exportData = (format: 'csv' | 'xlsx') => {
    if (applications.length === 0) {
      toast({
        title: "No Data",
        description: "No job applications to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "ID", "Applied Roles", "Company", "Apply Date", "Where Applied", 
      "Credentials Used", "Comments", "Response", "Response Date", 
      "Location City", "Location Country", "Response Time (Days)", "Interview Comments"
    ];
    
    const data = (applications as JobApplication[]).map((app: JobApplication) => [
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

    const exportedData = [headers, ...data];
    const filename = `job-applications-${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      const csvContent = exportedData
        .map(row => row.map(field => `"${field}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.aoa_to_sheet(exportedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Job Applications");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }

    toast({
      title: "Export Successful",
      description: `Exported ${applications.length} job applications to ${format.toUpperCase()}.`,
    });
  };

  const clearAllApplications = () => {
    if (applications.length === 0) {
      toast({
        title: "No Data",
        description: "No job applications to clear.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${applications.length} job applications? This action cannot be undone.`
    );

    if (confirmed) {
      // Delete all applications one by one
      applications.forEach(app => {
        deleteMutation.mutate(app.id);
      });

      toast({
        title: "All Applications Cleared",
        description: `Successfully deleted ${applications.length} job applications.`,
      });
    }
  };

  // Import from CSV/Excel
  const handleFileImport = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let jsonData: any[][] = [];

        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          // Parse CSV
          const text = data as string;
          const lines = text.split('\n').filter(line => line.trim());
          jsonData = lines.map(line => {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim().replace(/^"|"$/g, ''));
            return result.filter(cell => cell !== ''); // Remove empty cells
          }).filter(row => row.length > 1); // Filter out empty rows
        } else {
          // Parse Excel
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        }

        if (jsonData.length < 2) {
          toast({
            title: "Import Error",
            description: "File appears to be empty or has no data rows.",
            variant: "destructive",
          });
          return;
        }

        // Skip header row and process data with intelligent column mapping
        const headers = jsonData[0].map((h: string) => h?.toLowerCase().trim() || '');
        const dataRows = jsonData.slice(1);
        
        // Helper function to convert Excel date number to proper date string
        const convertExcelDate = (excelDate: any): string => {
          if (!excelDate) return new Date().toISOString().split('T')[0];
          
          // If it's already a proper date string, return as is
          if (typeof excelDate === 'string' && excelDate.includes('-')) {
            return excelDate;
          }
          
          // If it's an Excel date number (days since 1900-01-01)
          if (typeof excelDate === 'number' || !isNaN(Number(excelDate))) {
            const excelEpoch = new Date(1900, 0, 1);
            const daysOffset = Number(excelDate) - 2; // Excel has a leap year bug for 1900
            const convertedDate = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
            return convertedDate.toISOString().split('T')[0];
          }
          
          // Try to parse as date
          const parsed = new Date(excelDate);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
          
          return new Date().toISOString().split('T')[0];
        };
        
        console.log('Headers found:', headers);
        console.log('First 3 data rows:', dataRows.slice(0, 3));
        
        // Debug header mapping
        console.log('Header index mapping:');
        headers.forEach((header, index) => {
          console.log(`Index ${index}: "${header}"`);
        });
        
        const importedApplications = dataRows.map(row => {
          // Smart column mapping based on header names - try exact matches first, then partial matches
          const getValueByHeaders = (searchTerms: string[]) => {
            // First try exact matches
            for (const term of searchTerms) {
              const exactIndex = headers.findIndex(h => h === term.toLowerCase());
              if (exactIndex !== -1) {
                const value = row[exactIndex];
                if (value !== undefined && value !== null && value !== '') {
                  return String(value).trim();
                }
              }
            }
            // Then try partial matches
            for (const term of searchTerms) {
              const partialIndex = headers.findIndex(h => h.includes(term.toLowerCase()));
              if (partialIndex !== -1) {
                const value = row[partialIndex];
                if (value !== undefined && value !== null && value !== '') {
                  return String(value).trim();
                }
              }
            }
            return null; // Return null instead of empty string to distinguish from empty values
          };

          // Get date values with proper conversion
          const getDateByHeaders = (searchTerms: string[]) => {
            // First try exact matches
            for (const term of searchTerms) {
              const exactIndex = headers.findIndex(h => h === term.toLowerCase());
              if (exactIndex !== -1) {
                const value = row[exactIndex];
                if (value !== undefined && value !== null && value !== '') {
                  return convertExcelDate(value);
                }
              }
            }
            // Then try partial matches
            for (const term of searchTerms) {
              const partialIndex = headers.findIndex(h => h.includes(term.toLowerCase()));
              if (partialIndex !== -1) {
                const value = row[partialIndex];
                if (value !== undefined && value !== null && value !== '') {
                  return convertExcelDate(value);
                }
              }
            }
            return '';
          };

          const rawApplyDate = getDateByHeaders(['applydate', 'apply date', 'date applied', 'applied date', 'date', 'applied', 'apply']) || row[3];
          const rawResponseDate = getDateByHeaders(['responsedate', 'response date', 'reply date', 'date response']) || row[8];

          // Debug field mapping for first row
          if (dataRows.indexOf(row) === 0) {
            console.log('Field mapping for first row:');
            console.log('credentialsUsed from header search:', getValueByHeaders(['credentialsused', 'credentials used', 'credentials', 'login', 'account']));
            console.log('credentialsUsed from row[5]:', row[5]);
            console.log('commentsInformation from header search:', getValueByHeaders(['comments-information', 'comments information', 'comments', 'comment', 'notes', 'note', 'information']));
            console.log('commentsInformation from row[6]:', row[6]);
            console.log('whereApplied from header search:', getValueByHeaders(['where applied', 'where', 'source', 'platform', 'site', 'applied via']));
            console.log('whereApplied from row[4]:', row[4]);
          }

          // Use direct column access with proper null handling
          const credentialsFromHeader = getValueByHeaders(['credentialsused', 'credentials used', 'credentials', 'login', 'account']);
          const commentsFromHeader = getValueByHeaders(['comments-information', 'comments information', 'comments', 'comment', 'notes', 'note', 'information']);
          const interviewFromHeader = getValueByHeaders(['interviewcomments', 'interview comments', 'interview', 'feedback', 'interview notes']);
          
          const application: Partial<InsertJobApplication> = {
            appliedRoles: getValueByHeaders(['applied roles', 'role', 'position', 'job title', 'job', 'title']) || String(row[1] || ""),
            company: getValueByHeaders(['company', 'employer', 'organization']) || String(row[2] || ""),
            applyDate: rawApplyDate ? convertExcelDate(rawApplyDate) : new Date().toISOString().split('T')[0],
            whereApplied: getValueByHeaders(['where applied', 'where', 'source', 'platform', 'site', 'applied via']) || String(row[4] || ""),
            credentialsUsed: credentialsFromHeader !== null ? credentialsFromHeader : (row[5] !== null && row[5] !== undefined ? String(row[5]) : ""),
            commentsInformation: commentsFromHeader !== null ? commentsFromHeader : (row[6] !== null && row[6] !== undefined ? String(row[6]) : ""),
            response: getValueByHeaders(['response', 'status', 'result', 'outcome']) || String(row[7] || "No Response"),
            responseDate: rawResponseDate ? convertExcelDate(rawResponseDate) : "",
            locationCity: getValueByHeaders(['locationcity', 'location city', 'city', 'location']) || String(row[9] || ""),
            locationCountry: getValueByHeaders(['locationcountry', 'location country', 'country']) || String(row[10] || ""),
            interviewComments: interviewFromHeader !== null ? interviewFromHeader : (row[12] !== null && row[12] !== undefined ? String(row[12]) : "")
          };

          // Validate required fields
          if (!application.appliedRoles || !application.company) {
            return null;
          }

          // Map response status according to user requirements
          if (application.response) {
            const responseMap: { [key: string]: string } = {
              'on going': 'Open',
              'ongoing': 'Open',
              'negatif': 'Rejected',
              'negative': 'Rejected',
              'under interview': 'Under Interview',
              'interview': 'Under Interview',
              'no response': 'No Response',
              'declined': 'WithDrawn',
              'rejected': 'WithDrawn',
              'withdraw': 'WithDrawn',
              'withdrawn': 'WithDrawn'
            };
            
            const normalizedResponse = application.response.toLowerCase().trim();
            application.response = responseMap[normalizedResponse] || application.response;
          }

          // For whereApplied, try to map to known platforms but preserve original text if no match
          if (application.whereApplied) {
            const sourceMap: { [key: string]: string } = {
              'linkedin': 'LinkedIn',
              'indeed': 'Indeed',
              'website': 'Company Website',
              'company website': 'Company Website',
              'company site': 'Company Website',
              'direct': 'Company Website',
              'referral': 'Referral',
              'reference': 'Referral'
            };
            
            const normalizedSource = application.whereApplied.toLowerCase().trim();
            // Only map if we have an exact match, otherwise preserve original text
            if (sourceMap[normalizedSource]) {
              application.whereApplied = sourceMap[normalizedSource];
            }
            // Keep the original text for things like "site nike", "site CCE", etc.
          } else {
            application.whereApplied = "Other";
          }

          return application;
        }).filter(Boolean) as InsertJobApplication[];

        if (importedApplications.length === 0) {
          toast({
            title: "Import Error",
            description: "No valid applications found. Please ensure your file has 'Applied Roles' and 'Company' columns.",
            variant: "destructive",
          });
          return;
        }

        console.log(`Parsed ${importedApplications.length} applications from file:`, importedApplications.slice(0, 3));

        // Batch create applications
        importApplications(importedApplications);
        
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Import Error",
          description: "Failed to parse the file. Please check the format and try again.",
          variant: "destructive",
        });
      }
    };

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsImportModalOpen(false);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  // Batch import applications
  const importApplications = async (importData: InsertJobApplication[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const application of importData) {
        try {
          // Clean up the application data before sending
          const cleanApplication: InsertJobApplication = {
            userId: 1, // This will be set by the authenticated user in the backend
            appliedRoles: application.appliedRoles?.trim() || "",
            company: application.company?.trim() || "",
            applyDate: application.applyDate || new Date().toISOString().split('T')[0],
            whereApplied: application.whereApplied || "Other",
            credentialsUsed: application.credentialsUsed?.trim() || "",
            commentsInformation: application.commentsInformation?.trim() || "",
            response: application.response || "No Response",
            responseDate: application.responseDate?.trim() || "",
            locationCity: application.locationCity?.trim() || "",
            locationCountry: application.locationCountry?.trim() || "",
            interviewComments: application.interviewComments?.trim() || ""
          };

          await createMutation.mutateAsync(cleanApplication);
          successCount++;
        } catch (error: any) {
          errorCount++;
          const errorMsg = error?.response?.data?.message || error?.message || 'Unknown error';
          errors.push(`${application.company}: ${errorMsg}`);
          console.error('Failed to import application:', application, error);
        }
      }

      if (errors.length > 0 && errors.length < 5) {
        console.log('Import errors:', errors);
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} of ${importData.length} applications. ${errorCount > 0 ? `${errorCount} failed due to validation errors.` : ''}`,
        variant: successCount > 0 ? "default" : "destructive",
      });

    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import applications. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Response badge styling
  const getResponseBadge = (response: string) => {
    const variants: Record<string, string> = {
      "Offer": "bg-green-500 text-white",
      "accepted": "bg-green-500 text-white",
      "Accepted": "bg-green-500 text-white",
      "Interview": "bg-blue-500 text-white", 
      "Under Interview": "bg-indigo-500 text-white",
      "Open": "bg-yellow-500 text-black",
      "Rejected": "bg-red-500 text-white",
      "WithDrawn": "bg-orange-500 text-white",
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
    <div className="min-h-screen bg-neutral-50">
      {/* Consistent Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src={careerCopilotIcon} 
                alt="CareerCopilot" 
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-xl font-bold text-neutral-900">
                  Career<span className="text-primary">Copilot</span>
                </h1>
                <p className="text-sm text-gray-500">Job Applications Tracker</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2 mr-4">
                  <User size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {String((user as any)?.firstName || (user as any)?.email || (user as any)?.username || 'User')}
                  </span>
                </div>
              )}
              <LanguageSelector />
              <Link to="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Home size={16} />
                  <span>Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Job Applications Tracker</h1>
            <p className="text-muted-foreground">Track and manage your job applications</p>
          </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportData('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData('xlsx')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={clearAllApplications} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <TrashIcon className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Job Applications</DialogTitle>
                <DialogDescription>
                  Upload a CSV or Excel file with your job applications. The file should have columns for: Applied Roles, Company, Apply Date, Where Applied, etc.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="import-file">Select File</Label>
                  <div className="space-y-4">
                    <Input
                      id="import-file"
                      type="file"
                      ref={fileInputRef}
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileInputChange}
                      className="cursor-pointer"
                    />
                    <div 
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-primary');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-primary');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-primary');
                        const files = Array.from(e.dataTransfer.files);
                        const file = files[0];
                        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                          handleFileImport(file);
                        } else {
                          toast({
                            title: "Invalid File",
                            description: "Please upload a CSV or Excel file.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop your CSV or Excel file here, or use the file input above
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Expected columns:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Applied Roles (required)</li>
                    <li>Company (required)</li>
                    <li>Apply Date</li>
                    <li>Where Applied</li>
                    <li>Credentials Used</li>
                    <li>Comments</li>
                    <li>Response</li>
                    <li>Response Date</li>
                    <li>Location City</li>
                    <li>Location Country</li>
                    <li>Interview Comments</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Under Interview">Under Interview</SelectItem>
                <SelectItem value="Interview">Interview</SelectItem>
                <SelectItem value="Offer">Offer</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="WithDrawn">WithDrawn</SelectItem>
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
                  <TableHead>Credentials</TableHead>
                  <TableHead>Comments</TableHead>
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
                  <TableHead>Interview Notes</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead className="w-[100px] sticky right-0 bg-background">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
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
                        <TableCell className="max-w-[120px] truncate">
                          {app.credentialsUsed || '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {app.commentsInformation || '-'}
                        </TableCell>
                        <TableCell>
                          {(app.locationCity || app.locationCountry) && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {[app.locationCity, app.locationCountry].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getResponseBadge(app.response)}</TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {app.interviewComments || '-'}
                        </TableCell>
                        <TableCell>
                          {responseTime !== null ? `${responseTime} days` : '-'}
                        </TableCell>
                        <TableCell className="w-[100px] sticky right-0 bg-background">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingApplication(app);
                                setIsEditModalOpen(true);
                              }}
                              title="Edit Application"
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
                              title="Delete Application"
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
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Under Interview">Under Interview</SelectItem>
              <SelectItem value="Interview">Interview</SelectItem>
              <SelectItem value="Offer">Offer</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="WithDrawn">WithDrawn</SelectItem>
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