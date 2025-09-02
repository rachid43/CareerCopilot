import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Mail, Users, UserCheck, UserX, Calendar, Send, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  subscriptionStatus: string;
  subscriptionExpiresAt: string;
  accountExpiresAt: string;
  createdAt: string;
}

interface Invitation {
  id: number;
  email: string;
  token: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState('');

  // Check if user is superadmin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'superadmin')) {
      toast({
        title: "Access Denied",
        description: "You need superadmin privileges to access this page.",
        variant: "destructive",
      });
      setLocation('/');
    }
  }, [user, isLoading, setLocation, toast]);

  const { data: users = [], refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: user?.role === 'superadmin',
  });

  const { data: invitations = [], refetch: refetchInvitations } = useQuery<Invitation[]>({
    queryKey: ['/api/admin/invitations'],
    enabled: user?.role === 'superadmin',
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, subscriptionStatus, subscriptionExpiresAt }: {
      userId: number;
      subscriptionStatus: string;
      subscriptionExpiresAt?: string;
    }) => {
      return apiRequest('PUT', `/api/admin/users/${userId}/subscription`, {
        subscriptionStatus,
        subscriptionExpiresAt
      });
    },
    onSuccess: () => {
      refetchUsers();
      toast({
        title: "Subscription Updated",
        description: "User subscription status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update subscription status.",
        variant: "destructive",
      });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive, accountExpiresAt }: {
      userId: number;
      isActive: boolean;
      accountExpiresAt?: string;
    }) => {
      return apiRequest('PUT', `/api/admin/users/${userId}/status`, {
        isActive,
        accountExpiresAt
      });
    },
    onSuccess: () => {
      refetchUsers();
      toast({
        title: "User Status Updated",
        description: "User status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('POST', '/api/admin/invitations', { email });
    },
    onSuccess: () => {
      setNewUserEmail('');
      refetchInvitations();
      toast({
        title: "Invitation Sent",
        description: "User invitation has been sent successfully with 12-month subscription.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to send invitation.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateSubscription = (userId: number, subscriptionStatus: string) => {
    let subscriptionExpiresAt = undefined;
    
    if (subscriptionStatus === 'active') {
      // Set 12 months from now for active subscriptions
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      subscriptionExpiresAt = expiryDate.toISOString();
    }
    
    updateSubscriptionMutation.mutate({ userId, subscriptionStatus, subscriptionExpiresAt });
  };

  const handleUpdateSubscriptionDate = (userId: number, newDate: string) => {
    updateSubscriptionMutation.mutate({ 
      userId, 
      subscriptionStatus: 'active', 
      subscriptionExpiresAt: new Date(newDate).toISOString() 
    });
  };

  const handleExtendSubscription = (userId: number, months: number) => {
    const currentUser = users.find(u => u.id === userId);
    const currentExpiry = currentUser?.subscriptionExpiresAt ? new Date(currentUser.subscriptionExpiresAt) : new Date();
    
    // If current expiry is in the past, start from today
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months);
    
    updateSubscriptionMutation.mutate({ 
      userId, 
      subscriptionStatus: 'active', 
      subscriptionExpiresAt: newExpiry.toISOString() 
    });
  };

  const handleToggleUserStatus = (userId: number, currentStatus: boolean) => {
    updateUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== 'superadmin') {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage users, subscriptions, and send invitations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-medium">Super Administrator</span>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Users ({users.length})</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Invitations ({invitations.length})</span>
          </TabsTrigger>
          <TabsTrigger value="send-invite" className="flex items-center space-x-2">
            <Send className="w-4 h-4" />
            <span>Send Invite</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, subscriptions (default 12 months), and access status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((userData: User) => (
                  <div key={userData.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{userData.firstName} {userData.lastName}</h3>
                          {userData.role === 'superadmin' && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              Superadmin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{userData.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined: {formatDate(userData.createdAt || '')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant={userData.isActive ? "destructive" : "default"}
                          onClick={() => handleToggleUserStatus(userData.id, userData.isActive)}
                          data-testid={`button-toggle-status-${userData.id}`}
                        >
                          {userData.isActive ? (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Subscription Status</Label>
                        <div className="mt-1">
                          <Badge className={getSubscriptionStatusColor(userData.subscriptionStatus || 'active')}>
                            {userData.subscriptionStatus || 'active'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Subscription Expires</Label>
                        <p className="text-sm mt-1">{formatDate(userData.subscriptionExpiresAt || '')}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Account Status</Label>
                        <p className="text-sm mt-1">
                          {userData.isActive ? (
                            <span className="text-green-600">Active</span>
                          ) : (
                            <span className="text-red-600">Inactive</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm font-medium">Change Subscription:</Label>
                        <Select 
                          onValueChange={(value) => handleUpdateSubscription(userData.id, value)}
                          data-testid={`select-subscription-${userData.id}`}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="hold">Hold</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm font-medium">Subscription Expires:</Label>
                        <Input
                          type="date"
                          defaultValue={userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt).toISOString().split('T')[0] : ''}
                          className="w-40"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleUpdateSubscriptionDate(userData.id, e.target.value);
                            }
                          }}
                          data-testid={`input-subscription-date-${userData.id}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExtendSubscription(userData.id, 12)}
                          data-testid={`button-extend-12months-${userData.id}`}
                        >
                          +12 months
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Invitations</CardTitle>
              <CardDescription>
                View pending user invitations with 12-month subscription included
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active invitations</p>
                ) : (
                  invitations.map((invitation: Invitation) => (
                    <div key={invitation.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-gray-600">
                            Sent: {formatDate(invitation.createdAt)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Expires: {formatDate(invitation.expiresAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <Badge variant="outline">
                            {invitation.isUsed ? 'Used' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Invite Tab */}
        <TabsContent value="send-invite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send User Invitation</CardTitle>
              <CardDescription>
                Send an invitation to a new user with automatic 12-month subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    data-testid="input-new-user-email"
                  />
                </div>
                <Button
                  onClick={() => sendInvitationMutation.mutate(newUserEmail)}
                  disabled={!newUserEmail || sendInvitationMutation.isPending}
                  className="w-full"
                  data-testid="button-send-invitation"
                >
                  {sendInvitationMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invitation (12-month subscription)
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-600">
                  The user will receive an email with a link to join Career<span className="text-orange-500 font-semibold">Copilot</span> 
                  and will automatically get a 12-month subscription.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}