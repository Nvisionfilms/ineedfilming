import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
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
  const [rememberMe, setRememberMe] = useState(false);
  const [loginType, setLoginType] = useState<"admin" | "client">("admin");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  // Check if already authenticated and load saved email
  useEffect(() => {
    checkAuth();
    const savedEmail = localStorage.getItem('admin_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const response = await api.getCurrentUser();
      if (response.data?.role === 'admin') {
        navigate("/admin/bookings");
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save or clear email based on remember me checkbox
      if (rememberMe) {
        localStorage.setItem('admin_remembered_email', email);
      } else {
        localStorage.removeItem('admin_remembered_email');
      }

      const response = await api.login(email, password);

      if (response.error) {
        throw new Error(response.error);
      }

      // Check if MFA is required
      if (response.data?.mfaRequired) {
        setMfaRequired(true);
        setTempToken(response.data.token);
        setIsLoading(false);
        return;
      }

      // Check user role
      const userResponse = await api.getCurrentUser();
      if (userResponse.error) {
        throw new Error(userResponse.error);
      }

      const userRole = userResponse.data?.role;

      // Handle client login
      if (loginType === "client" && userRole !== "client") {
        api.clearToken();
        toast({
          title: "Access Denied",
          description: "Invalid client credentials",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Handle admin login
      if (loginType === "admin" && userRole !== "admin") {
        api.clearToken();
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });

      if (loginType === "client") {
        navigate("/client/dashboard");
      } else {
        navigate("/admin/bookings");
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

  const handleMFAVerify = async (token: string) => {
    try {
      const response = await api.verifyMFALogin(token);
      
      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
      
      if (loginType === "client") {
        navigate("/client/dashboard");
      } else {
        navigate("/admin/bookings");
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <MFAChallenge
          onSuccess={handleMFAVerify}
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={isLoading}
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal cursor-pointer"
            >
              Remember my email
            </Label>
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
