import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Shield, Search, Filter, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    // TODO: Add audit logs endpoint to Railway API
    const data: any[] = [];
    const error = null;

    if (!error && data) {
      setLogs(data);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.admin_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesTable = tableFilter === "all" || log.table_name === tableFilter;

    return matchesSearch && matchesAction && matchesTable;
  });

  const uniqueTables = Array.from(new Set(logs.map((log) => log.table_name)));

  const getActionBadge = (action: string) => {
    const variants = {
      SELECT: "secondary",
      INSERT: "default",
      UPDATE: "outline",
      DELETE: "destructive",
      EXPORT: "default",
    } as const;

    return (
      <Badge variant={variants[action as keyof typeof variants] || "secondary"}>
        {action}
      </Badge>
    );
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Track all admin access to customer data</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Events</p>
          <p className="text-2xl font-bold">{logs.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Today</p>
          <p className="text-2xl font-bold">
            {logs.filter((l) => new Date(l.accessed_at).toDateString() === new Date().toDateString()).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Updates</p>
          <p className="text-2xl font-bold text-orange-600">
            {logs.filter((l) => l.action === "UPDATE").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Deletions</p>
          <p className="text-2xl font-bold text-red-600">
            {logs.filter((l) => l.action === "DELETE").length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search" className="mb-2 flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Label>
            <Input
              id="search"
              placeholder="Email, table, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="actionFilter" className="mb-2 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Action
            </Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger id="actionFilter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="SELECT">SELECT</SelectItem>
                <SelectItem value="INSERT">INSERT</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="EXPORT">EXPORT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tableFilter" className="mb-2 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Table
            </Label>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger id="tableFilter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {uniqueTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Logs List */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <Card className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">No audit logs found.</p>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getActionBadge(log.action)}
                    <span className="font-semibold">{log.admin_email}</span>
                    <span className="text-sm text-muted-foreground">→</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{log.table_name}</code>
                  </div>
                  {log.reason && (
                    <p className="text-sm text-muted-foreground">{log.reason}</p>
                  )}
                  {log.record_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Record ID: <code>{log.record_id}</code>
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(log.accessed_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs">
                    {new Date(log.accessed_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
