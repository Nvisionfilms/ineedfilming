import { useState, useEffect, useCallback } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { api } from "@/lib/api";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Home, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const INACTIVITY_TIMEOUT = 120 * 60 * 1000; // 2 hours
const WARNING_TIME = 115 * 60 * 1000; // 115 minutes (warn 5 minutes before timeout)

export function AdminLayout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");
  const [hasMFA, setHasMFA] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Session timeout monitoring
  useEffect(() => {
    const resetActivity = () => {
      setLastActivity(Date.now());
      setShowTimeoutWarning(false);
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetActivity);
    });

    // Check for inactivity
    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;

      if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
        // Force logout
        handleSignOut();
        toast({
          title: "Session Expired",
          description: "You've been signed out due to inactivity.",
          variant: "destructive",
        });
      } else if (timeSinceActivity >= WARNING_TIME && !showTimeoutWarning) {
        // Show warning
        setShowTimeoutWarning(true);
        toast({
          title: "Session Expiring Soon",
          description: "Your session will expire in 5 minutes due to inactivity.",
        });
      }
    }, 30000); // Check every 30 seconds

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivity);
      });
      clearInterval(checkInactivity);
    };
  }, [lastActivity, showTimeoutWarning]);

  const checkAuth = async () => {
    const { data: user, error } = await api.getCurrentUser();
    if (session?.user) {
      setUserEmail(session.user.email || "");
      checkMFAStatus();
    }
  };

  const checkMFAStatus = async () => {
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      setHasMFA(data?.totp && data.totp.length > 0);
    } catch (error) {
      console.error("Error checking MFA status:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AdminSidebar userEmail={userEmail} hasMFA={hasMFA} onSignOut={handleSignOut} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 md:h-16 border-b flex items-center px-2 md:px-4 gap-2 md:gap-4">
            <SidebarTrigger />
            <div className="flex-1" />
            
            {/* Session Timeout Warning */}
            {showTimeoutWarning && (
              <Alert className="max-w-xs py-2">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Session expires in 5 min
                </AlertDescription>
              </Alert>
            )}
            
            <Button onClick={() => navigate("/")} variant="outline" size="sm">
              <Home className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Main Site</span>
            </Button>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
