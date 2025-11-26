import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface ClientProtectedRouteProps {
  children: React.ReactNode;
}

export const ClientProtectedRoute = ({ children }: ClientProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [clientVerified, setClientVerified] = useState(false);

  useEffect(() => {
    verifyClientAccess();
    // Real-time auth changes can be added later
  }, []);

  const verifyClientAccess = async () => {
    try {
      setIsLoading(true);
      const { data: user, error } = await api.getCurrentUser();
      
      if (error || !user) {
        setIsClient(false);
        setClientVerified(false);
        setIsLoading(false);
        return;
      }

      // Check if user has client role
      if (user.role === 'client') {
        setIsClient(true);
        setClientVerified(true);
      } else {
        setIsClient(false);
        setClientVerified(false);
      }
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
