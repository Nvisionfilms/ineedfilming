import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Search, Archive, RotateCcw, Clock, User, Mail, Phone, Building, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminArchived = () => {
  const { toast } = useToast();
  const [archivedBookings, setArchivedBookings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadArchivedBookings();
  }, []);

  const loadArchivedBookings = async () => {
    try {
      const { data, error } = await api.getBookings();
      
      if (error) throw new Error(error);
      
      // Filter for archived bookings (not deleted permanently)
      const archived = (data || []).filter(
        (b: any) => b.archived_at && !b.deleted_permanently
      );
      
      // Sort by archived_at descending
      archived.sort((a: any, b: any) => 
        new Date(b.archived_at).getTime() - new Date(a.archived_at).getTime()
      );
      
      setArchivedBookings(archived);
    } catch (error: any) {
      toast({
        title: "Error loading archived bookings",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnarchive = async (bookingId: string) => {
    try {
      const { error } = await api.updateBooking(bookingId, {
        archived_at: null,
        archived_by: null
      });
      
      if (error) throw new Error(error);
      
      toast({
        title: "Booking restored",
        description: "The booking has been moved back to active bookings",
      });
      loadArchivedBookings();
    } catch (error: any) {
      toast({
        title: "Error restoring booking",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (bookingId: string) => {
    try {
      // First, get all projects and clear booking_id for any that reference this booking
      const { data: projects } = await api.getProjects();
      if (projects) {
        const affectedProjects = projects.filter((p: any) => p.booking_id === bookingId);
        for (const project of affectedProjects) {
          await api.request(`/api/projects/${project.id}`, {
            method: 'PUT',
            body: JSON.stringify({ booking_id: null })
          });
        }
      }

      // Now delete the booking
      const { error } = await api.deleteBooking(bookingId);
      
      if (error) throw new Error(error);
      
      toast({
        title: "Booking deleted permanently",
        description: "The booking has been removed from the system",
      });
      loadArchivedBookings();
    } catch (error: any) {
      toast({
        title: "Error deleting booking",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter bookings based on search and filters
  const filteredBookings = archivedBookings.filter((booking) => {
    const matchesSearch =
      booking.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.client_phone.includes(searchQuery) ||
      (booking.client_company && booking.client_company.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClientType = clientTypeFilter === "all" || booking.client_type === clientTypeFilter;

    return matchesSearch && matchesClientType;
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Archived Bookings</h1>
        <p className="text-muted-foreground">Projects that went ghost or never moved forward</p>
      </div>

      {/* Stats */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Archived</p>
            <p className="text-3xl font-bold">{archivedBookings.length}</p>
          </div>
          <Archive className="w-12 h-12 text-muted-foreground opacity-50" />
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search" className="mb-2 flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search Clients
            </Label>
            <Input
              id="search"
              placeholder="Name, email, phone, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="clientTypeFilter" className="mb-2 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Client Type
            </Label>
            <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
              <SelectTrigger id="clientTypeFilter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="commercial">Commercial/Agency</SelectItem>
                <SelectItem value="small_business">Small Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Archived Bookings List */}
      <div className="grid gap-6">
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-lg">
              {searchQuery || clientTypeFilter !== "all"
                ? "No archived bookings match your filters."
                : "No archived bookings yet."}
            </p>
          </Card>
        ) : (
          filteredBookings.map((booking) => {
            const isExpanded = expandedBookings[booking.id] || false;
            
            return (
              <Card key={booking.id} className="p-6 opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{booking.client_name}</h3>
                      <Badge variant="secondary">
                        ARCHIVED
                      </Badge>
                      <Badge variant="outline">
                        {booking.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Archived: {new Date(booking.archived_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-muted-foreground">
                      ${parseFloat(String(booking.requested_price)).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Deposit: ${parseFloat(String(booking.deposit_amount)).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Collapsible Details */}
                <Collapsible 
                  open={isExpanded} 
                  onOpenChange={(open) => setExpandedBookings(prev => ({ ...prev, [booking.id]: open }))}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full mb-2">
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Show Details
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                        {booking.client_email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                        {booking.client_phone}
                      </div>
                      {booking.client_company && (
                        <div className="flex items-center text-sm">
                          <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                          {booking.client_company}
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <User className="w-4 h-4 mr-2 text-muted-foreground" />
                        {booking.client_type === "commercial" ? "Commercial/Agency" : "Small Business"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Original Date: {booking.booking_date} at {booking.booking_time}
                    </div>

                    {booking.project_details && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground font-semibold mb-1">Project Details:</p>
                        <p className="text-sm">{booking.project_details}</p>
                      </div>
                    )}

                    {booking.admin_notes && (
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm font-semibold mb-1">Admin Notes:</p>
                        <p className="text-sm">{booking.admin_notes}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t flex justify-between gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Permanently
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Permanently delete this booking?</DialogTitle>
                            <DialogDescription>
                              This will permanently remove the booking from your system. This action cannot be undone and won't affect your graphs or statistics.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-3 justify-end mt-4">
                            <Button variant="outline" onClick={() => {}}>Cancel</Button>
                            <Button variant="destructive" onClick={() => handleDelete(booking.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Permanently
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        onClick={() => handleUnarchive(booking.id)}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restore to Active
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminArchived;
