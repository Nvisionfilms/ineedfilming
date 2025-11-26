import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Check, Clock, Video, GripVertical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShotListItem {
  id: string;
  shot_list_id: string;
  description: string;
  duration_seconds: number;
  status: string;
  notes: string | null;
  sort_order: number;
}

interface ShotList {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: string;
}

export default function ProjectShotList() {
  const { projectId } = useParams();
  const { toast } = useToast();
  const [shotLists, setShotLists] = useState<ShotList[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [shotItems, setShotItems] = useState<ShotListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // New shot list form
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");

  // New shot item form
  const [newShotDescription, setNewShotDescription] = useState("");
  const [newShotDuration, setNewShotDuration] = useState("5");
  const [newShotNotes, setNewShotNotes] = useState("");

  useEffect(() => {
    if (projectId) {
      fetchShotLists();
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedList) {
      fetchShotItems(selectedList);
    }
  }, [selectedList]);

  const fetchShotLists = async () => {
    try {
      const { data, error } = await supabase
        .from("shot_lists")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setShotLists(data || []);
      if (data && data.length > 0 && !selectedList) {
        setSelectedList(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error loading shot lists",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShotItems = async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from("shot_list_items")
        .select("*")
        .eq("shot_list_id", listId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setShotItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading shots",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createShotList = async () => {
    if (!newListName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the shot list",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("shot_lists")
        .insert({
          project_id: projectId,
          name: newListName,
          description: newListDescription || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Shot list created!",
        description: `${newListName} has been created`,
      });

      setNewListName("");
      setNewListDescription("");
      fetchShotLists();
      setSelectedList(data.id);
    } catch (error: any) {
      toast({
        title: "Error creating shot list",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addShotItem = async () => {
    if (!selectedList || !newShotDescription.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a shot description",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await api.request("/api/shot-lists/items", { method: "POST", body: JSON.stringify({
        shot_list_id: selectedList,
        description: newShotDescription,
        duration_seconds: parseInt(newShotDuration) || 5,
        notes: newShotNotes || null,
        status: "pending",
        sort_order: shotItems.length,
      }) });

      if (error) throw error;

      toast({
        title: "Shot added!",
        description: "Shot has been added to the list",
      });

      setNewShotDescription("");
      setNewShotDuration("5");
      setNewShotNotes("");
      fetchShotItems(selectedList);
    } catch (error: any) {
      toast({
        title: "Error adding shot",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateShotStatus = async (shotId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("shot_list_items")
        .update({ status })
        .eq("id", shotId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Shot marked as ${status}`,
      });

      fetchShotItems(selectedList!);
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteShotItem = async (shotId: string) => {
    if (!confirm("Are you sure you want to delete this shot?")) return;

    try {
      const { error } = await supabase
        .from("shot_list_items")
        .delete()
        .eq("id", shotId);

      if (error) throw error;

      toast({
        title: "Shot deleted",
        description: "Shot has been removed from the list",
      });

      fetchShotItems(selectedList!);
    } catch (error: any) {
      toast({
        title: "Error deleting shot",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Video className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTotalDuration = () => {
    return shotItems.reduce((sum, item) => sum + item.duration_seconds, 0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading shot lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shot Lists</h1>
          <p className="text-muted-foreground">
            Plan and organize your shots for this project
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Shot List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Shot List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="list-name">Name</Label>
                <Input
                  id="list-name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Main Shoot, B-Roll, Interviews"
                />
              </div>
              <div>
                <Label htmlFor="list-description">Description (Optional)</Label>
                <Textarea
                  id="list-description"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="What is this shot list for?"
                  rows={3}
                />
              </div>
              <Button onClick={createShotList} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create Shot List"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {shotLists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No shot lists yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first shot list to start planning your shoot
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shot Lists Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Shot Lists</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {shotLists.map((list) => (
                  <Button
                    key={list.id}
                    variant={selectedList === list.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedList(list.id)}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {list.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Shot Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{shotItems.length}</p>
                    <p className="text-sm text-muted-foreground">Total Shots</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {shotItems.filter((s) => s.status === "completed").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatDuration(getTotalDuration())}</p>
                    <p className="text-sm text-muted-foreground">Total Duration</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Shot Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Shot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shot-description">Shot Description</Label>
                  <Input
                    id="shot-description"
                    value={newShotDescription}
                    onChange={(e) => setNewShotDescription(e.target.value)}
                    placeholder="e.g., Wide shot of office building"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shot-duration">Duration (seconds)</Label>
                    <Input
                      id="shot-duration"
                      type="number"
                      value={newShotDuration}
                      onChange={(e) => setNewShotDuration(e.target.value)}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shot-notes">Notes (Optional)</Label>
                    <Input
                      id="shot-notes"
                      value={newShotNotes}
                      onChange={(e) => setNewShotNotes(e.target.value)}
                      placeholder="Any special notes"
                    />
                  </div>
                </div>
                <Button onClick={addShotItem} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Shot
                </Button>
              </CardContent>
            </Card>

            {/* Shot Items List */}
            <Card>
              <CardHeader>
                <CardTitle>Shots</CardTitle>
              </CardHeader>
              <CardContent>
                {shotItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No shots added yet. Add your first shot above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shotItems.map((shot, index) => (
                      <div
                        key={shot.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              #{index + 1}
                            </span>
                            <p className="font-medium">{shot.description}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{formatDuration(shot.duration_seconds)}</span>
                            {shot.notes && <span className="text-xs">• {shot.notes}</span>}
                          </div>
                        </div>
                        <Select
                          value={shot.status}
                          onValueChange={(value) => updateShotStatus(shot.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        {getStatusIcon(shot.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteShotItem(shot.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
