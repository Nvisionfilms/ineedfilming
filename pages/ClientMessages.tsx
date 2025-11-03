import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageSquare, Send, Loader2, Mail } from "lucide-react";
import { ClientNavigation } from "@/components/client/ClientNavigation";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  message: string;
  read: boolean;
  created_at: string;
  sender_profile?: { email: string; full_name: string | null };
}

const ClientMessages = () => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: "", message: "" });

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("client-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_messages",
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get admin user ID
      const { data: adminData, error: adminError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      if (adminError) {
        console.error("Error fetching admin:", adminError);
      }

      if (adminData) {
        setAdminId(adminData.user_id);
      } else {
        console.warn("No admin user found in user_roles table");
      }

      const { data: messagesData, error } = await supabase
        .from("client_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch sender profiles
      const messagesWithProfiles = await Promise.all(
        (messagesData || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", msg.sender_id)
            .single();

          return { ...msg, sender_profile: profile };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error: any) {
      toast.error(`Error loading messages: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!adminId) {
      toast.error("Unable to send message. Admin not found.");
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("client_messages").insert({
        sender_id: user.id,
        recipient_id: adminId,
        subject: newMessage.subject || null,
        message: newMessage.message,
      });

      if (error) throw error;

      toast.success("Message sent successfully");
      setDialogOpen(false);
      setNewMessage({ subject: "", message: "" });
      fetchMessages();
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("client_messages")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error: any) {
      console.error("Error marking message as read:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNavigation />
      
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-1">Communicate with your team</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Message to Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject (Optional)</Label>
                  <Input
                    id="subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    placeholder="Message subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={newMessage.message}
                    onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                    placeholder="Type your message here..."
                    rows={6}
                  />
                </div>
                <Button onClick={handleSendMessage} disabled={sending || !newMessage.message.trim()} className="w-full">
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {messages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">No messages yet. Start a conversation!</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((msg) => {
              const isReceived = msg.recipient_id !== msg.sender_id;

              return (
                <Card 
                  key={msg.id} 
                  className={!msg.read && isReceived ? "border-primary" : ""}
                  onClick={() => isReceived && !msg.read && markAsRead(msg.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Mail className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {msg.subject || "No subject"}
                          </span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          From: {msg.sender_profile?.full_name || msg.sender_profile?.email || "Unknown"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isReceived && !msg.read && (
                          <Badge variant="default">New</Badge>
                        )}
                        <Badge variant="outline">
                          {isReceived ? "Received" : "Sent"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-4">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ClientMessages;
