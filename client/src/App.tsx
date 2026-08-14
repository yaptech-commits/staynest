import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "./_core/hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Home, PropertyPage, BookingPage, AccountPage, HotelDashboard, AdminDashboard, PaymentCompletePage, ConfirmationPage } from "./pages/StayNest";
import Onboarding from "./pages/Onboarding";
import EmailVerification from "./pages/EmailVerification";
import { AuthModal } from "@/components/AuthModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hotel/:id" component={PropertyPage} />
      <Route path="/book" component={BookingPage} />
      <Route path="/booking/complete" component={PaymentCompletePage} />
      <Route path="/confirmation" component={ConfirmationPage} />
      <Route path="/account">
        {() => {
          const { user } = useAuth();
          const [, navigate] = useLocation();
          useEffect(() => {
            if (user?.role === "admin" || user?.role === "superadmin") {
              navigate("/admin", { replace: true });
            }
          }, [user, navigate]);
          if (user?.role === "admin" || user?.role === "superadmin") {
            return null;
          }
          return <AccountPage />;
        }}
      </Route>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/verify-email" component={EmailVerification} />
      <Route path="/hotel-dashboard" component={HotelDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <AuthModal />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
