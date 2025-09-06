import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the stored session and add authorization header if available
    const storedSession = localStorage.getItem('supabase-session');
    const headers: Record<string, string> = {};
    
    console.log('🔑 Debug - Stored session:', storedSession ? 'EXISTS' : 'NULL');
    
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        console.log('🔑 Debug - Parsed session keys:', Object.keys(session || {}));
        
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
          console.log('🔑 Debug - Added Bearer token, length:', session.access_token.length);
        } else {
          console.log('🔑 Debug - No access_token in session');
        }
      } catch (error) {
        console.error('Error parsing stored session for auth header:', error);
      }
    }
    
    console.log('🔑 Debug - Final headers:', headers);
    
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
