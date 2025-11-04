import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Mail, Lock, Eye, EyeOff, UserCircle } from "lucide-react";
import logo from "@/assets/nvlogo.png";
import { MFAChallenge } from "@/components/MFAChallenge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<"admin" | "client">("admin");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(() => {
    // Restore MFA state from sessionStorage on mount (mobile app switch scenario)
    return sessionStorage.getItem('mfa_factor_id');
  });

  // Check if already authenticated
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Check if user has admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (roles) {
        navigate("/admin/bookings");
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed login attempt
        await supabase.from("failed_login_attempts" as any).insert({
          email,
          reason: error.message,
        });

        throw error;
      }

      if (data.user) {
        // Handle client login
        if (loginType === "client") {
          const { data: clientData, error: clientError } = await supabase
            .from("client_accounts")
            .select("*")
            .eq("user_id", data.user.id)
            .single();

          if (clientError || !clientData) {
            await supabase.auth.signOut();
            toast({
              title: "Access Denied",
              description: "Invalid client credentials",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }

          toast({
            title: "Welcome back!",
            description: "Successfully signed in.",
          });
          navigate("/client/dashboard");
          return;
        }

        // Handle admin login with MFA
        const { data: factors } = await supabase.auth.mfa.listFactors();
        
        // Only challenge if there's a verified TOTP factor
        const verifiedFactor = factors?.totp?.find(f => f.status === 'verified');
        
        if (verifiedFactor) {
          // MFA is enabled and verified, show challenge
          // Persist to sessionStorage so state survives mobile app switching
          sessionStorage.setItem('mfa_factor_id', verifiedFactor.id);
          setMfaFactorId(verifiedFactor.id);
          setIsLoading(false);
          return;
        }

        // TEMPORARY: Allow login without 2FA for initial setup
        // TODO: Re-enable 2FA requirement after initial admin setup
        toast({
          title: "Warning: 2FA Not Enabled",
          description: "Please enable 2FA in your account settings for security.",
          variant: "default",
        });
        
        // Continue with login
        await completeSignIn(data.user.id);
        setIsLoading(false);
        return;
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const completeSignIn = async (userId: string) => {
    try {
      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();

      if (roleError || !roles) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        });
        return;
      }

      // Clear MFA state after successful authentication
      sessionStorage.removeItem('mfa_factor_id');
      
      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
      navigate("/admin/bookings");
    } catch (error: any) {
      toast({
        title: "Authorization failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  if (mfaFactorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <MFAChallenge
          factorId={mfaFactorId}
          onSuccess={async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await completeSignIn(user.id);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="NVision Films Logo" className="h-12 w-auto" />
            <span className="text-2xl font-bold">NVision Films</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5" />
            <h1 className="text-xl font-semibold">
              {loginType === "admin" ? "Admin Portal" : "Client Portal"}
            </h1>
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="loginType" className="mb-2">Login As</Label>
          <Select value={loginType} onValueChange={(value: "admin" | "client") => setLoginType(value)}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              <SelectItem value="admin" className="cursor-pointer hover:bg-accent">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </div>
              </SelectItem>
              <SelectItem value="client" className="cursor-pointer hover:bg-accent">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  <span>Client</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@nvisionfilms.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
