import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Home, FileText, MessageSquare, Settings, Calendar, Video, FolderOpen, Wallet } from "lucide-react";

export const ClientNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/client/login");
    } catch (error: any) {
      toast.error(`Logout failed: ${error.message}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/client/dashboard", label: "Dashboard", icon: Home },
    { path: "/client/deliverables", label: "Your Episodes", icon: Video },
    { path: "/client/meetings", label: "Meetings", icon: Calendar },
    { path: "/client/files", label: "Files", icon: FolderOpen },
    { path: "/client/messages", label: "Messages", icon: MessageSquare },
    { path: "/client/payment-balance", label: "Payment Balance", icon: Wallet },
    { path: "/client/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="bg-card border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-bold">Your Story Portal</h2>
            
            <div className="hidden md:flex items-center gap-4">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2 pb-3 overflow-x-auto">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
              className="gap-2 whitespace-nowrap"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
};
