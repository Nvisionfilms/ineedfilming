import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Phone, Mail, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Location {
  id: string;
  project_id: string;
  name: string;
  address: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
}

export default function ProjectLocations() {
  const { projectId } = useParams();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (projectId) {
      fetchLocations();
    }
  }, [projectId]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await api.getLocations(projectId!);

      if (error) throw new Error(error);
      setLocations(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading locations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setAddress("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setNotes("");
  };

  const createLocation = async () => {
    if (!name.trim() || !address.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter location name and address",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await api.createLocation({
        project_id: projectId,
        name,
        address,
        contact_name: contactName || null,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        notes: notes || null,
      });

      if (error) throw new Error(error);

      toast({
        title: "Location added!",
        description: `${name} has been added to your locations`,
      });

      resetForm();
      setIsDialogOpen(false);
      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Error adding location",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteLocation = async (locationId: string, locationName: string) => {
    if (!confirm(`Are you sure you want to delete ${locationName}?`)) return;

    try {
      const { error } = await api.deleteLocation(locationId);

      if (error) throw new Error(error);

      toast({
        title: "Location deleted",
        description: `${locationName} has been removed`,
      });

      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Error deleting location",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground">
            Manage shoot locations and contact information
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location-name">Location Name *</Label>
                <Input
                  id="location-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Downtown Office Building"
                />
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact-name">Contact Name</Label>
                  <Input
                    id="contact-name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input
                    id="contact-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Parking info, access codes, special instructions..."
                  rows={4}
                />
              </div>

              <Button onClick={createLocation} disabled={isCreating} className="w-full">
                {isCreating ? "Adding..." : "Add Location"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations List */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first location to start organizing your shoots
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <Card key={location.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {location.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLocation(location.id, location.name)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Address:</p>
                  <p className="font-medium">{location.address}</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-auto text-xs"
                    onClick={() => openGoogleMaps(location.address)}
                  >
                    View on Google Maps →
                  </Button>
                </div>

                {location.contact_name && (
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">Contact:</p>
                    <p className="font-medium">{location.contact_name}</p>
                  </div>
                )}

                {location.contact_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${location.contact_phone}`} className="hover:underline">
                      {location.contact_phone}
                    </a>
                  </div>
                )}

                {location.contact_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${location.contact_email}`} className="hover:underline">
                      {location.contact_email}
                    </a>
                  </div>
                )}

                {location.notes && (
                  <div className="text-sm pt-2 border-t">
                    <p className="text-muted-foreground mb-1">Notes:</p>
                    <p className="text-xs">{location.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
