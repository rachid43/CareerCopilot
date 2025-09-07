import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  subscriptionStatus?: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: string;
  accountExpiresAt?: string;
  createdAt?: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth"],
    retry: false,
    queryFn: getQueryFn({ on401: "returnNull" }),
  });


  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}