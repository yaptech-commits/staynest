import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Home, PropertyPage, BookingPage, AccountPage, HotelDashboard, AdminDashboard, PaymentCompletePage, ConfirmationPage } from "./pages/StayNest";
import Onboarding from "./pages/Onboarding";
import EmailVerification from "./pages/EmailVerification";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hotel/:id" component={PropertyPage} />
      <Route path="/book" component={BookingPage} />
      <Route path="/booking/complete" component={PaymentCompletePage} />
      <Route path="/confirmation" component={ConfirmationPage} />
      <Route path="/account" component={AccountPage} />
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
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
