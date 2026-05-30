import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NearProvider } from "./contexts/NearContext";
import { NavBar } from "./components/NavBar";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Saved from "./pages/Saved";
import PinDetail from "./pages/PinDetail";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/upload" component={Upload} />
      <Route path="/saved" component={Saved} />
      <Route path="/pin/:tokenId" component={PinDetail} />
      <Route path="/settings" component={Settings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <NearProvider>
            <div className="min-h-screen flex flex-col bg-background text-foreground">
              <NavBar />
              <main className="flex-1">
                <Router />
              </main>
            </div>
            <Toaster richColors position="bottom-right" />
          </NearProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
