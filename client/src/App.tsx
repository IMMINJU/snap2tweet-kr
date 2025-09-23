import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Results from "@/pages/results";
import Shared from "@/pages/shared";
import NotFound from "@/pages/not-found";

function Router() {
  const [location, setLocation] = useLocation();

  // Handle development redirect from /shared/:id
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    if (shareId && location === '/') {
      // Clear the URL parameter and navigate to shared route
      window.history.replaceState({}, '', window.location.pathname);
      setLocation(`/shared/${shareId}`);
    }
  }, [location, setLocation]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/results" component={Results} />
      <Route path="/shared/:id" component={Shared} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
