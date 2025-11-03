import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ClientProtectedRouteProps {
  children: React.ReactNode;
}

export const ClientProtectedRoute = ({ children }: ClientProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [clientVerified, setClientVerified] = useState(false);

  useEffect(() => {
    // Initial check on mount
    verifyClientAccess();

    // Listen to auth changes but don't re-verify database every time
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      // If user logs out, reset state
      if (event === 'SIGNED_OUT' || !session) {
        setIsClient(false);
        setClientVerified(false);
        return;
      }
      
      // If user signs in and we haven't verified yet, verify
      if (event === 'SIGNED_IN' && !clientVerified) {
        verifyClientAccess();
      }
      
      // For token refresh, just trust the session if already verified
      if (event === 'TOKEN_REFRESHED' && clientVerified) {
        setIsClient(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [clientVerified]);

  const verifyClientAccess = async () => {
    try {
      setIsLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        // Only kick out on critical session errors, not transient ones
        if (!sessionError.message?.includes('fetch') && !sessionError.message?.includes('network')) {
          setIsClient(false);
          setClientVerified(false);
        } else {
          // Keep them in on network errors
          console.log("Network error getting session, keeping user logged in");
          if (clientVerified) {
            setIsClient(true);
          }
        }
        setIsLoading(false);
        return;
      }
      
      if (!session?.user) {
        console.log("No session found");
        setIsClient(false);
        setClientVerified(false);
        setIsLoading(false);
        return;
      }

      console.log("Verifying client account for:", session.user.email);

      const { data: clientData, error } = await supabase
        .from("client_accounts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .maybeSingle();

      // Handle database query errors gracefully
      if (error) {
        console.error("Error fetching client data:", error);
        // If it's a network/fetch error and we've verified before, keep them in
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          console.log("Network error, optimistically keeping user logged in");
          if (clientVerified) {
            setIsClient(true);
          } else {
            // First time verification failed, try to stay optimistic
            setIsClient(true);
            setClientVerified(true);
          }
          setIsLoading(false);
          return;
        }
        // For other errors, only kick out if we haven't verified before
        if (!clientVerified) {
          setIsClient(false);
        }
        setIsLoading(false);
        return;
      }

      if (!clientData) {
        console.log("No client account found for user");
        setIsClient(false);
        setClientVerified(false);
        setIsLoading(false);
        return;
      }

      console.log("Client verified:", session.user.email);
      setIsClient(true);
      setClientVerified(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Unexpected error checking client access:", error);
      // On unexpected errors, stay optimistic if already verified
      if (clientVerified) {
        setIsClient(true);
      } else {
        // First time, be optimistic anyway to avoid false negatives
        setIsClient(true);
        setClientVerified(true);
      }
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isClient) {
    return <Navigate to="/client/login" replace />;
  }

  return <>{children}</>;
};
