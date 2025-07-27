import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Mail, 
  UserPlus, 
  Shield, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { User, UserInvitation } from "@shared/schema";

export default function AdminPanel() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [batchEmails, setBatchEmails] = useState<string[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch active invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<UserInvitation[]>({
    queryKey: ["/api/admin/invitations"],
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (email: string) => {
      return await fetch("/api/admin/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The invitation email has been sent successfully.",
      });
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, isActive, accountExpiresAt }: { 
      id: number; 
      isActive: boolean; 
      accountExpiresAt?: string 
    }) => {
      return await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive, accountExpiresAt }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User account has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    sendInvitationMutation.mutate(inviteEmail.trim());
  };

  const handleToggleUserStatus = (user: User) => {
    updateUserMutation.mutate({
      id: user.id,
      isActive: !user.isActive,
      accountExpiresAt: user.accountExpiresAt?.toISOString(),
    });
  };

  const extendUserAccount = (user: User, days: number) => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);
    
    updateUserMutation.mutate({
      id: user.id,
      isActive: true,
      accountExpiresAt: newExpiry.toISOString(),
    });
  };

  const getUserStatus = (user: User) => {
    if (!user.isActive) return { status: "inactive", color: "secondary" as const };
    if (user.accountExpiresAt && new Date() > new Date(user.accountExpiresAt)) {
      return { status: "expired", color: "destructive" as const };
    }
    return { status: "active", color: "default" as const };
  };

  // File processing functions
  const processFile = (file: File) => {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (fileExtension === 'csv') {
      processCsvFile(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      processExcelFile(file);
    } else {
      toast({
        title: "Unsupported file format",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive",
      });
    }
  };

  const processCsvFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const emails = extractEmailsFromData(results.data);
        setBatchEmails(emails);
        toast({
          title: "CSV file processed",
          description: `Found ${emails.length} email addresses.`,
        });
      },
      error: (error) => {
        toast({
          title: "Error processing CSV",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const emails = extractEmailsFromData(jsonData);
        setBatchEmails(emails);
        toast({
          title: "Excel file processed",
          description: `Found ${emails.length} email addresses.`,
        });
      } catch (error) {
        toast({
          title: "Error processing Excel file",
          description: "Please check the file format and try again.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const extractEmailsFromData = (data: any[]): string[] => {
    const emails: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    data.forEach((row: any) => {
      Object.values(row).forEach((value: any) => {
        if (typeof value === 'string' && emailRegex.test(value.trim())) {
          const email = value.trim().toLowerCase();
          if (!emails.includes(email)) {
            emails.push(email);
          }
        }
      });
    });
    
    return emails;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const sendBatchInvitations = async () => {
    if (batchEmails.length === 0) return;
    
    setIsProcessingBatch(true);
    let successCount = 0;
    let errorCount = 0;
    
    for (const email of batchEmails) {
      try {
        await fetch("/api/admin/invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }
    
    setIsProcessingBatch(false);
    setBatchEmails([]);
    
    toast({
      title: "Batch invitations completed",
      description: `Successfully sent: ${successCount}, Failed: ${errorCount}`,
    });
    
    queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="h-8 w-8 text-[#F08A5D]" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invitations ({invitations.length})
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Send Invite
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, activate/deactivate access, and extend account validity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F08A5D]"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => {
                    const userStatus = getUserStatus(user);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.username}
                            </span>
                            <Badge variant={userStatus.color}>
                              {userStatus.status}
                            </Badge>
                            {user.role === 'superadmin' && (
                              <Badge variant="outline" className="border-[#F08A5D] text-[#F08A5D]">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.accountExpiresAt && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Expires: {format(new Date(user.accountExpiresAt), "MMM dd, yyyy")}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {user.role !== 'superadmin' && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={user.isActive}
                                  onCheckedChange={() => handleToggleUserStatus(user)}
                                  disabled={updateUserMutation.isPending}
                                />
                                <Label className="text-sm">
                                  {user.isActive ? "Active" : "Inactive"}
                                </Label>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => extendUserAccount(user, 30)}
                                disabled={updateUserMutation.isPending}
                              >
                                Extend 30 days
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Invitations</CardTitle>
              <CardDescription>
                View pending invitations sent to new users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F08A5D]"></div>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active invitations
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{invitation.email}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires: {format(new Date(invitation.expiresAt), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {invitation.isUsed ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Used
                          </Badge>
                        ) : new Date() > new Date(invitation.expiresAt) ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite" className="space-y-4">
          {/* Single Invitation Card */}
          <Card>
            <CardHeader>
              <CardTitle>Send Single Invitation</CardTitle>
              <CardDescription>
                Send an invitation email to a new user to create their account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    The user will receive an email with instructions to create their account.
                    The invitation will be valid for 30 days.
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={sendInvitationMutation.isPending || !inviteEmail.trim()}
                  className="bg-[#F08A5D] hover:bg-[#E07B52]"
                >
                  {sendInvitationMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Batch Invitation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Batch Invitations
              </CardTitle>
              <CardDescription>
                Upload a CSV or Excel file containing email addresses to send multiple invitations at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Section */}
              <div>
                <Label htmlFor="file-upload">Upload File</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-start"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose CSV or Excel File
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  The file should contain email addresses in any column. Duplicate emails will be automatically removed.
                </p>
              </div>

              {/* Email Preview Section */}
              {batchEmails.length > 0 && (
                <div className="space-y-2">
                  <Label>Found Email Addresses ({batchEmails.length})</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-3 bg-gray-50">
                    <div className="space-y-1">
                      {batchEmails.map((email, index) => (
                        <div key={index} className="text-sm font-mono">
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={sendBatchInvitations}
                      disabled={isProcessingBatch}
                      className="bg-[#F08A5D] hover:bg-[#E07B52]"
                    >
                      {isProcessingBatch ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending {batchEmails.length} Invitations...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send {batchEmails.length} Invitations
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setBatchEmails([])}
                      disabled={isProcessingBatch}
                    >
                      Clear List
                    </Button>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">File Format Instructions:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• CSV files: Email addresses can be in any column with any header name</li>
                  <li>• Excel files: Email addresses can be in any cell in the first worksheet</li>
                  <li>• The system will automatically detect and extract valid email addresses</li>
                  <li>• Duplicate emails will be removed automatically</li>
                  <li>• Each invitation will be sent individually with a 30-day validity period</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}