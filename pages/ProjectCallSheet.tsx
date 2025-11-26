import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Download, Calendar, Clock, MapPin, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CallSheet {
  id: string;
  project_id: string;
  shoot_date: string;
  call_time: string;
  location_id: string | null;
  weather_notes: string | null;
  special_instructions: string | null;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  contact_name: string | null;
  contact_phone: string | null;
}

export default function ProjectCallSheet() {
  const { projectId } = useParams();
  const { toast } = useToast();
  const [callSheets, setCallSheets] = useState<CallSheet[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // New call sheet form
  const [shootDate, setShootDate] = useState("");
  const [callTime, setCallTime] = useState("08:00");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [weatherNotes, setWeatherNotes] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    if (projectId) {
      fetchCallSheets();
      fetchLocations();
    }
  }, [projectId]);

  const fetchCallSheets = async () => {
    try {
      const { data, error } = await api.getCallSheets(projectId!);
      const sorted = (data || []).sort((a: any, b: any) => 
        new Date(b.shoot_date).getTime() - new Date(a.shoot_date).getTime()
      );

      if (error) throw error;
      setCallSheets(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading call sheets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await api.getLocations(projectId!);

      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      console.error("Error loading locations:", error);
    }
  };

  const createCallSheet = async () => {
    if (!shootDate || !callTime) {
      toast({
        title: "Missing information",
        description: "Please enter shoot date and call time",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await api.request("/api/call-sheets", { method: "POST", body: JSON.stringify({
        project_id: projectId,
        shoot_date: shootDate,
        call_time: callTime,
        location_id: selectedLocation || null,
        weather_notes: weatherNotes || null,
        special_instructions: specialInstructions || null,
      }) });

      if (error) throw error;

      toast({
        title: "Call sheet created!",
        description: "Your call sheet has been created",
      });

      // Reset form
      setShootDate("");
      setCallTime("08:00");
      setSelectedLocation("");
      setWeatherNotes("");
      setSpecialInstructions("");

      fetchCallSheets();
    } catch (error: any) {
      toast({
        title: "Error creating call sheet",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const downloadCallSheet = (callSheet: CallSheet) => {
    // TODO: Generate PDF
    toast({
      title: "Coming soon!",
      description: "PDF export will be available soon",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading call sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Sheets</h1>
          <p className="text-muted-foreground">
            Create professional call sheets for your shoots
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Call Sheet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Call Sheet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shoot-date">Shoot Date</Label>
                  <Input
                    id="shoot-date"
                    type="date"
                    value={shootDate}
                    onChange={(e) => setShootDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="call-time">Call Time</Label>
                  <Input
                    id="call-time"
                    type="time"
                    value={callTime}
                    onChange={(e) => setCallTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <select
                  id="location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select a location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} - {loc.address}
                    </option>
                  ))}
                </select>
                {locations.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No locations added yet. Add locations first.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="weather">Weather Notes</Label>
                <Input
                  id="weather"
                  value={weatherNotes}
                  onChange={(e) => setWeatherNotes(e.target.value)}
                  placeholder="e.g., Sunny, 75°F"
                />
              </div>

              <div>
                <Label htmlFor="instructions">Special Instructions</Label>
                <Textarea
                  id="instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special notes for the crew..."
                  rows={4}
                />
              </div>

              <Button onClick={createCallSheet} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create Call Sheet"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Call Sheets List */}
      {callSheets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No call sheets yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first call sheet to organize your shoot
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {callSheets.map((sheet) => {
            const location = locations.find((l) => l.id === sheet.location_id);
            return (
              <Card key={sheet.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {new Date(sheet.shoot_date).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadCallSheet(sheet)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Call Time: {sheet.call_time}</span>
                  </div>

                  {location && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{location.name}</p>
                        <p className="text-muted-foreground text-xs">{location.address}</p>
                      </div>
                    </div>
                  )}

                  {sheet.weather_notes && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Weather:</p>
                      <p>{sheet.weather_notes}</p>
                    </div>
                  )}

                  {sheet.special_instructions && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Notes:</p>
                      <p className="line-clamp-2">{sheet.special_instructions}</p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full mt-4">
                    <Users className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
