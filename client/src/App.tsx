import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/i18n";
import { useEffect } from "react";
import Home from "@/pages/home";
import ChatPage from "@/pages/chat";
import { Landing } from "@/pages/landing";
import AdminPanel from "@/pages/admin";
import { AdminDashboard } from "@/pages/admin-dashboard";
import InvitePage from "@/pages/invite";
import { JobApplications } from "@/pages/job-applications";
import MockInterview from "@/pages/mock-interview";
import CheckoutPage from "@/pages/checkout";
import SuccessPage from "@/pages/success";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/invite/:token" component={InvitePage} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/chat" component={ChatPage} />
          <Route path="/job-applications" component={JobApplications} />
          <Route path="/mock-interview" component={MockInterview} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/success" component={SuccessPage} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { language, isRTL } = useLanguage();

  useEffect(() => {
    // Update document attributes for language and direction
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.body.lang = language;
  }, [language, isRTL]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
