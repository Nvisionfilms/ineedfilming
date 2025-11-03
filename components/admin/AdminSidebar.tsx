import { LayoutDashboard, Users, Briefcase, FolderKanban, DollarSign, Settings, LogOut, Shield, Archive, FileVideo, Calendar, FolderOpen, ChevronDown, MessageSquare, Video, Film, Clapperboard } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface AdminSidebarProps {
  userEmail: string;
  hasMFA: boolean;
  onSignOut: () => void;
}

const navGroups = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "Founder Stories",
    collapsible: true,
    items: [
      { title: "Story Requests", url: "/admin/bookings", icon: Video },
      { title: "Pipeline", url: "/admin/pipeline", icon: Clapperboard },
      { title: "Meetings", url: "/admin/meetings", icon: Calendar },
      { title: "Archived", url: "/admin/archived", icon: Archive },
    ]
  },
  {
    title: "Production",
    collapsible: true,
    items: [
      { title: "Founders", url: "/admin/clients", icon: Users },
      { title: "Episodes", url: "/admin/projects", icon: Film },
      { title: "Episode Planner", url: "/admin/episode-planner", icon: Clapperboard },
      { title: "Messages", url: "/admin/messages", icon: MessageSquare },
    ]
  },
  {
    title: "Finance",
    items: [
      { title: "Payments", url: "/admin/payments", icon: DollarSign },
    ]
  },
  {
    title: "System",
    collapsible: true,
    items: [
      { title: "Security", url: "/admin/security", icon: Shield, badge: true },
      { title: "Audit Logs", url: "/admin/audit-logs", icon: Shield },
    ]
  },
];

export function AdminSidebar({ userEmail, hasMFA, onSignOut }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [openGroups, setOpenGroups] = useState<string[]>(["Founder Stories", "Production"]);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(g => g !== title)
        : [...prev, title]
    );
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <div className="p-4 border-b">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-bold">Eric's Studio</h2>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        )}
      </div>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            {group.collapsible ? (
              <Collapsible
                open={openGroups.includes(group.title)}
                onOpenChange={() => toggleGroup(group.title)}
              >
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                    {!collapsed && (
                      <>
                        <span>{group.title}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          openGroups.includes(group.title) && "rotate-180"
                        )} />
                      </>
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} end className={getNavCls}>
                              <item.icon className="h-4 w-4" />
                              {!collapsed && (
                                <>
                                  <span>{item.title}</span>
                                  {item.badge && item.title === "Security" && !hasMFA && (
                                    <Badge variant="destructive" className="ml-auto text-xs">
                                      !
                                    </Badge>
                                  )}
                                </>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                {!collapsed && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end className={getNavCls}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </>
            )}
          </SidebarGroup>
        ))}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onSignOut}>
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sign Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
