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
  // Get the stored session and add authorization header if available
  const storedSession = localStorage.getItem('supabase-session');
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (storedSession) {
    try {
      const session = JSON.parse(storedSession);
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Error parsing stored session for auth header:', error);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
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
    
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch (error) {
        console.error('Error parsing stored session for auth header:', error);
      }
    }
    
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
