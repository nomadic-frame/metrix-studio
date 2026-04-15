import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard";
import NewProduction from "@/pages/new-production";
import ProjectView from "@/pages/project-view";
import CharacterLibrary from "@/pages/character-library";
import PromptLibrary from "@/pages/prompt-library";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/new" component={NewProduction} />
      <Route path="/project/:id" component={ProjectView} />
      <Route path="/characters" component={CharacterLibrary} />
      <Route path="/prompts" component={PromptLibrary} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router hook={useHashLocation}>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground font-mono tracking-wider">METRIX v1.0</span>
                  </div>
                </header>
                <main className="flex-1 overflow-auto">
                  <AppRouter />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
