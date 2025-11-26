import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Folder, Search, HardDrive, FileText, Building2, User } from "lucide-react";

export default function AdminFiles() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalClients: 0,
    totalFiles: 0,
    totalStorage: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: clientsData } = await supabase
      .from("client_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: projectsData } = await supabase
      .from("projects")
      .select("*");

    const { data: filesData } = await supabase
      .from("project_files")
      .select("project_id, file_size_bytes");

    if (clientsData && projectsData && filesData) {
      // Fetch profiles for each client
      const clientsWithProfiles = await Promise.all(
        clientsData.map(async (client) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", client.user_id)
            .single();

          const project = projectsData.find((p) => p.id === client.project_id);

          return {
            ...client,
            profile,
            project,
          };
        })
      );

      // Calculate file counts per project
      const counts: Record<string, number> = {};
      let totalFiles = 0;
      let totalStorageBytes = 0;

      filesData.forEach((file) => {
        counts[file.project_id] = (counts[file.project_id] || 0) + 1;
        totalFiles++;
        totalStorageBytes += file.file_size_bytes;
      });

      setClients(clientsWithProfiles);
      setProjects(projectsData);
      setFileCounts(counts);
      setStats({
        totalClients: clientsData.length,
        totalFiles,
        totalStorage: totalStorageBytes / (1024 * 1024 * 1024), // Convert to GB
      });
    }
  };

  const filteredClients = clients.filter((client) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.profile?.full_name?.toLowerCase().includes(searchLower) ||
      client.profile?.email?.toLowerCase().includes(searchLower) ||
      client.company_name?.toLowerCase().includes(searchLower) ||
      client.project?.project_name?.toLowerCase().includes(searchLower)
    );
  });

  const getFileCount = (projectId: string | null) => {
    return projectId ? fileCounts[projectId] || 0 : 0;
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">File Management</h1>
        <p className="text-muted-foreground">Manage all client files and storage</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Total Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-green-500" />
              Total Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStorage.toFixed(2)} GB</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name, email, company, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      {/* Clients List */}
      <div className="grid gap-4">
        {filteredClients.map((client) => {
          const fileCount = getFileCount(client.project_id);
          return (
            <Card
              key={client.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/admin/clients/${client.id}/files`)}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{client.profile?.full_name || "No Name"}</div>
                      <div className="text-sm text-muted-foreground">{client.profile?.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    {client.company_name && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        {client.company_name}
                      </div>
                    )}
                    {client.project && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Folder className="w-4 h-4" />
                        {client.project.project_name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {fileCount} {fileCount === 1 ? "file" : "files"}
                    </Badge>
                    <Badge variant={client.status === "active" ? "default" : "secondary"}>
                      {client.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {client.storage_used_gb.toFixed(2)} / {client.storage_limit_gb} GB
                    </span>
                  </div>
                </div>

                <Button variant="ghost">
                  <Folder className="w-4 h-4 mr-2" />
                  View Files
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            {searchQuery ? "No clients match your search." : "No client files yet."}
          </p>
        </Card>
      )}
    </div>
  );
}
